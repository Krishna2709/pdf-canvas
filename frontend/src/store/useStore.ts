import { create } from 'zustand';
import type { ExtractionResult, CitationMatch, PageTextContent } from '../types';

interface StoreState {
  // Document state
  documentUrl: string | null;
  documentId: string | null;
  extraction: ExtractionResult | null;
  isLoading: boolean;
  error: string | null;

  // Viewer state
  scale: number;
  rotation: number;
  currentPage: number;
  totalPages: number;

  // Text cache per page (pageIndex -> PageTextContent)
  pageTextCache: Map<number, PageTextContent>;

  // Citation highlighting
  activeCitationId: string | null;
  hoveredCitationId: string | null;
  citationMatches: Map<string, CitationMatch>;

  // Actions
  setDocument: (url: string, id: string, extraction: ExtractionResult) => void;
  clearDocument: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setScale: (scale: number) => void;
  setRotation: (rotation: number) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;

  setPageTextCache: (pageIndex: number, content: PageTextContent) => void;
  getPageTextCache: (pageIndex: number) => PageTextContent | undefined;

  setActiveCitation: (citationId: string | null) => void;
  setHoveredCitation: (citationId: string | null) => void;
  setCitationMatch: (citationId: string, match: CitationMatch) => void;
  getCitationMatch: (citationId: string) => CitationMatch | undefined;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  documentUrl: null,
  documentId: null,
  extraction: null,
  isLoading: false,
  error: null,

  scale: 1.0,
  rotation: 0,
  currentPage: 1,
  totalPages: 0,

  pageTextCache: new Map(),
  activeCitationId: null,
  hoveredCitationId: null,
  citationMatches: new Map(),

  // Actions
  setDocument: (url, id, extraction) =>
    set({
      documentUrl: url,
      documentId: id,
      extraction,
      error: null,
      currentPage: 1,
      pageTextCache: new Map(),
      citationMatches: new Map(),
      activeCitationId: null,
      hoveredCitationId: null,
    }),

  clearDocument: () =>
    set({
      documentUrl: null,
      documentId: null,
      extraction: null,
      totalPages: 0,
      currentPage: 1,
      pageTextCache: new Map(),
      citationMatches: new Map(),
      activeCitationId: null,
      hoveredCitationId: null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setScale: (scale) => set({ scale }),
  setRotation: (rotation) => set({ rotation: rotation % 360 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),

  setPageTextCache: (pageIndex, content) => {
    const cache = new Map(get().pageTextCache);
    cache.set(pageIndex, content);
    set({ pageTextCache: cache });
  },

  getPageTextCache: (pageIndex) => get().pageTextCache.get(pageIndex),

  setActiveCitation: (citationId) => set({ activeCitationId: citationId }),
  setHoveredCitation: (citationId) => set({ hoveredCitationId: citationId }),

  setCitationMatch: (citationId, match) => {
    const matches = new Map(get().citationMatches);
    matches.set(citationId, match);
    set({ citationMatches: matches });
  },

  getCitationMatch: (citationId) => get().citationMatches.get(citationId),
}));
