import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { useStore } from '../store/useStore';
import { buildPageTextContent } from '../utils/TextCache';
import { PdfToolbar } from './PdfToolbar';
import { PdfPage } from './PdfPage';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export function PdfViewer() {
  const { documentUrl, scale, rotation, setTotalPages, setCurrentPage, totalPages, currentPage } =
    useStore();

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Load PDF document
  useEffect(() => {
    if (!documentUrl) {
      setPdfDoc(null);
      setPages([]);
      return;
    }

    let cancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadingTask = pdfjsLib.getDocument(documentUrl);
        const doc = await loadingTask.promise;

        if (cancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);

        // Load all pages (for smaller documents)
        // For large documents, this could be virtualized
        const loadedPages: PDFPageProxy[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          loadedPages.push(page);
        }

        if (cancelled) return;

        setPages(loadedPages);
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [documentUrl, setTotalPages]);

  // Build text cache for each page
  useEffect(() => {
    if (pages.length === 0) return;

    const { setPageTextCache, getPageTextCache } = useStore.getState();

    pages.forEach(async (page, index) => {
      // Skip if already cached
      if (getPageTextCache(index)) return;

      try {
        const textContent = await buildPageTextContent(page);
        setPageTextCache(index, textContent);
      } catch (err) {
        console.error(`Error building text cache for page ${index + 1}:`, err);
      }
    });
  }, [pages]);

  // Scroll to page when currentPage changes
  const scrollToPage = useCallback(
    (pageNum: number) => {
      const pageElement = pageRefs.current.get(pageNum - 1);
      if (pageElement && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const pageRect = pageElement.getBoundingClientRect();
        const scrollTop =
          containerRef.current.scrollTop + (pageRect.top - containerRect.top) - 20;

        containerRef.current.scrollTo({
          top: scrollTop,
          behavior: 'smooth',
        });
      }
    },
    []
  );

  // Handle scroll to update current page
  const handleScroll = useCallback(() => {
    if (!containerRef.current || pages.length === 0) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    let closestPage = 1;
    let closestDistance = Infinity;

    pageRefs.current.forEach((element, pageIndex) => {
      const rect = element.getBoundingClientRect();
      const pageCenter = rect.top + rect.height / 2;
      const distance = Math.abs(pageCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = pageIndex + 1;
      }
    });

    if (closestPage !== currentPage) {
      setCurrentPage(closestPage);
    }
  }, [pages.length, currentPage, setCurrentPage]);

  // Register page ref
  const registerPageRef = useCallback((pageIndex: number, element: HTMLDivElement | null) => {
    if (element) {
      pageRefs.current.set(pageIndex, element);
    } else {
      pageRefs.current.delete(pageIndex);
    }
  }, []);

  if (!documentUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-500">
        <p>Upload a PDF to view it here</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-600">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100 min-w-0">
      <PdfToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={scrollToPage}
      />

      <div
        ref={containerRef}
        className="flex-1 overflow-auto pdf-viewer-scroll p-4"
        onScroll={handleScroll}
      >
        {pages.map((page, index) => (
          <PdfPage
            key={index}
            page={page}
            pageIndex={index}
            scale={scale}
            rotation={rotation}
            registerRef={registerPageRef}
          />
        ))}
      </div>
    </div>
  );
}
