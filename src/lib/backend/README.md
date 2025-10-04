# Backend Agent System - Configuration Guide

## 🎯 Overview

This backend system integrates **ALL 11 SPONSOR TECHNOLOGIES** to create a comprehensive AI-powered trading analysis agent. The agent uses OpenAI's function calling to orchestrate tools that retrieve, translate, structure, and analyze market data.

## 🏆 Sponsor Technologies Integrated

### 1. **ClickHouse** - Time-Series Database
- **Location**: `src/lib/backend/clickhouse/`
- **Usage**: Stores prices, events, annotations, alt-data
- **Prize**: $1,000 cash

### 2. **Senso.ai** - News & Contextual Retrieval
- **Location**: `src/lib/backend/services/senso-ai.ts`
- **Usage**: Fetches financial news, SEC filings, press releases
- **Prize**: $2,000 in credits

### 3. **Structify** - Document Extraction
- **Location**: `src/lib/backend/services/structify.ts`
- **Usage**: Extracts structured facts from PDFs and financial documents
- **Prize**: Up to $2,000 credits + AirPods Max

### 4. **DeepL** - Translation
- **Location**: `src/lib/backend/services/deepl.ts`
- **Usage**: Translates non-English news and filings to English
- **Prize**: $1,000 prepaid Visa

### 5. **LinkUp** - Alternative Data
- **Location**: `src/lib/backend/services/linkup.ts`
- **Usage**: Employment trends, web traffic, hiring velocity
- **Prize**: $1,499 cash

### 6. **Datadog MCP** - Observability
- **Location**: `src/lib/backend/services/datadog.ts`
- **Usage**: Metrics, events, tool performance tracking
- **Prize**: $500 cash + Amazon GC

### 7. **TrueFoundry AI Gateway** - LLM Routing
- **Location**: `src/lib/backend/services/truefoundry.ts`
- **Usage**: Routes LLM calls, manages rate limits, telemetry
- **Prize**: $500 Amazon GC + $15,000 credits

### 8. **Airia** - Workflow Orchestration
- **Location**: `src/lib/backend/services/airia.ts`
- **Usage**: Complex multi-step agent workflows, event triggers
- **Prize**: Up to $1,500 Amazon GC + 12-month license

### 9. **OpenHands** - Agent SDK
- **Location**: `src/lib/backend/services/openhands.ts`
- **Usage**: Autonomous task execution, MCP integration, agent reflection
- **Prize**: $100 gift card + cloud credits

### 10. **Phenoml** - Statistical Analysis
- **Location**: `src/lib/backend/services/phenoml.ts`
- **Usage**: Anomaly detection, pattern recognition, predictions
- **Prize**: Up to $1,000 cash

### 11. **Freepik API** - Visual Assets
- **Location**: `src/lib/backend/services/freepik.ts`
- **Usage**: Icons for chart annotations, visual styling
- **Prize**: Up to $1,000 cash

---

## 🔑 API Keys Configuration

Create a `.env.local` file in the project root with the following keys:

```bash
# ===== CLICKHOUSE =====
# Install: https://clickhouse.com/docs/en/install
# Or use ClickHouse Cloud: https://clickhouse.cloud/
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=trading_agent
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=your_password_here

# ===== SENSO.AI =====
# Sign up: https://senso.ai/
SENSO_AI_API_KEY=your_senso_api_key_here
SENSO_AI_BASE_URL=https://api.senso.ai

# ===== STRUCTIFY =====
# Sign up: https://structify.ai/
STRUCTIFY_API_KEY=your_structify_api_key_here
STRUCTIFY_BASE_URL=https://api.structify.ai

# ===== DEEPL =====
# Sign up: https://www.deepl.com/pro-api
# Free tier: 500,000 characters/month
DEEPL_API_KEY=your_deepl_api_key_here
DEEPL_BASE_URL=https://api-free.deepl.com/v2

# ===== LINKUP =====
# Sign up: https://linkup.com/
LINKUP_API_KEY=your_linkup_api_key_here
LINKUP_BASE_URL=https://api.linkup.com

# ===== OPENAI =====
# Get API key: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
# Optional: Use custom endpoint
# OPENAI_BASE_URL=https://api.openai.com/v1

# ===== TRUEFOUNDRY AI GATEWAY =====
# Sign up: https://truefoundry.com/
# If not using TrueFoundry, it falls back to OpenAI direct
TRUEFOUNDRY_API_KEY=your_truefoundry_api_key_here
TRUEFOUNDRY_GATEWAY_URL=your_gateway_url_here

# ===== DATADOG =====
# Sign up: https://www.datadoghq.com/
# Get API keys from: https://app.datadoghq.com/organization-settings/api-keys
DATADOG_API_KEY=your_datadog_api_key_here
DATADOG_APP_KEY=your_datadog_app_key_here
DATADOG_SITE=datadoghq.com

# ===== FREEPIK =====
# Sign up: https://www.freepik.com/api
FREEPIK_API_KEY=your_freepik_api_key_here

# ===== EXISTING FINNHUB (for price data) =====
FINNHUB_API_KEY=your_existing_finnhub_key
```

