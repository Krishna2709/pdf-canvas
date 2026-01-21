# PDF Canvas - Document Review Application

A web application that replicates ExtendAI Studio's PDF review UI with text-based citation highlighting. The system finds cited text in rendered PDFs and highlights it accurately without requiring bounding box coordinates.

## Features

- **Split View Layout**: 70% PDF viewer on the left, 30% extraction panel on the right
- **PDF Viewer with Toolbar**: Zoom controls, page navigation, rotate, download
- **Text-Based Citation Highlighting**: Computes highlight rectangles from citation text only
- **Interactive Citations**: Click to navigate and highlight, hover to preview
- **Robust Text Matching**: Handles normalization, hyphenation, and fuzzy matching

## Architecture

```
pdf-canvas/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── App.tsx              # Main application
│   │   │   ├── PdfViewer.tsx        # PDF rendering container
│   │   │   ├── PdfPage.tsx          # Individual page with text layer
│   │   │   ├── PdfToolbar.tsx       # Zoom, navigation, actions
│   │   │   ├── HighlightOverlay.tsx # Citation highlight rendering
│   │   │   ├── ExtractionPanel.tsx  # Right panel with fields
│   │   │   ├── FieldCard.tsx        # Individual field display
│   │   │   ├── CitationButton.tsx   # Citation interaction handler
│   │   │   └── UploadZone.tsx       # PDF upload component
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand state management
│   │   │   └── useStore.ts          # Global state store
│   │   ├── types/            # TypeScript type definitions
│   │   │   └── index.ts             # All type definitions
│   │   ├── utils/            # Core utilities
│   │   │   ├── TextNormalizer.ts    # Text normalization functions
│   │   │   ├── TextCache.ts         # Page text caching
│   │   │   └── CitationResolver.ts  # Citation matching engine
│   │   └── styles/           # CSS styles
│   │       └── index.css            # Tailwind + custom styles
│   └── package.json
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── index.ts                 # Express server
│   │   └── utils/
│   │       └── mockExtraction.ts    # Mock extraction generator
│   └── package.json
└── README.md
```

## Data Contract

### Extraction Response

```typescript
interface ExtractionResult {
  documentId: string;
  pageCount: number;
  fields: Field[];
}

interface Field {
  key: string;
  label: string;
  value: string;
  type: 'string' | 'enum' | 'date' | 'number' | 'boolean';
  confidence: number;
  reasoning?: string;
  citations: Citation[];
}

interface Citation {
  id: string;
  pageHint?: number;       // Optional page number (1-indexed)
  quote: string;           // The cited text to find
  contextBefore?: string;  // Optional text before quote
  contextAfter?: string;   // Optional text after quote
}
```

### Example

```json
{
  "documentId": "doc_123",
  "pageCount": 44,
  "fields": [
    {
      "key": "contract_title",
      "label": "Contract Title",
      "value": "Carolinas Healthcare System Services Agreement",
      "type": "string",
      "confidence": 0.991,
      "citations": [
        {
          "id": "cite_001",
          "pageHint": 1,
          "quote": "CAROLINAS HEALTHCARE SYSTEM SERVICES AGREEMENT",
          "contextAfter": "THIS SERVICES AGREEMENT"
        }
      ]
    }
  ]
}
```

## Text Matching Algorithm

### Overview

Since bounding boxes are not provided, the system computes highlight rectangles by:
1. Matching citation quotes against PDF text content
2. Converting match positions to DOM ranges
3. Extracting rectangles from the DOM ranges

### Normalization Rules

Both citation quotes and PDF text undergo normalization:

1. **Unicode NFKC**: Compatibility decomposition followed by canonical composition
2. **Lowercase**: Case-insensitive matching
3. **Hyphenation Removal**: Patterns like `exam-\nple` become `example`
4. **Whitespace Collapse**: All whitespace sequences become single spaces
5. **Trim**: Remove leading/trailing whitespace

Two normalized forms are produced:
- **Strict**: Keeps punctuation (primary matching)
- **Loose**: Removes non-alphanumeric (fallback matching)

### Matching Strategy

The `CitationResolver` uses a multi-step approach:

