/**
 * Backend Types for Agent Orchestrator
 */

// Tool Input/Output Types
export interface GetPricesInput {
  symbol: string;
  start: string; // ISO8601
  end: string; // ISO8601
  granularity: '1m' | '5m' | '1h';
}

export interface PriceData {
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface GetPricesOutput {
  data: PriceData[];
  meta: {
    symbol: string;
    count: number;
    start: string;
    end: string;
  };
}

export interface GetStructuredEventsInput {
  symbol: string;
  start: string;
  end: string;
}

export interface StructuredEvent {
  ts: string;
  type: string;
  summary: string;
  url: string;
  lang: string;
  translated_summary: string;
}

export interface GetStructuredEventsOutput {
  events: StructuredEvent[];
}

export interface GetRawNewsInput {
  symbol: string;
  start: string;
  end: string;
  limit: number;
}

export interface RawNews {
  ts: string;
  source: string;
  headline: string;
  content: string;
  lang: string;
  url: string;
}

export interface GetRawNewsOutput {
  news: RawNews[];
}

export interface TranslateTextsInput {
  texts: Array<{
    id: string;
    lang: string;
    text: string;
  }>;
  target_lang: string;
}

export interface TranslateTextsOutput {
  translations: Array<{
    id: string;
    translated: string;
  }>;
}

export interface ExtractStructuredFromDocInput {
  doc_url: string;
  symbol: string;
}

export interface ExtractedFact {
  ts: string;
  field: string;
  value: number | string;
  info: string;
}

export interface ExtractStructuredFromDocOutput {
  facts: ExtractedFact[];
}

export interface GetAltDataInput {
  symbol: string;
  start: string;
  end: string;
}

export interface AltDataPoint {
  ts: string;
  metric: string;
  value: number;
}

export interface GetAltDataOutput {
  alt: AltDataPoint[];
}

export interface DetectInflectionPointsInput {
  symbol: string;
  start: string;
  end: string;
  sensitivity: number;
}

export interface InflectionPoint {
  ts: string;
  score: number;
}

export interface DetectInflectionPointsOutput {
  points: InflectionPoint[];
}

export interface GetHealthMetricsInput {
  metrics: string[];
}

export interface HealthMetric {
  metric: string;
  value: number;
}

export interface GetHealthMetricsOutput {
  results: HealthMetric[];
}

// Agent Request/Response Types
export interface AnnotationRequest {
  symbol: string;
  start: string;
  end: string;
  question: string;
}

export interface Annotation {
  ts: string;
  tag: string;
  note: string;
  source_tool: string;
}

export interface AnnotationResponse {
  annotations: Annotation[];
  explanation: string;
}

// Database Models
export interface DBPrice {
  symbol: string;
  ts: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DBStructuredEvent {
  symbol: string;
  ts: Date;
  type: string;
  summary: string;
  url: string;
  lang: string;
  translated_summary: string;
}

export interface DBAnnotation {
  symbol: string;
  ts: Date;
  tag: string;
  note: string;
  source_tool: string;
}

export interface DBAltData {
  symbol: string;
  ts: Date;
  metric: string;
  value: number;
}

// Tool Registry
export type ToolName =
  | 'get_prices'
  | 'get_structured_events'
  | 'get_raw_news'
  | 'translate_texts'
  | 'extract_structured_from_doc'
  | 'get_alt_data'
  | 'detect_inflection_points'
  | 'get_health_metrics';

export interface ToolDefinition {
  name: ToolName;
  description: string;
  inputSchema: object;
  handler: (input: any) => Promise<any>;
}

// Configuration
export interface ServiceConfig {
  clickhouse: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  sensoAi: {
    apiKey: string;
    baseUrl: string;
  };
  structify: {
    apiKey: string;
    baseUrl: string;
  };
  deepl: {
    apiKey: string;
    baseUrl: string;
  };
  linkup: {
    apiKey: string;
    baseUrl: string;
  };
  openai: {
    apiKey: string;
    baseUrl?: string;
    model: string;
  };
  truefoundry: {
    apiKey: string;
    gatewayUrl: string;
  };
  datadog: {
    apiKey: string;
    appKey: string;
    site: string;
  };
}

// Pipeline Types
export interface PipelineJob {
  id: string;
  type: 'news' | 'prices' | 'alt_data';
  symbol: string;
  start: string;
  end: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: Date;
}