---

## 📦 Setup Instructions

### 1. Install ClickHouse

**Option A: Docker (Recommended)**
```bash
docker run -d \
  --name clickhouse \
  -p 8123:8123 \
  -p 9000:9000 \
  clickhouse/clickhouse-server
```

**Option B: Local Installation**
- macOS: `brew install clickhouse`
- Linux: See https://clickhouse.com/docs/en/install

**Initialize Schema:**
```bash
# Copy the schema file
cat src/lib/backend/clickhouse/schema.sql | \
  curl 'http://localhost:8123/' --data-binary @-
```

### 2. Install Dependencies

The project uses Node.js/TypeScript with Next.js. All dependencies are already in `package.json`:

```bash
npm install
# or
yarn install
```

### 3. Initialize Backend

Add this to your Next.js API route or server component:

```typescript
import { initializeBackend } from '@/lib/backend';

// In your API route or server startup:
await initializeBackend();
```

---

## 🚀 Architecture Overview

### Data Flow

```
1. USER REQUEST
   ↓
2. FRONTEND (Next.js + TradingDashboard)
   ↓
3. API ENDPOINT (/api/annotate)
   ↓
4. AGENT ORCHESTRATOR
   ├→ Uses OpenAI/TrueFoundry for reasoning
   └→ Calls MCP Tools:
       ├→ get_prices (ClickHouse)
       ├→ get_raw_news (Senso.ai)
       ├→ translate_texts (DeepL)
       ├→ extract_structured_from_doc (Structify)
       ├→ get_alt_data (LinkUp)
       ├→ detect_inflection_points (Phenoml)
       └→ get_health_metrics (Datadog)
   ↓
5. AGENT REASONING
   ├→ Airia orchestrates workflows
   ├→ OpenHands manages autonomous tasks
   └→ Freepik provides visual assets
   ↓
6. RESPONSE (Annotations + Explanation)
   ↓
7. STORAGE (ClickHouse)
   ↓
8. OBSERVABILITY (Datadog)
```

### Background Pipelines

```
NEWS PIPELINE (every 30 min)
├→ Fetch news (Senso.ai)
├→ Translate non-English (DeepL)
├→ Extract from documents (Structify)
└→ Store in ClickHouse

ALT-DATA PIPELINE (every 30 min)
├→ Fetch employment data (LinkUp)
├→ Fetch sentiment data (Senso.ai)
└→ Store in ClickHouse
```

---

## 🛠️ Usage Examples

### Example 1: Annotate a Chart

```typescript
import { getAgentOrchestrator } from '@/lib/backend';

const orchestrator = getAgentOrchestrator();

const result = await orchestrator.annotate({
  symbol: 'TSLA',
  start: '2025-08-01T00:00:00Z',
  end: '2025-08-31T23:59:59Z',
  question: 'Why did TSLA drop sharply from Aug 20-22 then rebound?'
});

console.log(result.annotations);
console.log(result.explanation);
```

### Example 2: Run Background Pipelines

```typescript
import { getPipelineScheduler } from '@/lib/backend';

const scheduler = getPipelineScheduler();

// Run every 30 minutes
scheduler.startScheduled(30);
```

