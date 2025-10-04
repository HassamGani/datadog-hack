/**
 * Backend Configuration
 * 
 * SIMPLIFIED SETUP:
 * 1. Copy src/lib/api-keys.example.ts to src/lib/api-keys.ts
 * 2. Fill in your API keys in that ONE file
 * 3. Done! No need to mess with .env files
 * 
 * This config will try to load from api-keys.ts first,
 * then fall back to environment variables if needed.
 */

import { ServiceConfig } from './types';

// Try to import from centralized api-keys.ts file
let API_KEYS: any = null;
try {
  // @ts-ignore - This file may not exist yet
  API_KEYS = require('../api-keys').API_KEYS;
  console.log('✅ Using centralized API keys from src/lib/api-keys.ts');
} catch {
  console.log('ℹ️  No api-keys.ts found, using environment variables');
}

export function getServiceConfig(): ServiceConfig {
  // Use centralized keys if available, otherwise fall back to env vars
  if (API_KEYS) {
    return {
      clickhouse: {
        host: API_KEYS.clickhouse.host,
        port: API_KEYS.clickhouse.port,
        database: API_KEYS.clickhouse.database,
        username: API_KEYS.clickhouse.username,
        password: API_KEYS.clickhouse.password,
      },
      sensoAi: {
        apiKey: API_KEYS.sensoAi.apiKey,
        baseUrl: API_KEYS.sensoAi.baseUrl,
      },
      structify: {
        apiKey: API_KEYS.structify.apiKey,
        baseUrl: API_KEYS.structify.baseUrl,
      },
      deepl: {
        apiKey: API_KEYS.deepl.apiKey,
        baseUrl: API_KEYS.deepl.baseUrl,
      },
      linkup: {
        apiKey: API_KEYS.linkup.apiKey,
        baseUrl: API_KEYS.linkup.baseUrl,
      },
      openai: {
        apiKey: API_KEYS.openai.apiKey,
        baseUrl: API_KEYS.openai.baseUrl,
        model: API_KEYS.openai.model,
      },
      truefoundry: {
        apiKey: API_KEYS.truefoundry.apiKey,
        gatewayUrl: API_KEYS.truefoundry.gatewayUrl,
      },
      datadog: {
        apiKey: API_KEYS.datadog.apiKey,
        appKey: API_KEYS.datadog.appKey,
        site: API_KEYS.datadog.site,
      },
    };
  }

  // Fallback to environment variables
  return {
    clickhouse: {
      host: process.env.CLICKHOUSE_HOST || 'localhost',
      port: parseInt(process.env.CLICKHOUSE_PORT || '8123', 10),
      database: process.env.CLICKHOUSE_DATABASE || 'trading_agent',
      username: process.env.CLICKHOUSE_USERNAME || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || '',
    },
    sensoAi: {
      apiKey: process.env.SENSO_AI_API_KEY || '',
      baseUrl: process.env.SENSO_AI_BASE_URL || 'https://api.senso.ai',
    },
    structify: {
      apiKey: process.env.STRUCTIFY_API_KEY || '',
      baseUrl: process.env.STRUCTIFY_BASE_URL || 'https://api.structify.ai',
    },
    deepl: {
      apiKey: process.env.DEEPL_API_KEY || '',
      baseUrl: process.env.DEEPL_BASE_URL || 'https://api-free.deepl.com/v2',
    },
    linkup: {
      apiKey: process.env.LINKUP_API_KEY || '',
      baseUrl: process.env.LINKUP_BASE_URL || 'https://api.linkup.com',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    },
    truefoundry: {
      apiKey: process.env.TRUEFOUNDRY_API_KEY || '',
      gatewayUrl: process.env.TRUEFOUNDRY_GATEWAY_URL || '',
    },
    datadog: {
      apiKey: process.env.DATADOG_API_KEY || '',
      appKey: process.env.DATADOG_APP_KEY || '',
      site: process.env.DATADOG_SITE || 'datadoghq.com',
    },
  };
}

// Timeout configurations (in milliseconds)
export const TOOL_TIMEOUTS = {
  get_prices: 5000,
  get_structured_events: 5000,
  get_raw_news: 10000,
  translate_texts: 10000,
  extract_structured_from_doc: 30000,
  get_alt_data: 10000,
  detect_inflection_points: 5000,
  get_health_metrics: 5000,
};

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  prices: 60, // 1 minute
  news: 300, // 5 minutes
  events: 300, // 5 minutes
  translations: 86400, // 24 hours
  alt_data: 600, // 10 minutes
  inflection_points: 300, // 5 minutes
};

// Agent configuration
export const AGENT_CONFIG = {
  maxToolCalls: 20,
  parallelToolCalls: true,
  retryAttempts: 2,
  timeoutMs: 60000, // 1 minute total agent timeout
};
