/**
 * ClickHouse Client
 * Provides database connectivity and query execution
 */

import { getServiceConfig } from '../config';
import type {
  DBPrice,
  DBStructuredEvent,
  DBAnnotation,
  DBAltData,
  PriceData,
  StructuredEvent,
  Annotation,
  AltDataPoint,
} from '../types';

export class ClickHouseClient {
  private config = getServiceConfig().clickhouse;
  private baseUrl: string;

  constructor() {
    const protocol = 'http'; // Use https in production
    this.baseUrl = `${protocol}://${this.config.host}:${this.config.port}`;
  }

  /**
   * Execute a query
   */
  private async query<T = any>(sql: string, format: string = 'JSONEachRow'): Promise<T[]> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('database', this.config.database);
    url.searchParams.set('query', sql);
    
    if (format) {
      url.searchParams.set('default_format', format);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-ClickHouse-User': this.config.username,
        'X-ClickHouse-Key': this.config.password,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ClickHouse query failed: ${error}`);
    }

    const text = await response.text();
    if (!text.trim()) return [];

    return text
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
  }

  /**
   * Insert data
   */
  private async insert(table: string, data: any[]): Promise<void> {
    if (data.length === 0) return;

    const url = new URL(this.baseUrl);
    url.searchParams.set('database', this.config.database);
    url.searchParams.set('query', `INSERT INTO ${table} FORMAT JSONEachRow`);

    const body = data.map((row) => JSON.stringify(row)).join('\n');

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'X-ClickHouse-User': this.config.username,
        'X-ClickHouse-Key': this.config.password,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ClickHouse insert failed: ${error}`);
    }
  }

  // ========== Prices ==========

  async getPrices(
    symbol: string,
    start: Date,
    end: Date,
    granularity: '1m' | '5m' | '1h' = '1m'
  ): Promise<PriceData[]> {
    const interval = granularity === '1m' ? 60 : granularity === '5m' ? 300 : 3600;
    
    const sql = `
      SELECT
        toUnixTimestamp(toStartOfInterval(ts, INTERVAL ${interval} SECOND)) * 1000 as ts,
        argMin(open, ts) as open,
        max(high) as high,
        min(low) as low,
        argMax(close, ts) as close,
        sum(volume) as volume
      FROM prices
      WHERE symbol = '${this.escape(symbol)}'
        AND ts >= '${start.toISOString()}'
        AND ts <= '${end.toISOString()}'
      GROUP BY toStartOfInterval(ts, INTERVAL ${interval} SECOND)
      ORDER BY ts
    `;

    const rows = await this.query<any>(sql);
    return rows.map((r) => ({
      ts: new Date(r.ts).toISOString(),
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume,
    }));
  }

  async insertPrices(prices: DBPrice[]): Promise<void> {
    const data = prices.map((p) => ({
      symbol: p.symbol,
      ts: Math.floor(p.ts.getTime() / 1000),
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }));
    await this.insert('prices', data);
  }

  // ========== Structured Events ==========

  async getStructuredEvents(symbol: string, start: Date, end: Date): Promise<StructuredEvent[]> {
    const sql = `
      SELECT
        toString(ts) as ts,
        type,
        summary,
        url,
        lang,
        translated_summary
      FROM events_structured
      WHERE symbol = '${this.escape(symbol)}'
        AND ts >= '${start.toISOString()}'
        AND ts <= '${end.toISOString()}'
      ORDER BY ts DESC
    `;

    return await this.query<StructuredEvent>(sql);
  }

  async insertStructuredEvents(events: DBStructuredEvent[]): Promise<void> {
    const data = events.map((e) => ({
      symbol: e.symbol,
      ts: Math.floor(e.ts.getTime() / 1000),
      type: e.type,
      summary: e.summary,
      url: e.url,
      lang: e.lang,
      translated_summary: e.translated_summary,
    }));
    await this.insert('events_structured', data);
  }

  // ========== Annotations ==========

  async getAnnotations(symbol: string, start: Date, end: Date): Promise<Annotation[]> {
    const sql = `
      SELECT
        toString(ts) as ts,
        tag,
        note,
        source_tool
      FROM annotations
      WHERE symbol = '${this.escape(symbol)}'
        AND ts >= '${start.toISOString()}'
        AND ts <= '${end.toISOString()}'
      ORDER BY ts DESC
    `;

    return await this.query<Annotation>(sql);
  }

  async insertAnnotations(annotations: DBAnnotation[]): Promise<void> {
    const data = annotations.map((a) => ({
      symbol: a.symbol,
      ts: Math.floor(a.ts.getTime() / 1000),
      tag: a.tag,
      note: a.note,
      source_tool: a.source_tool,
    }));
    await this.insert('annotations', data);
  }

  // ========== Alt Data ==========

  async getAltData(symbol: string, start: Date, end: Date): Promise<AltDataPoint[]> {
    const sql = `
      SELECT
        toString(ts) as ts,
        metric,
        value
      FROM alt_data
      WHERE symbol = '${this.escape(symbol)}'
        AND ts >= '${start.toISOString()}'
        AND ts <= '${end.toISOString()}'
      ORDER BY ts DESC
    `;

    return await this.query<AltDataPoint>(sql);
  }

  async insertAltData(altData: DBAltData[]): Promise<void> {
    const data = altData.map((a) => ({
      symbol: a.symbol,
      ts: Math.floor(a.ts.getTime() / 1000),
      metric: a.metric,
      value: a.value,
      source: 'linkup',
    }));
    await this.insert('alt_data', data);
  }

  // ========== Tool Metrics ==========

  async insertToolMetric(
    toolName: string,
    durationMs: number,
    success: boolean,
    error?: string,
    symbol?: string
  ): Promise<void> {
    await this.insert('tool_metrics', [
      {
        tool_name: toolName,
        ts: Math.floor(Date.now() / 1000),
        duration_ms: durationMs,
        success: success ? 1 : 0,
        error: error || '',
        symbol: symbol || '',
      },
    ]);
  }

  // ========== Utilities ==========

  private escape(str: string): string {
    return str.replace(/'/g, "\\'");
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let clickhouseClient: ClickHouseClient | null = null;

export function getClickHouseClient(): ClickHouseClient {
  if (!clickhouseClient) {
    clickhouseClient = new ClickHouseClient();
  }
  return clickhouseClient;
}