### Example 3: OpenHands Autonomous Task

```typescript
import { getOpenHandsAgent } from '@/lib/backend';

const agent = getOpenHandsAgent();

const task = await agent.executeResearchTask(
  'NVDA',
  'What caused the recent volatility?',
  {
    start: '2025-10-01T00:00:00Z',
    end: '2025-10-04T23:59:59Z'
  }
);

console.log(task.result);
```

### Example 4: Airia Workflow

```typescript
import { getAiriaClient } from '@/lib/backend';

const airia = getAiriaClient();

const result = await airia.executeWorkflow('market_analysis', {
  symbol: 'AAPL',
  start: '2025-09-01T00:00:00Z',
  end: '2025-09-30T23:59:59Z',
  question: 'Analyze September performance'
});
```

---

## 📊 MCP Tool Reference

All tools are accessible via the MCP server at `src/lib/backend/mcp/server.ts`:

| Tool Name | Purpose | Data Source |
|-----------|---------|-------------|
| `get_prices` | Historical OHLCV data | ClickHouse |
| `get_structured_events` | Processed news/events | ClickHouse |
| `get_raw_news` | Raw news articles | Senso.ai |
| `translate_texts` | Translate content | DeepL |
| `extract_structured_from_doc` | Extract from PDFs | Structify |
| `get_alt_data` | Employment, web traffic | LinkUp |
| `detect_inflection_points` | Price anomalies | Phenoml |
| `get_health_metrics` | System health | Datadog |

---

## 🔍 Observability

### Datadog Dashboards

The system automatically tracks:
- Tool invocation latency
- Success/error rates
- Agent performance metrics
- Pipeline execution status

View in Datadog:
```
trading_agent.tool.duration
trading_agent.tool.invocation
trading_agent.pipeline.news.articles
trading_agent.pipeline.altdata.points
```

### ClickHouse Metrics

Query tool performance:
```sql
SELECT
  tool_name,
  count() as calls,
  avg(duration_ms) as avg_duration,
  sum(success) / count() as success_rate
FROM tool_metrics
WHERE ts >= now() - INTERVAL 1 DAY
GROUP BY tool_name
ORDER BY calls DESC;
```

---

## 🎨 Frontend Integration

The backend is designed to be connected to your existing trading dashboard:

```typescript
// In your Next.js API route: src/app/api/annotate/route.ts
import { getAgentOrchestrator } from '@/lib/backend';

export async function POST(req: Request) {
  const body = await req.json();
  const orchestrator = getAgentOrchestrator();
  
  const result = await orchestrator.annotate(body);
  
  return Response.json(result);
}
```

---

## 🏅 Prize Eligibility Checklist

- ✅ **ClickHouse**: Schema defined, client implemented, time-series queries
- ✅ **Senso.ai**: News retrieval, alt-data fetching integrated
- ✅ **Structify**: Document extraction from PDFs and URLs
- ✅ **DeepL**: Translation of non-English content
- ✅ **LinkUp**: Employment and alternative data metrics
- ✅ **Datadog MCP**: Metrics, events, observability
- ✅ **TrueFoundry**: AI Gateway for LLM routing
- ✅ **Airia**: Workflow orchestration and event triggers
- ✅ **OpenHands**: Agent SDK with MCP integration
- ✅ **Phenoml**: Statistical analysis and anomaly detection
- ✅ **Freepik**: Visual assets for annotations

---

## 📝 Notes

- All code is in `src/lib/backend/` for easy API route connection
- TypeScript types are fully defined in `src/lib/backend/types.ts`
- Error handling includes timeouts, retries, and graceful degradation
- Caching reduces API costs and improves response times
- All sponsor APIs are properly attributed and showcased

---

## 🚦 Next Steps

1. Add environment variables to `.env.local`
2. Initialize ClickHouse database
3. Run `npm run dev`
4. Create API endpoint for `/api/annotate`
5. Connect to your TradingDashboard component
6. Start the background pipelines
7. Monitor with Datadog

**Ready to revolutionize trading analysis with AI! 🚀📈**
