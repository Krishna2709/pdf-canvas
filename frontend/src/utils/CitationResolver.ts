/**
 * CitationResolver - Resolves citation quotes to page locations and highlight rectangles
 *
 * This is the core matching engine that:
 * 1. Selects candidate pages based on pageHint
 * 2. Searches for citation quotes using strict/loose/fuzzy matching
 * 3. Converts match positions to DOM highlight rectangles
 */

import type { Citation, CitationMatch, HighlightRect, PageTextContent } from '../types';
import { normalizeText } from './TextNormalizer';
import { findSubstringMatches, findFuzzyMatch } from './TextCache';

export interface PageReference {
  pageIndex: number;
  textContent: PageTextContent;
  textLayerElement: HTMLElement | null;
  containerElement: HTMLElement | null;
  scale: number;
}

export interface ResolverContext {
  totalPages: number;
  getPageTextContent: (pageIndex: number) => PageTextContent | undefined;
  getPageReference: (pageIndex: number) => PageReference | null;
}

/**
 * Resolves a citation to a match with highlight rectangles.
 *
 * @param citation - The citation to resolve
 * @param context - Context providing page access
 * @returns CitationMatch with page index and highlight rects, or null if not found
 */
export async function resolveCitation(
  citation: Citation,
  context: ResolverContext
): Promise<CitationMatch | null> {
  const normalizedQuote = normalizeText(citation.quote);

  // Step A: Candidate page selection
  const candidatePages = getCandidatePages(citation.pageHint, context.totalPages);

  // Step B-D: Search each candidate page
  for (const pageIndex of candidatePages) {
    const textContent = context.getPageTextContent(pageIndex);
    if (!textContent) continue;

    const match = findMatchOnPage(normalizedQuote, textContent, pageIndex);
    if (match) {
      // Step E: Convert to DOM rectangles
      const pageRef = context.getPageReference(pageIndex);
      if (pageRef?.textLayerElement) {
        const rects = computeHighlightRects(
          match.start,
          match.end,
          textContent,
          pageRef.textLayerElement,
          pageRef.scale
        );

        return {
          citationId: citation.id,
          pageIndex,
          matchStart: match.start,
          matchEnd: match.end,
          rects,
          confidence: match.confidence,
          matchType: match.type,
        };
      }
    }
  }

  return null;
}

/**
 * Resolves a citation using only cached text (no DOM rects).
 * Useful for quickly determining which page a citation is on.
 */
export function resolveCitationPageOnly(
  citation: Citation,
  context: Pick<ResolverContext, 'totalPages' | 'getPageTextContent'>
): { pageIndex: number; matchStart: number; matchEnd: number } | null {
  const normalizedQuote = normalizeText(citation.quote);
  const candidatePages = getCandidatePages(citation.pageHint, context.totalPages);

  for (const pageIndex of candidatePages) {
    const textContent = context.getPageTextContent(pageIndex);
    if (!textContent) continue;

    const match = findMatchOnPage(normalizedQuote, textContent, pageIndex);
    if (match) {
      return { pageIndex, matchStart: match.start, matchEnd: match.end };
    }
  }

  return null;
}

/**
 * Determines candidate pages to search, prioritizing pageHint.
 */
function getCandidatePages(pageHint: number | undefined, totalPages: number): number[] {
  const candidates: number[] = [];

  if (pageHint !== undefined && pageHint >= 1 && pageHint <= totalPages) {
    const hintIndex = pageHint - 1; // Convert to 0-indexed

    // Priority 1: Exact page hint
    candidates.push(hintIndex);

    // Priority 2: Adjacent pages (±2)
    for (let offset = 1; offset <= 2; offset++) {
      if (hintIndex - offset >= 0) candidates.push(hintIndex - offset);
      if (hintIndex + offset < totalPages) candidates.push(hintIndex + offset);
    }

    // Priority 3: All other pages
    for (let i = 0; i < totalPages; i++) {
      if (!candidates.includes(i)) {
        candidates.push(i);
      }
    }
  } else {
    // No page hint: search all pages in order
    for (let i = 0; i < totalPages; i++) {
      candidates.push(i);
    }
  }

  return candidates;
}

interface MatchResult {
  start: number;
  end: number;
  confidence: number;
  type: 'exact' | 'loose' | 'fuzzy';
}

/**
 * Attempts to find a match for the quote on a specific page.
 *
 * Tries matching in order:
 * 1. Strict (exact with punctuation)
 * 2. Loose (alphanumeric only)
 * 3. Fuzzy (similarity-based)
 */
function findMatchOnPage(
  normalizedQuote: { strict: string; loose: string },
  textContent: PageTextContent,
  _pageIndex: number
): MatchResult | null {
  // Attempt 1: Strict matching
  const strictMatches = findSubstringMatches(textContent.pageTextStrict, normalizedQuote.strict);
  if (strictMatches.length > 0) {
    // Return first match (could be improved with context matching)
    return {
      ...strictMatches[0],
      confidence: 1.0,
      type: 'exact',
    };
  }

  // Attempt 2: Loose matching
  const looseMatches = findSubstringMatches(textContent.pageTextLoose, normalizedQuote.loose);
  if (looseMatches.length > 0) {
    // Need to map loose indices back to strict indices
    const looseMatch = looseMatches[0];
    const strictRange = mapLooseToStrict(
      looseMatch.start,
      looseMatch.end,
      textContent.pageTextStrict,
      textContent.pageTextLoose
    );

    if (strictRange) {
      return {
        ...strictRange,
        confidence: 0.95,
        type: 'loose',
      };
    }
  }

  // Attempt 3: Fuzzy matching
  const fuzzyMatch = findFuzzyMatch(textContent.pageTextStrict, normalizedQuote.strict, 0.82);
  if (fuzzyMatch) {
    return {
      start: fuzzyMatch.start,
      end: fuzzyMatch.end,
      confidence: fuzzyMatch.similarity,
      type: 'fuzzy',
    };
  }

  return null;
}

