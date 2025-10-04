/**
 * Tool Implementations
 * Each tool wraps a backend capability with timeout, error handling, and observability
 */

import { getClickHouseClient } from '../clickhouse/client';
import { getSensoAiClient } from '../services/senso-ai';
import { getStructifyClient } from '../services/structify';
import { getDeepLClient } from '../services/deepl';
import { getLinkUpClient } from '../services/linkup';
import { getDatadogClient } from '../services/datadog';
import { TOOL_TIMEOUTS } from '../config';
import type {
  GetPricesInput,
  GetPricesOutput,
  GetStructuredEventsInput,
  GetStructuredEventsOutput,
  GetRawNewsInput,
  GetRawNewsOutput,
  TranslateTextsInput,
  TranslateTextsOutput,
  ExtractStructuredFromDocInput,
  ExtractStructuredFromDocOutput,
  GetAltDataInput,
  GetAltDataOutput,
  DetectInflectionPointsInput,
  DetectInflectionPointsOutput,
  GetHealthMetricsInput,
  GetHealthMetricsOutput,
  ToolDefinition,
} from '../types';

/**
 * Utility to wrap tool execution with timeout and observability
 */
async function withTimeout<T>(
  toolName: string,
  fn: () => Promise<T>,
  timeoutMs: number,
  symbol?: string
): Promise<T> {
  const startTime = Date.now();
  const clickhouse = getClickHouseClient();
  const datadog = getDatadogClient();

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Tool ${toolName} timed out`)), timeoutMs)
    );

    const result = await Promise.race([fn(), timeoutPromise]);
    const duration = Date.now() - startTime;

    // Track metrics
    await Promise.all([
      clickhouse.insertToolMetric(toolName, duration, true, undefined, symbol),
      datadog.trackToolInvocation(toolName, duration, true, symbol),
    ]).catch(() => {}); // Don't fail the tool if metrics fail

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Track failure
    await Promise.all([
      clickhouse.insertToolMetric(toolName, duration, false, errorMsg, symbol),
      datadog.trackToolInvocation(toolName, duration, false, symbol),
    ]).catch(() => {});

    throw error;
  }
}

/**
 * Tool: get_prices
 */
export const getPricesTool: ToolDefinition = {
  name: 'get_prices',
  description: 'Retrieve historical price data for a symbol within a time range',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol (e.g., TSLA, AAPL)' },
      start: { type: 'string', description: 'Start time (ISO8601)' },
      end: { type: 'string', description: 'End time (ISO8601)' },
      granularity: {
        type: 'string',
        enum: ['1m', '5m', '1h'],
        description: 'Time granularity',
      },
    },
    required: ['symbol', 'start', 'end', 'granularity'],
  },
  handler: async (input: GetPricesInput): Promise<GetPricesOutput> => {
    return withTimeout(
      'get_prices',
      async () => {
        const clickhouse = getClickHouseClient();
        const data = await clickhouse.getPrices(
          input.symbol,
          new Date(input.start),
          new Date(input.end),
          input.granularity
        );

        return {
          data,
          meta: {
            symbol: input.symbol,
            count: data.length,
            start: input.start,
            end: input.end,
          },
        };
      },
      TOOL_TIMEOUTS.get_prices,
      input.symbol
    );
  },
};

/**
 * Tool: get_structured_events
 */
export const getStructuredEventsTool: ToolDefinition = {
  name: 'get_structured_events',
  description: 'Retrieve structured events (news, filings) for a symbol',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string' },
      start: { type: 'string', description: 'Start time (ISO8601)' },
      end: { type: 'string', description: 'End time (ISO8601)' },
    },
    required: ['symbol', 'start', 'end'],
  },
  handler: async (input: GetStructuredEventsInput): Promise<GetStructuredEventsOutput> => {
    return withTimeout(
      'get_structured_events',
      async () => {
        const clickhouse = getClickHouseClient();
        const events = await clickhouse.getStructuredEvents(
          input.symbol,
          new Date(input.start),
          new Date(input.end)
        );

        return { events };
      },
      TOOL_TIMEOUTS.get_structured_events,
      input.symbol
    );
  },
};

/**
 * Tool: get_raw_news
 */
export const getRawNewsTool: ToolDefinition = {
  name: 'get_raw_news',
  description: 'Retrieve raw news articles from Senso.ai',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string' },
      start: { type: 'string' },
      end: { type: 'string' },
      limit: { type: 'number', description: 'Max number of articles' },
    },
    required: ['symbol', 'start', 'end', 'limit'],
  },
  handler: async (input: GetRawNewsInput): Promise<GetRawNewsOutput> => {
    return withTimeout(
      'get_raw_news',
      async () => {
        const sensoAi = getSensoAiClient();
        const news = await sensoAi.searchNews(input);
        return { news };
      },
      TOOL_TIMEOUTS.get_raw_news,
      input.symbol
    );
  },
};

/**
 * Tool: translate_texts
 */
export const translateTextsTool: ToolDefinition = {
  name: 'translate_texts',
  description: 'Translate texts from various languages to target language using DeepL',
  inputSchema: {
    type: 'object',
    properties: {
      texts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            lang: { type: 'string' },
            text: { type: 'string' },
          },
        },
      },
      target_lang: { type: 'string', description: 'Target language (e.g., "en")' },
    },
    required: ['texts', 'target_lang'],
  },
  handler: async (input: TranslateTextsInput): Promise<TranslateTextsOutput> => {
    return withTimeout(
      'translate_texts',
      async () => {
        const deepl = getDeepLClient();
        return await deepl.translateTexts(input);
      },
      TOOL_TIMEOUTS.translate_texts
    );
  },
};

/**
 * Tool: extract_structured_from_doc
 */
export const extractStructuredFromDocTool: ToolDefinition = {
  name: 'extract_structured_from_doc',
  description: 'Extract structured facts from a document URL using Structify',
  inputSchema: {
    type: 'object',
    properties: {
      doc_url: { type: 'string', description: 'URL to document (PDF, webpage)' },
      symbol: { type: 'string' },
    },
    required: ['doc_url', 'symbol'],
  },
  handler: async (
    input: ExtractStructuredFromDocInput
  ): Promise<ExtractStructuredFromDocOutput> => {
    return withTimeout(
      'extract_structured_from_doc',
      async () => {
        const structify = getStructifyClient();
        const facts = await structify.extractFromDocument(input);
        return { facts };
      },
      TOOL_TIMEOUTS.extract_structured_from_doc,
      input.symbol
    );
  },
};

/**
 * Tool: get_alt_data
 */
export const getAltDataTool: ToolDefinition = {
  name: 'get_alt_data',
  description: 'Retrieve alternative data metrics (employment, web traffic) from LinkUp',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string' },
      start: { type: 'string' },
      end: { type: 'string' },
    },
    required: ['symbol', 'start', 'end'],
  },
  handler: async (input: GetAltDataInput): Promise<GetAltDataOutput> => {
    return withTimeout(
      'get_alt_data',
      async () => {
        const linkup = getLinkUpClient();
        const alt = await linkup.getAltData(input);
        return { alt };
      },
      TOOL_TIMEOUTS.get_alt_data,
      input.symbol
    );
  },
};

/**
 * Tool: detect_inflection_points
 */
export const detectInflectionPointsTool: ToolDefinition = {
  name: 'detect_inflection_points',
  description: 'Detect significant price inflection points using statistical analysis',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string' },
      start: { type: 'string' },
      end: { type: 'string' },
      sensitivity: { type: 'number', description: 'Sensitivity threshold (0-1)' },
    },
    required: ['symbol', 'start', 'end', 'sensitivity'],
  },
  handler: async (
    input: DetectInflectionPointsInput
  ): Promise<DetectInflectionPointsOutput> => {
    return withTimeout(
      'detect_inflection_points',
      async () => {
        const clickhouse = getClickHouseClient();
        
        // Get price data
        const prices = await clickhouse.getPrices(
          input.symbol,
          new Date(input.start),
          new Date(input.end),
          '1h'
        );

        // Simple inflection detection: find points with significant price change
        const points: Array<{ ts: string; score: number }> = [];
        
        for (let i = 1; i < prices.length - 1; i++) {
          const prev = prices[i - 1];
          const curr = prices[i];
          const next = prices[i + 1];

          // Calculate rate of change
          const changeRate1 = Math.abs((curr.close - prev.close) / prev.close);
          const changeRate2 = Math.abs((next.close - curr.close) / curr.close);

          // Detect inflection if both changes exceed sensitivity
          if (changeRate1 > input.sensitivity && changeRate2 > input.sensitivity) {
            points.push({
              ts: curr.ts,
              score: (changeRate1 + changeRate2) / 2,
            });
          }
        }

        // Sort by score and take top candidates
        points.sort((a, b) => b.score - a.score);

        return { points: points.slice(0, 10) };
      },
      TOOL_TIMEOUTS.detect_inflection_points,
      input.symbol
    );
  },
};

/**
 * Tool: get_health_metrics
 */
export const getHealthMetricsTool: ToolDefinition = {
  name: 'get_health_metrics',
  description: 'Query Datadog for system health metrics',
  inputSchema: {
    type: 'object',
    properties: {
      metrics: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of metric names to query',
      },
    },
    required: ['metrics'],
  },
  handler: async (input: GetHealthMetricsInput): Promise<GetHealthMetricsOutput> => {
    return withTimeout(
      'get_health_metrics',
      async () => {
        const datadog = getDatadogClient();
        const results = await datadog.getHealthMetrics(input);
        return { results };
      },
      TOOL_TIMEOUTS.get_health_metrics
    );
  },
};

/**
 * Tool Registry - all available tools
 */
export const ALL_TOOLS: ToolDefinition[] = [
  getPricesTool,
  getStructuredEventsTool,
  getRawNewsTool,
  translateTextsTool,
  extractStructuredFromDocTool,
  getAltDataTool,
  detectInflectionPointsTool,
  getHealthMetricsTool,
];
