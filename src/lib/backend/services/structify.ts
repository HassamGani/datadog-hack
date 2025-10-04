/**
 * Structify Service Client
 * For extracting structured facts from documents
 */

import { getServiceConfig } from '../config';
import type { ExtractedFact, ExtractStructuredFromDocInput } from '../types';

export class StructifyClient {
  private config = getServiceConfig().structify;

  async extractFromDocument(input: ExtractStructuredFromDocInput): Promise<ExtractedFact[]> {
    const { doc_url, symbol } = input;

    const response = await fetch(`${this.config.baseUrl}/v1/extract`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: doc_url,
        schema: {
          type: 'financial_document',
          fields: [
            { name: 'earnings_date', type: 'date' },
            { name: 'revenue', type: 'number' },
            { name: 'eps', type: 'number' },
            { name: 'guidance', type: 'text' },
            { name: 'key_metrics', type: 'object' },
          ],
        },
        context: {
          symbol,
          document_type: 'auto',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Structify API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Convert structured data to facts
    const facts: ExtractedFact[] = [];

    if (data.extracted) {
      for (const [field, value] of Object.entries(data.extracted)) {
        if (value !== null && value !== undefined) {
          facts.push({
            ts: data.extracted.earnings_date || new Date().toISOString(),
            field,
            value: value as number | string,
            info: `Extracted from ${doc_url}`,
          });
        }
      }
    }

    return facts;
  }

  async extractFromText(text: string, symbol: string): Promise<ExtractedFact[]> {
    const response = await fetch(`${this.config.baseUrl}/v1/extract/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        schema: {
          type: 'financial_text',
          fields: [
            { name: 'date', type: 'date' },
            { name: 'metrics', type: 'array' },
            { name: 'sentiment', type: 'string' },
          ],
        },
        context: { symbol },
      }),
    });

    if (!response.ok) {
      throw new Error(`Structify text extraction error: ${response.statusText}`);
    }

    const data = await response.json();

    const facts: ExtractedFact[] = [];
    if (data.extracted?.metrics) {
      for (const metric of data.extracted.metrics) {
        facts.push({
          ts: data.extracted.date || new Date().toISOString(),
          field: metric.name,
          value: metric.value,
          info: metric.description || '',
        });
      }
    }

    return facts;
  }
}

let structifyClient: StructifyClient | null = null;

export function getStructifyClient(): StructifyClient {
  if (!structifyClient) {
    structifyClient = new StructifyClient();
  }
  return structifyClient;
}
