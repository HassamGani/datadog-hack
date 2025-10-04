/**
 * Senso.ai Service Client
 * For news and contextual retrieval
 */

import { getServiceConfig } from '../config';
import type { RawNews, GetRawNewsInput } from '../types';

export class SensoAiClient {
  private config = getServiceConfig().sensoAi;

  async searchNews(input: GetRawNewsInput): Promise<RawNews[]> {
    const { symbol, start, end, limit } = input;

    const response = await fetch(`${this.config.baseUrl}/v1/search/news`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: symbol,
        start_date: start,
        end_date: end,
        limit,
        filters: {
          sources: ['financial_news', 'sec_filings', 'press_releases'],
          relevance_threshold: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Senso.ai API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.results.map((item: any) => ({
      ts: item.published_at,
      source: item.source,
      headline: item.title,
      content: item.content || item.summary || '',
      lang: item.language || 'en',
      url: item.url,
    }));
  }

  async getAltData(symbol: string, start: string, end: string): Promise<any[]> {
    // Senso.ai alternative data endpoints (employment, web traffic, etc.)
    const response = await fetch(`${this.config.baseUrl}/v1/alt-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol,
        start_date: start,
        end_date: end,
        metrics: ['web_traffic', 'social_sentiment', 'app_downloads'],
      }),
    });

    if (!response.ok) {
      throw new Error(`Senso.ai alt data API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.metrics || [];
  }
}

let sensoAiClient: SensoAiClient | null = null;

export function getSensoAiClient(): SensoAiClient {
  if (!sensoAiClient) {
    sensoAiClient = new SensoAiClient();
  }
  return sensoAiClient;
}
