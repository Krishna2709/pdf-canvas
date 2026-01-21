import type { PDFPageProxy, TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

export interface Citation {
  id: string;
  pageHint?: number;
  quote: string;
  contextBefore?: string;
  contextAfter?: string;
}

export interface Field {
  key: string;
  label: string;
  value: string;
  type: 'string' | 'enum' | 'date' | 'number' | 'boolean';
  confidence: number;
  reasoning?: string;
  citations: Citation[];
}

export interface ExtractionResult {
  documentId: string;
  pageCount: number;
  fields: Field[];
}

export interface UploadResponse {
  documentId: string;
  filename: string;
  url: string;
  extraction: ExtractionResult;
}

// PDF Page Info
export interface PageInfo {
  pageIndex: number;
  pageNumber: number;
  viewport: {
    width: number;
    height: number;
    scale: number;
    rotation: number;
  };
  textContent: PageTextContent | null;
  rendered: boolean;
}

// Text content for a page
export interface PageTextContent {
  items: TextContentItem[];
  pageTextStrict: string;
  pageTextLoose: string;
  charToItemMap: CharToItemMapping[];
}

export interface TextContentItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
}

export interface CharToItemMapping {
  itemIndex: number;
  charOffset: number;
}

// Highlight types
export interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CitationMatch {
  citationId: string;
  pageIndex: number;
  matchStart: number;
  matchEnd: number;
  rects: HighlightRect[];
  confidence: number;
  matchType: 'exact' | 'loose' | 'fuzzy';
}

// Viewer state
export interface ViewerState {
  scale: number;
  rotation: number;
  currentPage: number;
  totalPages: number;
}

// Type guard for TextItem
export function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item && typeof item.str === 'string';
}

export type { PDFPageProxy };
