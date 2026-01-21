/**
 * TextNormalizer - Handles text normalization for citation matching
 *
 * This module provides utilities to normalize text from PDFs and citation quotes
 * to enable accurate matching despite variations in whitespace, unicode, and formatting.
 */

export interface NormalizedText {
  strict: string;  // Keeps punctuation
  loose: string;   // Removes punctuation, alphanumeric + space only
  original: string;
}

/**
 * Normalizes text for citation matching.
 *
 * Steps:
 * 1. Unicode NFKC normalization (compatibility decomposition, canonical composition)
 * 2. Lowercase conversion
 * 3. Remove hyphenation at line breaks (e.g., "exam-\nple" -> "example")
 * 4. Collapse all whitespace to single spaces
 * 5. Trim leading/trailing whitespace
 *
 * @param text - Input text to normalize
 * @returns NormalizedText with strict and loose versions
 */
export function normalizeText(text: string): NormalizedText {
  const original = text;

  // Step 1: Unicode NFKC normalization
  let normalized = text.normalize('NFKC');

  // Step 2: Remove hyphenation at line breaks
  // Match hyphen followed by newline and optional whitespace, remove the hyphen and newline
  normalized = normalized.replace(/-\s*\n\s*/g, '');

  // Also handle soft hyphens (Unicode U+00AD)
  normalized = normalized.replace(/\u00AD/g, '');

  // Step 3: Collapse all whitespace (including newlines, tabs) to single spaces
  normalized = normalized.replace(/\s+/g, ' ');

  // Step 4: Trim
  normalized = normalized.trim();

  // Step 5: Lowercase for matching
  const strict = normalized.toLowerCase();

  // Step 6: For loose matching, remove all non-alphanumeric except spaces
  // This helps match when punctuation differs between citation and PDF text
  const loose = strict.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

  return { strict, loose, original };
}

/**
 * Creates a character mapping from normalized indices back to original indices.
 * This is useful for finding the original text range after a match in normalized text.
 *
 * @param original - Original text
 * @param normalized - Normalized text
 * @returns Array where index i contains the original index for normalized index i
 */
export function createNormalizedToOriginalMap(original: string, normalized: string): number[] {
  const map: number[] = [];
  let origIdx = 0;
  const origNorm = original.normalize('NFKC').replace(/-\s*\n\s*/g, '');

  for (let normIdx = 0; normIdx < normalized.length; normIdx++) {
    // Skip whitespace collapses in original
    while (origIdx < origNorm.length && /\s/.test(origNorm[origIdx])) {
      if (normalized[normIdx] === ' ') {
        // Found the collapsed space
        map.push(origIdx);
        origIdx++;
        // Skip remaining whitespace
        while (origIdx < origNorm.length && /\s/.test(origNorm[origIdx])) {
          origIdx++;
        }
        break;
      }
      origIdx++;
    }

    if (map.length <= normIdx) {
      map.push(origIdx);
      origIdx++;
    }
  }

  return map;
}

/**
 * Computes similarity between two strings using trigram Jaccard coefficient.
 *
 * @param a - First string
 * @param b - Second string
 * @returns Similarity score between 0 and 1
 */
export function trigramSimilarity(a: string, b: string): number {
  const trigramsA = getTrigrams(a);
  const trigramsB = getTrigrams(b);

  if (trigramsA.size === 0 && trigramsB.size === 0) return 1;
  if (trigramsA.size === 0 || trigramsB.size === 0) return 0;

  let intersection = 0;
  for (const trigram of trigramsA) {
    if (trigramsB.has(trigram)) {
      intersection++;
    }
  }

  const union = trigramsA.size + trigramsB.size - intersection;
  return intersection / union;
}

/**
 * Extracts trigrams (3-character sequences) from a string.
 */
function getTrigrams(text: string): Set<string> {
  const trigrams = new Set<string>();
  const padded = `  ${text}  `; // Pad to capture start/end

  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.slice(i, i + 3));
  }

  return trigrams;
}

/**
 * Computes Levenshtein distance between two strings.
 * Used for fuzzy matching when exact/loose matching fails.
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Computes normalized Levenshtein similarity (1 - distance/maxLength).
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Tokenizes text into words for word-level matching.
 */
export function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter(t => t.length > 0);
}

/**
 * Computes word-level Jaccard similarity.
 */
export function wordJaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(tokenize(a));
  const wordsB = new Set(tokenize(b));

  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) {
      intersection++;
    }
  }

  const union = wordsA.size + wordsB.size - intersection;
  return intersection / union;
}
