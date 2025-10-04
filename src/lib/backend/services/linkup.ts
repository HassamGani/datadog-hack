/**
 * LinkUp Service Client
 * For alternative data (employment trends, web traffic, etc.)
 */

import { getServiceConfig } from '../config';
import type { AltDataPoint, GetAltDataInput } from '../types';

export class LinkUpClient {
  private config = getServiceConfig().linkup;

  async getAltData(input: GetAltDataInput): Promise<AltDataPoint[]> {
    const { symbol, start, end } = input;

    const response = await fetch(`${this.config.baseUrl}/v1/metrics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_identifier: symbol,
        start_date: start,
        end_date: end,
        metrics: [
          'job_postings',
          'employee_count',
          'hiring_velocity',
          'web_traffic',
          'mobile_app_usage',
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LinkUp API error: ${response.statusText}`);
    }

    const data = await response.json();

    const altData: AltDataPoint[] = [];

    if (data.metrics) {
      for (const [metric, timeseries] of Object.entries(data.metrics)) {
        if (Array.isArray(timeseries)) {
          for (const point of timeseries) {
            altData.push({
              ts: point.date,
              metric,
              value: point.value,
            });
          }
        }
      }
    }

    return altData;
  }

  async getEmploymentTrends(symbol: string, start: string, end: string): Promise<any[]> {
    const response = await fetch(`${this.config.baseUrl}/v1/employment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_identifier: symbol,
        start_date: start,
        end_date: end,
      }),
    });

    if (!response.ok) {
      throw new Error(`LinkUp employment API error: ${response.statusText}`);
    }

    return await response.json();
  }
}

let linkupClient: LinkUpClient | null = null;

export function getLinkUpClient(): LinkUpClient {
  if (!linkupClient) {
    linkupClient = new LinkUpClient();
  }
  return linkupClient;
}