/**
 * Maps indices from loose (no punctuation) text back to strict text.
 */
function mapLooseToStrict(
  looseStart: number,
  looseEnd: number,
  strictText: string,
  looseText: string
): { start: number; end: number } | null {
  // Build mapping from loose indices to strict indices
  const looseToStrict: number[] = [];
  let strictIdx = 0;

  for (let looseIdx = 0; looseIdx < looseText.length; looseIdx++) {
    // Find the corresponding character in strict text
    while (strictIdx < strictText.length) {
      const strictChar = strictText[strictIdx];
      const looseChar = looseText[looseIdx];

      // Skip non-alphanumeric in strict (except spaces)
      if (!/[a-z0-9\s]/.test(strictChar)) {
        strictIdx++;
        continue;
      }

      if (strictChar === looseChar) {
        looseToStrict.push(strictIdx);
        strictIdx++;
        break;
      }

      strictIdx++;
    }
  }

  if (looseToStrict.length === 0) return null;

  const strictStart = looseToStrict[looseStart] ?? 0;
  const strictEnd = looseToStrict[Math.min(looseEnd - 1, looseToStrict.length - 1)] + 1 ?? strictText.length;

  return { start: strictStart, end: strictEnd };
}

/**
 * Computes highlight rectangles from match indices by analyzing DOM text layer.
 *
 * @param matchStart - Start index in normalized page text
 * @param matchEnd - End index in normalized page text
 * @param textContent - Page text content with character mapping
 * @param textLayerElement - DOM element containing text layer spans
 * @param scale - Current zoom scale
 * @returns Array of highlight rectangles
 */
export function computeHighlightRects(
  matchStart: number,
  matchEnd: number,
  textContent: PageTextContent,
  textLayerElement: HTMLElement,
  _scale: number
): HighlightRect[] {
  const rects: HighlightRect[] = [];

  // Get all text spans in the text layer
  const spans = textLayerElement.querySelectorAll('span');
  if (spans.length === 0) return rects;

  // Map match indices back to text items
  const startMapping = textContent.charToItemMap[matchStart];
  const endMapping = textContent.charToItemMap[Math.min(matchEnd - 1, textContent.charToItemMap.length - 1)];

  if (!startMapping || !endMapping) return rects;

  // Find the spans corresponding to the text items
  const startItemIndex = startMapping.itemIndex;
  const endItemIndex = endMapping.itemIndex;

  // Get container rect for relative positioning
  const containerRect = textLayerElement.getBoundingClientRect();

  // Create ranges across the matching spans
  for (let itemIdx = startItemIndex; itemIdx <= endItemIndex && itemIdx < spans.length; itemIdx++) {
    const span = spans[itemIdx];
    if (!span || !span.firstChild) continue;

    const textNode = span.firstChild;
    if (textNode.nodeType !== Node.TEXT_NODE) continue;

    const textLength = textNode.textContent?.length ?? 0;
    if (textLength === 0) continue;

    try {
      const range = document.createRange();

      // Determine start/end offsets within this span
      let spanStartOffset = 0;
      let spanEndOffset = textLength;

      if (itemIdx === startItemIndex) {
        spanStartOffset = Math.min(startMapping.charOffset, textLength);
      }

      if (itemIdx === endItemIndex) {
        spanEndOffset = Math.min(endMapping.charOffset + 1, textLength);
      }

      range.setStart(textNode, spanStartOffset);
      range.setEnd(textNode, spanEndOffset);

      // Get client rects (may be multiple for wrapped text)
      const clientRects = range.getClientRects();

      for (const rect of clientRects) {
        rects.push({
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    } catch {
      // Range creation can fail for various DOM reasons; continue
      continue;
    }
  }

  // Merge adjacent rectangles on the same line
  return mergeRects(rects);
}

/**
 * Merges adjacent rectangles that are on the same line.
 */
function mergeRects(rects: HighlightRect[]): HighlightRect[] {
  if (rects.length <= 1) return rects;

  const sorted = [...rects].sort((a, b) => {
    if (Math.abs(a.top - b.top) < 5) {
      return a.left - b.left;
    }
    return a.top - b.top;
  });

  const merged: HighlightRect[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Check if on same line (within 5px) and adjacent (within 2px gap)
    if (
      Math.abs(current.top - next.top) < 5 &&
      next.left - (current.left + current.width) < 2
    ) {
      // Merge
      current = {
        left: current.left,
        top: Math.min(current.top, next.top),
        width: next.left + next.width - current.left,
        height: Math.max(current.height, next.height),
      };
    } else {
      merged.push(current);
      current = next;
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Recomputes highlight rectangles for a citation match.
 * Used after zoom/rotate changes.
 */
export function recomputeHighlightRects(
  match: CitationMatch,
  pageRef: PageReference
): HighlightRect[] {
  if (!pageRef.textLayerElement || !pageRef.textContent) {
    return [];
  }

  return computeHighlightRects(
    match.matchStart,
    match.matchEnd,
    pageRef.textContent,
    pageRef.textLayerElement,
    pageRef.scale
  );
}
