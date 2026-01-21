/**
 * TextCache - Builds and caches text content from PDF pages
 *
 * Extracts text from PDF.js pages and creates searchable indices
 * with character-level mapping back to text items.
 */

import type { PDFPageProxy } from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
import type { PageTextContent, TextContentItem, CharToItemMapping } from '../types';
import { normalizeText } from './TextNormalizer';

// Type guard for TextItem
function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item && typeof item.str === 'string';
}

/**
 * Builds a PageTextContent object from a PDF page.
 *
 * This creates:
 * - items: Array of text content items with metadata
 * - pageTextStrict: Concatenated, normalized text (with punctuation)
 * - pageTextLoose: Concatenated, normalized text (alphanumeric only)
 * - charToItemMap: Maps each character index to its source item
 */
export async function buildPageTextContent(page: PDFPageProxy): Promise<PageTextContent> {
  const textContent = await page.getTextContent();
  const items: TextContentItem[] = [];
  const charToItemMap: CharToItemMapping[] = [];

  let rawText = '';

  // Process each text item
  for (let i = 0; i < textContent.items.length; i++) {
    const item = textContent.items[i];

    if (!isTextItem(item)) continue;

    const textItem: TextContentItem = {
      str: item.str,
      dir: item.dir,
      width: item.width,
      height: item.height,
      transform: item.transform,
      fontName: item.fontName,
      hasEOL: item.hasEOL,
    };

    items.push(textItem);

    // Map each character to this item
    for (let charIdx = 0; charIdx < item.str.length; charIdx++) {
      charToItemMap.push({
        itemIndex: items.length - 1,
        charOffset: charIdx,
      });
    }

    rawText += item.str;

    // Add space or newline between items if needed
    if (item.hasEOL) {
      rawText += '\n';
      charToItemMap.push({ itemIndex: items.length - 1, charOffset: item.str.length });
    } else if (i < textContent.items.length - 1) {
      // Add space between words if they don't already have one
      const nextItem = textContent.items[i + 1];
      if (isTextItem(nextItem) && !item.str.endsWith(' ') && !nextItem.str.startsWith(' ')) {
        // Check if there's a significant horizontal gap (indicating word boundary)
        const itemEndX = item.transform[4] + item.width;
        const nextStartX = nextItem.transform[4];
        const avgCharWidth = item.width / Math.max(item.str.length, 1);

        if (nextStartX - itemEndX > avgCharWidth * 0.3) {
          rawText += ' ';
          charToItemMap.push({ itemIndex: items.length - 1, charOffset: item.str.length });
        }
      }
    }
  }

  // Normalize the text
  const normalized = normalizeText(rawText);

  return {
    items,
    pageTextStrict: normalized.strict,
    pageTextLoose: normalized.loose,
    charToItemMap: buildNormalizedCharMap(rawText, normalized.strict, charToItemMap),
  };
}

/**
 * Creates a mapping from normalized text character indices to raw text indices.
 *
 * This allows us to find matches in normalized text and map them back
 * to the original text items.
 */
function buildNormalizedCharMap(
  rawText: string,
  normalizedStrict: string,
  rawCharToItemMap: CharToItemMapping[]
): CharToItemMapping[] {
  const result: CharToItemMapping[] = [];

  // First, create a mapping from raw to normalized indices
  const rawToNormalized: number[] = [];
  let normalizedIdx = 0;

  // Normalize in the same way as normalizeText
  let tempText = rawText.normalize('NFKC');
  tempText = tempText.replace(/-\s*\n\s*/g, '');
  tempText = tempText.replace(/\u00AD/g, '');

  // Map through raw text to normalized text
  const rawNormalized = rawText.normalize('NFKC');
  let rawIdx = 0;
  let normIdx = 0;

  const collapseWs = (text: string) => text.replace(/\s+/g, ' ').trim().toLowerCase();
  const collapsed = collapseWs(tempText);

  // Build character-by-character mapping
  // This is complex due to whitespace collapsing, so we use a simpler approach:
  // Map each normalized character to the first matching raw character

  for (let ni = 0; ni < collapsed.length; ni++) {
    // Find corresponding position in raw text
    // We need to track position accounting for normalization transforms

    // Simple approach: scan through raw, matching normalized chars
    while (rawIdx < rawCharToItemMap.length) {
      const rawChar = rawText[rawIdx]?.toLowerCase().normalize('NFKC');
      const normChar = collapsed[ni];

      if (normChar === ' ') {
        // Whitespace was collapsed - find any whitespace in raw
        if (/\s/.test(rawText[rawIdx] || '')) {
          result.push(rawCharToItemMap[rawIdx]);
          // Skip remaining whitespace
          while (rawIdx < rawCharToItemMap.length && /\s/.test(rawText[rawIdx] || '')) {
            rawIdx++;
          }
          break;
        }
      } else if (rawChar === normChar) {
        result.push(rawCharToItemMap[rawIdx]);
        rawIdx++;
        break;
      }

      rawIdx++;
    }

    // If we couldn't find a match, use the last known position
    if (result.length <= ni && rawCharToItemMap.length > 0) {
      result.push(rawCharToItemMap[Math.min(rawIdx, rawCharToItemMap.length - 1)]);
    }
  }

  return result;
}

