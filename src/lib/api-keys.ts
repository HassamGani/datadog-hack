/**
 * ═══════════════════════════════════════════════════════════════════
 * 🔑 CENTRALIZED API KEYS CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════
 * 
 * This file automatically loads ALL API keys from your .env file!
 * 
 * Setup Instructions:
 * 1. Create a .env file in the project root (already in .gitignore)
 * 2. Copy the template from .env.example
 * 3. Fill in your API keys there
 * 4. This file will automatically load them!
 * 
 * Where to get each key: See API_KEYS_SETUP.md
 * ═══════════════════════════════════════════════════════════════════
 */

// Helper to get environment variables (works in Node.js and Next.js)
const getEnv = (key: string, defaultValue: string = ''): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

export const API_KEYS = {
  
  // ═══════════════════════════════════════════════════════════════════
  // 🗄️  CLICKHOUSE - Time-Series Database ($1,000 prize)
  // ═══════════════════════════════════════════════════════════════════
  // Get started: https://clickhouse.cloud/ OR use Docker locally
  // Docker: docker run -d --name clickhouse -p 8123:8123 clickhouse/clickhouse-server
  
  clickhouse: {
    host: getEnv('CLICKHOUSE_HOST', 'localhost'),
    port: parseInt(getEnv('CLICKHOUSE_PORT', '8123'), 10),
    database: getEnv('CLICKHOUSE_DATABASE', 'trading_agent'),
    username: getEnv('CLICKHOUSE_USERNAME', 'default'),
    password: getEnv('CLICKHOUSE_PASSWORD'),
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🤖 OPENAI - Required for Agent (Powers the reasoning)
  // ═══════════════════════════════════════════════════════════════════
  // Get key: https://platform.openai.com/api-keys
  
  openai: {
    apiKey: getEnv('OPENAI_API_KEY'),
    model: getEnv('OPENAI_MODEL', 'gpt-4-turbo-preview'),
    baseUrl: getEnv('OPENAI_BASE_URL') || undefined,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 📰 SENSO.AI - News & Context Retrieval ($2,000 prize)
  // ═══════════════════════════════════════════════════════════════════
  // Sign up: https://senso.ai/
  
  sensoAi: {
    apiKey: getEnv('SENSO_AI_API_KEY'),
    baseUrl: getEnv('SENSO_AI_BASE_URL', 'https://api.senso.ai'),
  },

  // ═══════════════════════════════════════════════════════════════════
  // 📄 STRUCTIFY - Document Extraction ($2,000 + AirPods Max prize)
  // ═══════════════════════════════════════════════════════════════════
  // Sign up: https://structify.ai/
  
  structify: {
    apiKey: getEnv('STRUCTIFY_API_KEY'),
    baseUrl: getEnv('STRUCTIFY_BASE_URL', 'https://api.structify.ai'),
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🌐 DEEPL - Translation Service ($1,000 prepaid Visa prize)
  // ═══════════════════════════════════════════════════════════════════
  // Sign up: https://www.deepl.com/pro-api (500k chars/month free!)
  
  deepl: {
    apiKey: getEnv('DEEPL_API_KEY'),
    baseUrl: getEnv('DEEPL_BASE_URL', 'https://api-free.deepl.com/v2'),
  },

  // ═══════════════════════════════════════════════════════════════════
  // 📈 LINKUP - Alternative Data ($1,499 prize)
  // ═══════════════════════════════════════════════════════════════════
  // Sign up: https://linkup.com/
  
  linkup: {
    apiKey: getEnv('LINKUP_API_KEY'),
    baseUrl: getEnv('LINKUP_BASE_URL', 'https://api.linkup.com'),
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🔍 DATADOG - Observability & Monitoring ($500 + Amazon GC prize)
  // ═══════════════════════════════════════════════════════════════════
  // Sign up: https://www.datadoghq.com/
  // Get keys: https://app.datadoghq.com/organization-settings/api-keys
  
  datadog: {
    apiKey: getEnv('DATADOG_API_KEY'),
    appKey: getEnv('DATADOG_APP_KEY'),
    site: getEnv('DATADOG_SITE', 'datadoghq.com'),
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🤖 TRUEFOUNDRY - AI Gateway ($500 + $15k credits prize)
  // ═══════════════════════════════════════════════════════════════════
  // Sign up: https://truefoundry.com/
  // NOTE: Optional - will use OpenAI directly if not configured
  
  truefoundry: {
    apiKey: getEnv('TRUEFOUNDRY_API_KEY'),
    gatewayUrl: getEnv('TRUEFOUNDRY_GATEWAY_URL'),
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🎨 FREEPIK - Visual Assets ($1,000 prize)
  // ═══════════════════════════════════════════════════════════════════
  // Sign up: https://www.freepik.com/api
  
  freepik: {
    apiKey: getEnv('FREEPIK_API_KEY'),
  },

  // ═══════════════════════════════════════════════════════════════════
  // 📊 EXISTING API - Your current Finnhub key
  // ═══════════════════════════════════════════════════════════════════
  
  finnhub: {
    apiKey: getEnv('FINNHUB_API_KEY'),
  },

} as const;

// ═══════════════════════════════════════════════════════════════════
// ✅ VALIDATION - Checks which keys are configured
// ═══════════════════════════════════════════════════════════════════

export function validateApiKeys(): {
  valid: string[];
  missing: string[];
  optional: string[];
} {
  const valid: string[] = [];
  const missing: string[] = [];
  const optional: string[] = [];

  // Required keys
  if (API_KEYS.clickhouse.password) valid.push('ClickHouse');
  else missing.push('ClickHouse');

  if (API_KEYS.openai.apiKey) valid.push('OpenAI');
  else missing.push('OpenAI (REQUIRED)');

  if (API_KEYS.sensoAi.apiKey) valid.push('Senso.ai');
  else missing.push('Senso.ai');

  if (API_KEYS.structify.apiKey) valid.push('Structify');
  else missing.push('Structify');

  if (API_KEYS.deepl.apiKey) valid.push('DeepL');
  else missing.push('DeepL');

  if (API_KEYS.linkup.apiKey) valid.push('LinkUp');
  else missing.push('LinkUp');

  if (API_KEYS.datadog.apiKey && API_KEYS.datadog.appKey) valid.push('Datadog');
  else missing.push('Datadog');

  if (API_KEYS.freepik.apiKey) valid.push('Freepik');
  else missing.push('Freepik');

  if (API_KEYS.finnhub.apiKey) valid.push('Finnhub');
  else missing.push('Finnhub');

  // Optional keys
  if (API_KEYS.truefoundry.apiKey) valid.push('TrueFoundry');
  else optional.push('TrueFoundry (will use OpenAI direct)');

  return { valid, missing, optional };
}

// ═══════════════════════════════════════════════════════════════════
// 📊 DISPLAY STATUS - Shows which keys are configured
// ═══════════════════════════════════════════════════════════════════

export function displayApiKeyStatus(): void {
  const { valid, missing, optional } = validateApiKeys();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔑 API KEYS STATUS');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (valid.length > 0) {
    console.log('✅ CONFIGURED:');
    valid.forEach(key => console.log(`   ✓ ${key}`));
    console.log('');
  }

  if (missing.length > 0) {
    console.log('❌ MISSING:');
    missing.forEach(key => console.log(`   ✗ ${key}`));
    console.log('');
  }

  if (optional.length > 0) {
    console.log('ℹ️  OPTIONAL:');
    optional.forEach(key => console.log(`   • ${key}`));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total: ${valid.length}/${valid.length + missing.length} configured`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (missing.length > 0) {
    console.log('📖 See API_KEYS_SETUP.md for instructions on getting each key\n');
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 NOTES FOR EACH SPONSOR TECHNOLOGY
// ═══════════════════════════════════════════════════════════════════
// 
// Technologies that DON'T need API keys (built into the code):
// - ✅ Airia: Workflow orchestration (code-based)
// - ✅ OpenHands: Agent SDK (uses MCP tools)
// - ✅ Phenoml: Statistical analysis (local algorithms)
// 
// These are fully functional without external APIs!
// ═══════════════════════════════════════════════════════════════════
