export interface Citation {
  id: string;
  pageHint?: number;
  quote: string;
  contextBefore?: string;
  contextAfter?: string;
}

export interface Field {
  key: string;
  label: string;
  value: string;
  type: 'string' | 'enum' | 'date' | 'number' | 'boolean';
  confidence: number;
  reasoning?: string;
  citations: Citation[];
}

export interface ExtractionResult {
  documentId: string;
  pageCount: number;
  fields: Field[];
}

export function generateMockExtraction(documentId: string, _filename: string): ExtractionResult {
  // This generates realistic mock extraction data
  // In production, this would come from an actual extraction service

  return {
    documentId,
    pageCount: 44, // Typical contract length
    fields: [
      {
        key: 'contract_title',
        label: 'Contract Title',
        value: 'Carolinas Healthcare System Services Agreement',
        type: 'string',
        confidence: 0.991,
        reasoning: 'The title is clearly stated at the top of page 1.',
        citations: [
          {
            id: 'cite_001',
            pageHint: 1,
            quote: 'CAROLINAS HEALTHCARE SYSTEM SERVICES AGREEMENT',
            contextBefore: '',
            contextAfter: 'THIS SERVICES AGREEMENT',
          },
        ],
      },
      {
        key: 'contract_type',
        label: 'Contract Type',
        value: 'laundry_linen',
        type: 'enum',
        confidence: 0.977,
        reasoning:
          'The agreement is for healthcare medical apparel and linen services as stated in the Background section.',
        citations: [
          {
            id: 'cite_002',
            pageHint: 1,
            quote:
              'Contractor is in the business of providing healthcare medical apparel and linen services and related products.',
            contextBefore: 'CSS Members',
            contextAfter: 'CSS desires to engage',
          },
        ],
      },
      {
        key: 'contract_status',
        label: 'Contract Status',
        value: 'active',
        type: 'enum',
        confidence: 0.976,
        reasoning: 'The contract has an effective date and no termination date mentioned.',
        citations: [
          {
            id: 'cite_003',
            pageHint: 1,
            quote: 'dated as of January 1, 2016',
            contextBefore: 'this Agreement',
            contextAfter: 'Effective Date',
          },
        ],
      },
      {
        key: 'effective_date',
        label: 'Effective Date',
        value: '2016-01-01',
        type: 'date',
        confidence: 0.995,
        reasoning: 'Explicitly stated in the opening paragraph of the agreement.',
        citations: [
          {
            id: 'cite_004',
            pageHint: 1,
            quote: 'January 1, 2016 ("Effective Date")',
            contextBefore: 'dated as of',
            contextAfter: 'is entered into',
          },
        ],
      },
      {
        key: 'party_a_name',
        label: 'Party A Name',
        value: 'CAROLINAS SHARED SERVICES, LLC',
        type: 'string',
        confidence: 0.988,
        reasoning: 'CSS is identified as the first party in the agreement.',
        citations: [
          {
            id: 'cite_005',
            pageHint: 1,
            quote: 'CAROLINAS SHARED SERVICES, LLC, a North Carolina limited liability company ("CSS")',
            contextBefore: 'entered into by and between',
            contextAfter: 'and Image First',
          },
        ],
      },
      {
        key: 'party_b_name',
        label: 'Party B Name',
        value: 'Image First of North Carolina, LLC dba IMAGEFIRST HEALTHCARE LAUNDRY SPECIALISTS',
        type: 'string',
        confidence: 0.982,
        reasoning: 'The Contractor is identified in the opening paragraph.',
        citations: [
          {
            id: 'cite_006',
            pageHint: 1,
            quote: 'Image First of North Carolina, LLC dba IMAGEFIRST HEALTHCARE LAUNDRY SPECIALISTS ("Contractor")',
            contextBefore: 'CSS), and',
            contextAfter: 'BACKGROUND',
          },
        ],
      },
      {
        key: 'css_description',
        label: 'CSS Description',
        value: 'Regional group purchasing organization with authority to negotiate contracts for members and affiliates',
        type: 'string',
        confidence: 0.945,
        reasoning: 'The Background section describes the role of CSS.',
        citations: [
          {
            id: 'cite_007',
            pageHint: 1,
            quote:
              'CSS is a regional group purchasing organization and has the authority to negotiate contracts for certain products and services on behalf of the members and Affiliates of CSS',
            contextBefore: 'BACKGROUND',
            contextAfter: 'CSS Members',
          },
        ],
      },
      {
        key: 'participant_definition',
        label: 'Participant Definition',
        value: 'CSS Member that elects to participate in this Agreement',
        type: 'string',
        confidence: 0.923,
        reasoning: 'The agreement defines participants as CSS Members who elect to participate.',
        citations: [
          {
            id: 'cite_008',
            pageHint: 1,
            quote:
              'For each CSS Member that elects to participate in this Agreement (a "Participant"), there will be a participation exhibit to this Agreement',
            contextBefore: 'purchase services from Contractor',
            contextAfter: 'financial and operational terms',
          },
        ],
      },
      {
        key: 'affiliate_definition',
        label: 'Affiliate Definition',
        value: 'Entity owned directly or indirectly at least one hundred percent (100%) by the CSS Member',
        type: 'string',
        confidence: 0.918,
        reasoning: 'The definition of Affiliate is explicitly stated in the document.',
        citations: [
          {
            id: 'cite_009',
            pageHint: 1,
            quote:
              'the term "Affiliate" will mean an entity in which a Participant either owns directly or indirectly at least one hundred percent (100%) of such entity',
            contextBefore: 'For purposes hereof',
            contextAfter: 'CSS represents',
          },
        ],
      },
      {
        key: 'parties_reference',
        label: 'Parties Reference',
        value: 'CSS, Participants and Contractor may be referred to individually as a "Party" and collectively as the "Parties"',
        type: 'string',
        confidence: 0.956,
        reasoning: 'The document explicitly defines how parties are referenced.',
        citations: [
          {
            id: 'cite_010',
            pageHint: 1,
            quote:
              'CSS, Participants and Contractor may sometimes be referred to herein individually as a "Party" and collectively as the "Parties"',
            contextBefore: 'terms and conditions of this Agreement',
            contextAfter: 'AGREEMENT',
          },
        ],
      },
      {
        key: 'consideration_clause',
        label: 'Consideration Clause',
        value: 'For good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged and agreed',
        type: 'string',
        confidence: 0.967,
        reasoning: 'Standard legal consideration language found in the Agreement section.',
        citations: [
          {
            id: 'cite_011',
            pageHint: 1,
            quote:
              'NOW, THEREFORE, for good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged and agreed, the Parties agree as follows',
            contextBefore: 'AGREEMENT',
            contextAfter: 'Parties/Terms of Agreement',
          },
        ],
      },
      {
        key: 'schedule_reference',
        label: 'Schedule Reference',
        value: 'Schedule 1',
        type: 'string',
        confidence: 0.934,
        reasoning: 'Schedule 1 is referenced for the list of participants.',
        citations: [
          {
            id: 'cite_012',
            pageHint: 1,
            quote: 'A list of the Participants that are purchasing Services (as defined below) from Contractor under this Agreement is attached hereto as Schedule 1',
            contextBefore: 'Parties/Terms of Agreement',
            contextAfter: 'Subject to the terms',
          },
        ],
      },
    ],
  };
}
