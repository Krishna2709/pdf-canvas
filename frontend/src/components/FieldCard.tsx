import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Quote } from 'lucide-react';
import type { Field } from '../types';
import { CitationButton } from './CitationButton';

interface FieldCardProps {
  field: Field;
}

export function FieldCard({ field }: FieldCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCitations, setShowCitations] = useState(false);

  const confidenceClass =
    field.confidence >= 0.95
      ? 'confidence-high'
      : field.confidence >= 0.85
        ? 'confidence-medium'
        : 'confidence-low';

  const formatValue = (value: string, type: string) => {
    if (type === 'date') {
      try {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        return value;
      }
    }
    return value;
  };

  const typeLabel = {
    string: 'string',
    enum: 'enum',
    date: 'date',
    number: 'number',
    boolean: 'boolean',
  };

  return (
    <div className="field-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-800">{field.label}</h3>
            <span className="type-badge">{typeLabel[field.type]}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            ocrConfidence={field.confidence.toFixed(3)}
          </p>
        </div>
        <span className={`confidence-badge ${confidenceClass}`}>
          {Math.round(field.confidence * 100)}%
        </span>
      </div>

      {/* Value */}
      <div className="bg-gray-50 rounded-md p-3 mb-3">
        <p className="text-gray-800 text-sm break-words">
          {formatValue(field.value, field.type)}
        </p>
      </div>

      {/* Reasoning section */}
      {field.reasoning && (
        <div className="mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
          >
            <Sparkles size={14} />
            <span>Reasoning</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isExpanded && (
            <div className="mt-2 p-2 bg-purple-50 rounded text-sm text-gray-700 border border-purple-100">
              {field.reasoning}
            </div>
          )}
        </div>
      )}

      {/* Citations section */}
      {field.citations.length > 0 && (
        <div>
          <button
            onClick={() => setShowCitations(!showCitations)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Quote size={14} />
            <span>Citations</span>
            <span className="text-xs text-gray-500">({field.citations.length})</span>
            {showCitations ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showCitations && (
            <div className="mt-2 space-y-2">
              {field.citations.map((citation) => (
                <CitationButton key={citation.id} citation={citation} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
