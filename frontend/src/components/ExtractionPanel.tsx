import { useStore } from '../store/useStore';
import { FieldCard } from './FieldCard';

export function ExtractionPanel() {
  const { extraction, isLoading } = useStore();

  if (isLoading) {
    return (
      <div className="w-[30%] min-w-[320px] max-w-[480px] bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Processing document...</p>
        </div>
      </div>
    );
  }

  if (!extraction) {
    return (
      <div className="w-[30%] min-w-[320px] max-w-[480px] bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Upload a PDF to see extraction results</p>
      </div>
    );
  }

  return (
    <div className="w-[30%] min-w-[320px] max-w-[480px] bg-gray-50 border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Output</h2>
          <span className="text-xs text-gray-500">
            {extraction.fields.length} fields extracted
          </span>
        </div>
      </div>

      {/* Fields list */}
      <div className="flex-1 overflow-auto p-4">
        {extraction.fields.map((field) => (
          <FieldCard key={field.key} field={field} />
        ))}
      </div>
    </div>
  );
}
