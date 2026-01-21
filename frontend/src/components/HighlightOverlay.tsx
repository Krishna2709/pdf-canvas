import { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { HighlightRect, CitationMatch } from '../types';
import { recomputeHighlightRects } from '../utils/CitationResolver';

interface HighlightOverlayProps {
  pageIndex: number;
  textLayerRef: React.RefObject<HTMLDivElement>;
  scale: number;
}

export function HighlightOverlay({ pageIndex, textLayerRef, scale }: HighlightOverlayProps) {
  const {
    activeCitationId,
    hoveredCitationId,
    citationMatches,
    getPageTextCache,
  } = useStore();

  const [highlights, setHighlights] = useState<{
    active: HighlightRect[];
    hover: HighlightRect[];
  }>({ active: [], hover: [] });

  const [flashing, setFlashing] = useState(false);
  const prevActiveRef = useRef<string | null>(null);

  // Recompute highlights when citations or scale change
  useEffect(() => {
    const computeHighlights = () => {
      const activeRects: HighlightRect[] = [];
      const hoverRects: HighlightRect[] = [];

      // Get active citation match
      if (activeCitationId) {
        const match = citationMatches.get(activeCitationId);
        if (match && match.pageIndex === pageIndex && textLayerRef.current) {
          const textContent = getPageTextCache(pageIndex);
          if (textContent) {
            const rects = recomputeHighlightRects(match, {
              pageIndex,
              textContent,
              textLayerElement: textLayerRef.current,
              containerElement: textLayerRef.current.parentElement,
              scale,
            });
            activeRects.push(...rects);
          }
        }
      }

      // Get hover citation match (only if different from active)
      if (hoveredCitationId && hoveredCitationId !== activeCitationId) {
        const match = citationMatches.get(hoveredCitationId);
        if (match && match.pageIndex === pageIndex && textLayerRef.current) {
          const textContent = getPageTextCache(pageIndex);
          if (textContent) {
            const rects = recomputeHighlightRects(match, {
              pageIndex,
              textContent,
              textLayerElement: textLayerRef.current,
              containerElement: textLayerRef.current.parentElement,
              scale,
            });
            hoverRects.push(...rects);
          }
        }
      }

      setHighlights({ active: activeRects, hover: hoverRects });
    };

    computeHighlights();
  }, [
    pageIndex,
    activeCitationId,
    hoveredCitationId,
    citationMatches,
    scale,
    textLayerRef,
    getPageTextCache,
  ]);

  // Flash animation when active citation changes
  useEffect(() => {
    if (activeCitationId && activeCitationId !== prevActiveRef.current) {
      const match = citationMatches.get(activeCitationId);
      if (match && match.pageIndex === pageIndex) {
        setFlashing(true);
        const timer = setTimeout(() => setFlashing(false), 500);
        return () => clearTimeout(timer);
      }
    }
    prevActiveRef.current = activeCitationId;
  }, [activeCitationId, citationMatches, pageIndex]);

  const hasHighlights = highlights.active.length > 0 || highlights.hover.length > 0;

  if (!hasHighlights) {
    return null;
  }

  return (
    <div className="highlight-overlay">
      {/* Hover highlights (behind active) */}
      {highlights.hover.map((rect, index) => (
        <div
          key={`hover-${index}`}
          className="highlight-rect hover"
          style={{
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
        />
      ))}

      {/* Active highlights (in front) */}
      {highlights.active.map((rect, index) => (
        <div
          key={`active-${index}`}
          className={`highlight-rect active ${flashing ? 'flash' : ''}`}
          style={{
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
        />
      ))}
    </div>
  );
}