#### Step A: Candidate Page Selection
1. If `pageHint` provided: search that page first
2. Search nearby pages (±2 from hint)
3. Search all pages if no match found

#### Step B: Text Content Building
For each page:
- Extract text content from PDF.js
- Build concatenated page text
- Create character-to-item mapping for DOM reconstruction

#### Step C: Match Finding
Attempt matching in order:
1. **Exact match**: Strict normalized substring search
2. **Loose match**: Alphanumeric-only substring search
3. **Fuzzy match**: Sliding window with trigram similarity (threshold ≥0.82)

#### Step D: DOM Range Conversion
Once match indices are found:
1. Map indices back to text content items
2. Find corresponding DOM spans in text layer
3. Create DOM Ranges across matching spans
4. Call `range.getClientRects()` for highlight rectangles
5. Convert to container-relative coordinates

### Code Example

```typescript
// Normalize citation quote
const normalizedQuote = normalizeText(citation.quote);
// { strict: "carolinas healthcare...", loose: "carolinas healthcare..." }

// Search page text
const match = findSubstringMatches(pageTextStrict, normalizedQuote.strict);

// If no match, try loose
if (!match) {
  const looseMatch = findSubstringMatches(pageTextLoose, normalizedQuote.loose);
}

// If still no match, try fuzzy
if (!match) {
  const fuzzyMatch = findFuzzyMatch(pageTextStrict, normalizedQuote.strict, 0.82);
}

// Convert to DOM rectangles
const rects = computeHighlightRects(
  matchStart,
  matchEnd,
  textContent,
  textLayerElement,
  scale
);
```

## Highlighting

### Highlight Overlay Layer

Each PDF page has an overlay div that renders highlight rectangles:

```css
.highlight-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 10;
}

.highlight-rect {
  background-color: rgba(255, 213, 79, 0.4);
  border: 1px solid rgba(255, 193, 7, 0.8);
}

.highlight-rect.active {
  background-color: rgba(255, 193, 7, 0.5);
  animation: highlight-flash 0.5s;
}
```

### Interactions

- **Click citation**: Navigate to page, scroll into view, show active highlight with flash
- **Hover citation**: Show preview highlight in lighter color
- **Click blank area**: Clear active highlight

### Zoom/Rotate Handling

Highlights are recomputed when zoom or rotation changes:
1. Store match indices (not rectangles) in state
2. On viewport change, recompute rectangles from DOM ranges
3. CSS animations provide smooth transitions

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Development

```bash
# Start backend (port 3001)
cd backend
npm run dev

# Start frontend (port 3000)
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build
npm start
```

## API Endpoints

### POST /api/upload
Upload a PDF and receive extraction results.

**Request**: `multipart/form-data` with `pdf` file field

**Response**:
```json
{
  "documentId": "uuid",
  "filename": "document.pdf",
  "url": "/uploads/uuid-document.pdf",
  "extraction": { ... }
}
```

### GET /api/extraction/:documentId
Get extraction results for a document.

### GET /uploads/:filename
Serve uploaded PDF files.

## Configuration

### Frontend (vite.config.ts)
- Development server: port 3000
- API proxy to backend: `/api` → `localhost:3001`
- PDF.js worker loaded from CDN

### Backend (src/index.ts)
- Server port: 3001 (or `PORT` env var)
- Max upload size: 50MB
- CORS enabled

## Edge Cases Handled

1. **Multi-line quotes**: Multiple rectangles rendered for wrapped text
2. **Duplicate quotes**: Prefers pageHint match, then earliest occurrence
3. **Imperfect OCR**: Loose normalization and fuzzy matching
4. **Hyphenation**: Removed during normalization
5. **Large PDFs**: Text cache built lazily per page

## Testing

```bash
# Run tests (when implemented)
cd frontend
npm test

cd backend
npm test
```

### Manual Testing

1. Upload a contract PDF
2. Verify extraction fields appear in right panel
3. Click a citation → page should navigate and highlight
4. Hover a different citation → preview highlight appears
5. Zoom in/out → highlights should scale correctly
6. Rotate → highlights should adapt

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **PDF Rendering**: PDF.js 4.x with text layer
- **State Management**: Zustand
- **Backend**: Node.js, Express, Multer
- **Icons**: Lucide React

## License

MIT
