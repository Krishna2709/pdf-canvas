import { useCallback, useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';
import type { Citation } from '../types';
import { useStore } from '../store/useStore';
import { resolveCitation } from '../utils/CitationResolver';

interface CitationButtonProps {
  citation: Citation;
}

export function CitationButton({ citation }: CitationButtonProps) {
  const {
    activeCitationId,
    setActiveCitation,
    setHoveredCitation,
    citationMatches,
    setCitationMatch,
    totalPages,
    getPageTextCache,
    setCurrentPage,
  } = useStore();

  const isActive = activeCitationId === citation.id;
  const resolvedRef = useRef(false);

  // Resolve citation on first hover/click
  const ensureResolved = useCallback(async () => {
    if (citationMatches.has(citation.id) || resolvedRef.current) {
      return;
    }

    resolvedRef.current = true;

    try {
      const match = await resolveCitation(citation, {
        totalPages,
        getPageTextContent: getPageTextCache,
        getPageReference: (pageIndex) => {
          // Get page element from DOM
          const pageElement = document.querySelector(
            `[data-page-index="${pageIndex}"]`
          ) as HTMLDivElement | null;

          if (!pageElement) return null;

          const textLayerElement = pageElement.querySelector(
            '.textLayer'
          ) as HTMLElement | null;

          const textContent = getPageTextCache(pageIndex);
          const scale = useStore.getState().scale;

          return {
            pageIndex,
            textContent: textContent || null,
            textLayerElement,
            containerElement: pageElement,
            scale,
          };
        },
      });

      if (match) {
        setCitationMatch(citation.id, match);
      }
    } catch (err) {
      console.error('Error resolving citation:', err);
    }
  }, [citation, totalPages, getPageTextCache, citationMatches, setCitationMatch]);

  // Handle click - navigate and highlight
  const handleClick = useCallback(async () => {
    await ensureResolved();

    // Toggle active state
    if (isActive) {
      setActiveCitation(null);
      return;
    }

    setActiveCitation(citation.id);

    // Navigate to page if match exists
    const match = citationMatches.get(citation.id);
    if (match) {
      // Navigate to page
      setCurrentPage(match.pageIndex + 1);

      // Scroll to page element
      setTimeout(() => {
        const pageElement = document.querySelector(
          `[data-page-index="${match.pageIndex}"]`
        );
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else if (citation.pageHint) {
      // If no match but we have pageHint, navigate there anyway
      setCurrentPage(citation.pageHint);
    }
  }, [
    citation,
    isActive,
    ensureResolved,
    setActiveCitation,
    citationMatches,
    setCurrentPage,
  ]);

  // Handle hover - preview highlight
  const handleMouseEnter = useCallback(async () => {
    await ensureResolved();
    setHoveredCitation(citation.id);
  }, [citation.id, ensureResolved, setHoveredCitation]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCitation(null);
  }, [setHoveredCitation]);

  // Pre-resolve citation when component mounts
  useEffect(() => {
    // Delay to avoid blocking initial render
    const timer = setTimeout(() => {
      ensureResolved();
    }, 500);

    return () => clearTimeout(timer);
  }, [ensureResolved]);

  const truncatedQuote =
    citation.quote.length > 100
      ? citation.quote.slice(0, 100) + '...'
      : citation.quote;

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`citation-btn w-full text-left ${isActive ? 'active' : ''}`}
    >
      <div className="flex items-start gap-2">
        <FileText size={14} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 italic break-words">
            "{truncatedQuote}"
          </p>
          {citation.pageHint && (
            <p className="text-xs text-gray-400 mt-1">Page {citation.pageHint}</p>
          )}
        </div>
      </div>
    </button>
  );
}
