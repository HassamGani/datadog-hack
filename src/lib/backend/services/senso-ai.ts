/**
 * Senso.ai Service Client
 * For news and contextual retrieval
 */

import { getServiceConfig } from '../config';
import type { RawNews, GetRawNewsInput } from '../types';

/**
 * Real Senso.ai client (kept as-is)
 */
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

/**
 * No-op client used when Senso.ai is disabled or not configured.
 * Returns safe empty results so pipelines and tools can continue to operate.
 */
class NoopSensoAiClient {
  async searchNews(_: GetRawNewsInput): Promise<RawNews[]> {
    return [];
  }

  async getAltData(_: string, __: string, ___: string): Promise<any[]> {
    return [];
  }
}

let sensoAiClient: SensoAiClient | NoopSensoAiClient | null = null;

export function getSensoAiClient(): SensoAiClient | NoopSensoAiClient {
  if (!sensoAiClient) {
    const cfg = getServiceConfig().sensoAi;
    const disableFlag = (typeof process !== 'undefined' && process.env && process.env.DISABLE_SENSO === '1');

    if (!cfg.apiKey || disableFlag) {
      // Return a no-op client when the API key is missing or the feature flag is set
      sensoAiClient = new NoopSensoAiClient();
    } else {
      sensoAiClient = new SensoAiClient();
    }
  }
  return sensoAiClient;
}
