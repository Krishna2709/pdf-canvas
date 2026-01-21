import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { UploadResponse } from '../types';

export function UploadZone() {
  const { documentUrl, setDocument, clearDocument, setLoading, setError } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }

      setLoading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append('pdf', file);

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        });

        const response = await new Promise<UploadResponse>((resolve, reject) => {
          xhr.open('POST', '/api/upload');

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error('Invalid response'));
              }
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(formData);
        });

        // Set document in store
        setDocument(response.url, response.documentId, response.extraction);
      } catch (err) {
        console.error('Upload error:', err);
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setLoading(false);
        setUploadProgress(0);
      }
    },
    [setDocument, setLoading, setError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (documentUrl) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 flex-1">
          <FileText size={20} className="text-blue-600" />
          <span className="text-sm text-gray-700 truncate">Document loaded</span>
        </div>
        <button
          onClick={clearDocument}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
          <span>Clear</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploadProgress > 0 ? (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <>
            <Upload size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 font-medium">Drop a PDF file here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse</p>
          </>
        )}
      </div>
    </div>
  );
}
