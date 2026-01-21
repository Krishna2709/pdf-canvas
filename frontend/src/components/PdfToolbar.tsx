import { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface PdfToolbarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PdfToolbar({ currentPage, totalPages, onPageChange }: PdfToolbarProps) {
  const { scale, setScale, rotation, setRotation, documentUrl } = useStore();
  const [pageInput, setPageInput] = useState(String(currentPage));

  const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.findIndex((z) => z >= scale);
    const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
    setScale(zoomLevels[nextIndex]);
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.findIndex((z) => z >= scale);
    const prevIndex = Math.max(currentIndex - 1, 0);
    setScale(zoomLevels[prevIndex]);
  };

  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      setPageInput(String(currentPage - 1));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      setPageInput(String(currentPage + 1));
    }
  };

  const handleDownload = () => {
    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Update page input when currentPage changes externally
  if (String(currentPage) !== pageInput && document.activeElement?.tagName !== 'INPUT') {
    setPageInput(String(currentPage));
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
      {/* Left: Zoom controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          className="toolbar-btn"
          title="Zoom out"
          disabled={scale <= zoomLevels[0]}
        >
          <ZoomOut size={18} />
        </button>

        <span className="text-sm font-medium w-14 text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          className="toolbar-btn"
          title="Zoom in"
          disabled={scale >= zoomLevels[zoomLevels.length - 1]}
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Center: Page navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevPage}
          className="toolbar-btn"
          title="Previous page"
          disabled={currentPage <= 1}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1">
          <input
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            className="toolbar-input"
            aria-label="Current page"
          />
          <span className="text-sm text-gray-500">/ {totalPages}</span>
        </div>

        <button
          onClick={handleNextPage}
          className="toolbar-btn"
          title="Next page"
          disabled={currentPage >= totalPages}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Right: Rotate and download */}
      <div className="flex items-center gap-2">
        <button onClick={handleRotate} className="toolbar-btn" title="Rotate">
          <RotateCw size={18} />
        </button>

        <button
          onClick={handleDownload}
          className="toolbar-btn"
          title="Download"
          disabled={!documentUrl}
        >
          <Download size={18} />
        </button>
      </div>
    </div>
  );
}