/**
 * Searches for a substring in the page text and returns match positions.
 *
 * @param pageText - Normalized page text
 * @param query - Normalized query string
 * @returns Array of {start, end} positions
 */
export function findSubstringMatches(
  pageText: string,
  query: string
): Array<{ start: number; end: number }> {
  const matches: Array<{ start: number; end: number }> = [];

  if (!query || !pageText) return matches;

  let pos = 0;
  while ((pos = pageText.indexOf(query, pos)) !== -1) {
    matches.push({ start: pos, end: pos + query.length });
    pos += 1; // Move forward to find overlapping matches
  }

  return matches;
}

/**
 * Performs fuzzy matching using a sliding window approach.
 *
 * Slides a window of approximately the query length across the page text
 * and computes similarity scores.
 *
 * @param pageText - Normalized page text
 * @param query - Normalized query string
 * @param threshold - Minimum similarity threshold (0-1)
 * @returns Best match if above threshold, null otherwise
 */
export function findFuzzyMatch(
  pageText: string,
  query: string,
  threshold: number = 0.82
): { start: number; end: number; similarity: number } | null {
  if (!query || !pageText) return null;

  const queryLen = query.length;
  const windowSize = Math.floor(queryLen * 1.2); // Allow some variation
  const minWindowSize = Math.floor(queryLen * 0.8);

  let bestMatch: { start: number; end: number; similarity: number } | null = null;

  // Tokenize query for word-level matching
  const queryWords = query.split(/\s+/).filter(w => w.length > 0);
  const queryWordSet = new Set(queryWords);

  // Slide window across page text
  for (let start = 0; start <= pageText.length - minWindowSize; start++) {
    // Try different window sizes
    for (let winSize = minWindowSize; winSize <= windowSize && start + winSize <= pageText.length; winSize++) {
      const window = pageText.slice(start, start + winSize);

      // Quick pre-filter: check word overlap
      const windowWords = window.split(/\s+/).filter(w => w.length > 0);
      const windowWordSet = new Set(windowWords);

      let wordOverlap = 0;
      for (const word of queryWordSet) {
        if (windowWordSet.has(word)) wordOverlap++;
      }

      const wordCoverage = wordOverlap / queryWordSet.size;
      if (wordCoverage < 0.5) continue; // Skip if less than 50% word overlap

      // Compute character-level similarity
      const similarity = computeStringSimilarity(query, window);

      if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { start, end: start + winSize, similarity };
      }
    }
  }

  return bestMatch;
}

/**
 * Computes string similarity using a combination of methods.
 */
function computeStringSimilarity(a: string, b: string): number {
  // Use trigram similarity for longer strings
  const trigramSim = computeTrigramSimilarity(a, b);

  // Use word overlap as well
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 0));
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 0));

  let wordOverlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) wordOverlap++;
  }

  const wordSim = wordsA.size > 0 ? wordOverlap / wordsA.size : 0;

  // Weighted combination
  return trigramSim * 0.6 + wordSim * 0.4;
}

/**
 * Computes trigram Jaccard similarity.
 */
function computeTrigramSimilarity(a: string, b: string): number {
  const trigramsA = getTrigrams(a);
  const trigramsB = getTrigrams(b);

  if (trigramsA.size === 0 && trigramsB.size === 0) return 1;
  if (trigramsA.size === 0 || trigramsB.size === 0) return 0;

  let intersection = 0;
  for (const trigram of trigramsA) {
    if (trigramsB.has(trigram)) intersection++;
  }

  const union = trigramsA.size + trigramsB.size - intersection;
  return intersection / union;
}

function getTrigrams(text: string): Set<string> {
  const trigrams = new Set<string>();
  for (let i = 0; i < text.length - 2; i++) {
    trigrams.add(text.slice(i, i + 3));
  }
  return trigrams;
}
