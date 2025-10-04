/**
 * Datadog MCP Client
 * For observability and health metrics
 */

import { getServiceConfig } from '../config';
import type { GetHealthMetricsInput, HealthMetric } from '../types';

export class DatadogClient {
  private config = getServiceConfig().datadog;
  private baseUrl: string;

  constructor() {
    this.baseUrl = `https://api.${this.config.site}`;
  }

  async getHealthMetrics(input: GetHealthMetricsInput): Promise<HealthMetric[]> {
    const { metrics } = input;

    const queries = metrics.map((metric) => {
      return this.queryMetric(metric);
    });

    const results = await Promise.allSettled(queries);

    return results.map((result, idx) => {
      if (result.status === 'fulfilled') {
        return {
          metric: metrics[idx],
          value: result.value,
        };
      } else {
        return {
          metric: metrics[idx],
          value: -1, // Error indicator
        };
      }
    });
  }

  private async queryMetric(metricName: string): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 300; // Last 5 minutes

    const response = await fetch(
      `${this.baseUrl}/api/v1/query?query=${encodeURIComponent(metricName)}&from=${from}&to=${now}`,
      {
        headers: {
          'DD-API-KEY': this.config.apiKey,
          'DD-APPLICATION-KEY': this.config.appKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Datadog API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Get the most recent value
    if (data.series && data.series.length > 0) {
      const series = data.series[0];
      const points = series.pointlist;
      if (points && points.length > 0) {
        return points[points.length - 1][1];
      }
    }

    return 0;
  }

  async sendMetric(metricName: string, value: number, tags?: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/series`, {
      method: 'POST',
      headers: {
        'DD-API-KEY': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        series: [
          {
            metric: metricName,
            points: [[Math.floor(Date.now() / 1000), value]],
            type: 'gauge',
            tags: tags || [],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Datadog send metric error: ${response.statusText}`);
    }
  }

  async sendEvent(title: string, text: string, tags?: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/events`, {
      method: 'POST',
      headers: {
        'DD-API-KEY': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        text,
        tags: tags || [],
        alert_type: 'info',
      }),
    });

    if (!response.ok) {
      throw new Error(`Datadog send event error: ${response.statusText}`);
    }
  }

  async trackToolInvocation(
    toolName: string,
    durationMs: number,
    success: boolean,
    symbol?: string
  ): Promise<void> {
    const tags = [`tool:${toolName}`, `success:${success}`];
    if (symbol) tags.push(`symbol:${symbol}`);

    await Promise.all([
      this.sendMetric('trading_agent.tool.duration', durationMs, tags),
      this.sendMetric('trading_agent.tool.invocation', 1, tags),
    ]);
  }
}

let datadogClient: DatadogClient | null = null;

export function getDatadogClient(): DatadogClient {
  if (!datadogClient) {
    datadogClient = new DatadogClient();
  }
  return datadogClient;
}
