# CLAUDE.md - AI Assistant Guide for pdf-canvas

This document provides guidance for AI assistants working on the pdf-canvas project.

## Project Overview

**pdf-canvas** is a document review web application that replicates ExtendAI Studio's PDF review UI. It features a split-view layout with a PDF viewer on the left and an extraction panel on the right, with text-based citation highlighting computed from citation text (no bounding boxes required).

## Repository Structure

```
pdf-canvas/
├── CLAUDE.md                  # This file - AI assistant guidance
├── README.md                  # Project documentation
├── frontend/                  # React + TypeScript + Vite application
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx           # Application entry point
│       ├── vite-env.d.ts
│       ├── components/        # React components
│       │   ├── App.tsx              # Main application shell
│       │   ├── PdfViewer.tsx        # PDF rendering with PDF.js
│       │   ├── PdfPage.tsx          # Individual page with text layer
│       │   ├── PdfToolbar.tsx       # Zoom, navigation, rotate, download
│       │   ├── HighlightOverlay.tsx # Citation highlight rectangles
│       │   ├── ExtractionPanel.tsx  # Right panel with extracted fields
│       │   ├── FieldCard.tsx        # Individual field display
│       │   ├── CitationButton.tsx   # Citation click/hover handlers
│       │   └── UploadZone.tsx       # PDF file upload
│       ├── store/
│       │   └── useStore.ts          # Zustand global state
│       ├── types/
│       │   └── index.ts             # TypeScript type definitions
│       ├── utils/
│       │   ├── TextNormalizer.ts    # Text normalization for matching
│       │   ├── TextCache.ts         # Page text content caching
│       │   └── CitationResolver.ts  # Citation-to-highlight resolution
│       └── styles/
│           └── index.css            # Tailwind + custom styles
└── backend/                   # Node.js + Express API
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts                 # Express server setup
        └── utils/
            └── mockExtraction.ts    # Mock extraction data generator
```

## Development Commands

```bash
# Backend development (runs on port 3001)
cd backend
npm install
npm run dev

# Frontend development (runs on port 3000, proxies to backend)
cd frontend
npm install
npm run dev

# Production builds
cd frontend && npm run build
cd backend && npm run build && npm start
```

## Key Technical Details

### PDF.js Integration

- Uses Mozilla PDF.js 4.x with text layer enabled
- Worker loaded from CDN: `cdnjs.cloudflare.com/ajax/libs/pdf.js/{version}/pdf.worker.min.js`
- Each page renders: canvas (visuals) + text layer (selectable/searchable text)
- Text content extracted via `page.getTextContent()` for citation matching

### Citation Resolution Algorithm

The `CitationResolver` in `frontend/src/utils/CitationResolver.ts` implements a multi-step matching strategy:

1. **Candidate Page Selection**: pageHint → nearby pages → all pages
2. **Text Normalization**: Unicode NFKC, lowercase, remove hyphenation, collapse whitespace
3. **Matching Attempts**:
   - Strict: Exact substring with punctuation
   - Loose: Alphanumeric-only substring
   - Fuzzy: Trigram similarity (threshold ≥ 0.82)
4. **DOM Range Conversion**: Match indices → text layer spans → `Range.getClientRects()`

### State Management

Zustand store (`frontend/src/store/useStore.ts`) manages:
- Document URL and extraction results
- Viewer state (scale, rotation, current page)
- Page text cache (lazy-loaded per page)
- Active/hovered citation highlighting

### Data Contract

```typescript
interface ExtractionResult {
  documentId: string;
  pageCount: number;
  fields: Field[];
}

interface Citation {
  id: string;
  pageHint?: number;    // Optional 1-indexed page number
  quote: string;        // Text to find and highlight
  contextBefore?: string;
  contextAfter?: string;
}
```

## Code Style Conventions

1. **TypeScript**: Strict mode enabled, explicit types for public APIs
2. **React**: Functional components with hooks, avoid class components
3. **Styling**: Tailwind CSS utilities + custom CSS classes in `index.css`
4. **Imports**: Use `@/` alias for `src/` directory imports
5. **State**: Zustand for global state, local state for component-specific UI

### Commit Message Format

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example: `feat: add support for multi-page citation spans`

## AI Assistant Instructions

### When Working on This Codebase

1. **Understand the Flow**: PDF upload → extraction API → viewer render → citation click → highlight
2. **Preserve Text Layer**: The text layer is critical for citation matching - don't disable it
3. **Test Citation Matching**: When modifying `CitationResolver`, test with various quote formats
4. **Handle Edge Cases**: Multi-line text, duplicate quotes, fuzzy matches, zoom/rotate

### Key Files to Understand

| File | Purpose |
|------|---------|
| `PdfViewer.tsx` | Loads PDF, manages pages, handles scrolling |
| `PdfPage.tsx` | Renders canvas + text layer per page |
| `CitationResolver.ts` | Core matching logic - the brain of highlighting |
| `TextNormalizer.ts` | Text preparation for reliable matching |
| `HighlightOverlay.tsx` | Renders yellow rectangles over matched text |
| `useStore.ts` | Global state including citation matches cache |

### Common Modification Scenarios

| Task | Approach |
|------|----------|
| Add new extraction field type | Update `types/index.ts`, adjust `FieldCard.tsx` display |
| Improve matching accuracy | Modify `CitationResolver.ts` matching logic |
| Change highlight appearance | Edit `.highlight-rect` styles in `index.css` |
| Add PDF annotation support | Extend `PdfPage.tsx`, may need annotation layer |
| Optimize large PDFs | Implement page virtualization in `PdfViewer.tsx` |

### Code Quality Checklist

Before committing:
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Citation highlighting works for test documents
- [ ] Zoom/rotate doesn't break highlights
- [ ] Upload flow completes successfully
- [ ] No console errors in browser

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload PDF, returns extraction JSON |
| GET | `/api/extraction/:id` | Get extraction for document |
| GET | `/uploads/:filename` | Serve uploaded PDF files |

## Resources

- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Configuration](https://vitejs.dev/config/)

---

*Last updated: 2026-01-21*
