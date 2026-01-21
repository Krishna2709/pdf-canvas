import { useEffect, useRef, useState, useCallback } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { TextLayerBuilder } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { useStore } from '../store/useStore';
import { HighlightOverlay } from './HighlightOverlay';

interface PdfPageProps {
  page: PDFPageProxy;
  pageIndex: number;
  scale: number;
  rotation: number;
  registerRef: (pageIndex: number, element: HTMLDivElement | null) => void;
}

export function PdfPage({ page, pageIndex, scale, rotation, registerRef }: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const renderTaskRef = useRef<ReturnType<PDFPageProxy['render']> | null>(null);

  // Register container ref
  useEffect(() => {
    registerRef(pageIndex, containerRef.current);
    return () => registerRef(pageIndex, null);
  }, [pageIndex, registerRef]);

  // Store text layer reference for highlight computation
  const storeTextLayerRef = useCallback(() => {
    // This is called after text layer is built
    // The CitationResolver will access this via DOM
  }, []);

  // Render page
  useEffect(() => {
    const canvas = canvasRef.current;
    const textLayerDiv = textLayerRef.current;

    if (!canvas || !textLayerDiv) return;

    let cancelled = false;

    const renderPage = async () => {
      // Cancel any existing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      // Calculate viewport with rotation
      const totalRotation = (page.rotate + rotation) % 360;
      const viewport = page.getViewport({ scale, rotation: totalRotation });

      // Set canvas dimensions
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      // Set container dimensions
      if (containerRef.current) {
        containerRef.current.style.width = `${Math.floor(viewport.width)}px`;
        containerRef.current.style.height = `${Math.floor(viewport.height)}px`;
      }

      // Set text layer dimensions
      textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
      textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;

      // Clear previous text layer content
      textLayerDiv.innerHTML = '';

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Transform for high DPI displays
      ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

      // Render canvas
      try {
        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });

        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (cancelled) return;

        // Render text layer
        const textContent = await page.getTextContent();

        if (cancelled) return;

        // Build text layer
        const textLayerBuilder = new TextLayerBuilder({
          pdfPage: page,
        });

        textLayerBuilder.div = textLayerDiv;

        await textLayerBuilder.render(viewport);

        if (cancelled) return;

        setRendered(true);
        storeTextLayerRef();
      } catch (err) {
        if (cancelled) return;
        // Ignore cancelled render errors
        if ((err as Error)?.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageIndex + 1}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [page, pageIndex, scale, rotation, storeTextLayerRef]);

  return (
    <div
      ref={containerRef}
      className="pdf-page-container"
      data-page-index={pageIndex}
      data-page-number={pageIndex + 1}
    >
      <canvas ref={canvasRef} />
      <div ref={textLayerRef} className="textLayer" />
      {rendered && (
        <HighlightOverlay
          pageIndex={pageIndex}
          textLayerRef={textLayerRef}
          scale={scale}
        />
      )}
    </div>
  );
}
