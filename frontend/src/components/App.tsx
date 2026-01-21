import { useCallback, useEffect } from 'react';
import { PdfViewer } from './PdfViewer';
import { ExtractionPanel } from './ExtractionPanel';
import { UploadZone } from './UploadZone';
import { useStore } from '../store/useStore';

export function App() {
  const { error, setError, setActiveCitation, activeCitationId } = useStore();

  // Clear active citation when clicking outside
  const handleBackgroundClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't clear if clicking on a citation button or highlight
      if (
        target.closest('.citation-btn') ||
        target.closest('.highlight-rect') ||
        target.closest('.field-card')
      ) {
        return;
      }

      // Clear active citation if clicking on PDF viewer background
      if (target.closest('.pdf-viewer-scroll') && activeCitationId) {
        setActiveCitation(null);
      }
    },
    [activeCitationId, setActiveCitation]
  );

  useEffect(() => {
    document.addEventListener('click', handleBackgroundClick);
    return () => document.removeEventListener('click', handleBackgroundClick);
  }, [handleBackgroundClick]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="font-semibold text-gray-800">PDF Canvas</h1>
        </div>
        <span className="text-xs text-gray-500">Document Review</span>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
          <span className="text-red-700 text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload zone */}
      <UploadZone />

      {/* Main content */}
      <main className="flex-1 flex min-h-0">
        <PdfViewer />
        <ExtractionPanel />
      </main>
    </div>
  );
}
