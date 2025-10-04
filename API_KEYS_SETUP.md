# 🔑 API KEYS SETUP - COMPLETE GUIDE

## Where to Get Each API Key & How to Configure

This document provides the exact steps for obtaining and configuring API keys for **ALL 11 SPONSOR TECHNOLOGIES**.

---

## 📋 Quick Reference

| Service | Sign-Up URL | Environment Variable | Prize Value |
|---------|-------------|---------------------|-------------|
| ClickHouse | https://clickhouse.cloud/ | `CLICKHOUSE_*` | $1,000 |
| Senso.ai | https://senso.ai/ | `SENSO_AI_API_KEY` | $2,000 |
| Structify | https://structify.ai/ | `STRUCTIFY_API_KEY` | $2,000 + AirPods |
| DeepL | https://www.deepl.com/pro-api | `DEEPL_API_KEY` | $1,000 |
| LinkUp | https://linkup.com/ | `LINKUP_API_KEY` | $1,499 |
| Datadog | https://www.datadoghq.com/ | `DATADOG_API_KEY` | $500 + GC |
| TrueFoundry | https://truefoundry.com/ | `TRUEFOUNDRY_API_KEY` | $500 + $15k |
| OpenAI | https://platform.openai.com/ | `OPENAI_API_KEY` | N/A (Required) |
| Freepik | https://www.freepik.com/api | `FREEPIK_API_KEY` | $1,000 |

---

## 🚀 Step-by-Step Configuration

### 1. ClickHouse (Time-Series Database)

**Get Started:**
1. Visit https://clickhouse.cloud/
2. Create a free account
3. Create a new service
4. Copy connection details

**OR use Docker locally:**
```bash
docker run -d \
  --name clickhouse \
  -p 8123:8123 \
  -p 9000:9000 \
  clickhouse/clickhouse-server
```

**Environment Variables:**
```bash
CLICKHOUSE_HOST=your-cluster.clickhouse.cloud  # or localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=trading_agent
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=your_password
```

**Initialize Database:**
```bash
# Run the schema file
cat src/lib/backend/clickhouse/schema.sql | \
  curl 'http://localhost:8123/' --data-binary @-
```

---

### 2. Senso.ai (News & Context Retrieval)

**Get API Key:**
1. Visit https://senso.ai/
2. Sign up for an account
3. Navigate to API section
4. Generate API key

**Environment Variables:**
```bash
SENSO_AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENSO_AI_BASE_URL=https://api.senso.ai
```

**What it does:**
- Fetches financial news from multiple sources
- SEC filings and press releases
- Contextual search for market events
- Alternative data metrics

---

### 3. Structify (Document Extraction)

**Get API Key:**
1. Visit https://structify.ai/
2. Sign up for developer account
3. Access your dashboard
4. Copy API key

**Environment Variables:**
```bash
STRUCTIFY_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRUCTIFY_BASE_URL=https://api.structify.ai
```

**What it does:**
- Extracts structured data from PDFs
- Parses SEC filings for earnings metrics
- Converts unstructured documents to structured facts
- Financial document understanding

---

### 4. DeepL (Translation Service)

**Get API Key:**
1. Visit https://www.deepl.com/pro-api
2. Sign up for API plan (Free tier: 500k chars/month)
3. Verify email
4. Access API keys in account settings

**Environment Variables:**
```bash
DEEPL_API_KEY=your-deepl-auth-key-xxxxxxxx:fx
DEEPL_BASE_URL=https://api-free.deepl.com/v2
# Use https://api.deepl.com/v2 for paid plans
```

**What it does:**
- Translates non-English news to English
- Supports 30+ languages
- Maintains financial terminology accuracy
- Auto-detects source language

---

### 5. LinkUp (Alternative Data)

**Get API Key:**
1. Visit https://linkup.com/
2. Request API access
3. Complete onboarding
4. Receive API credentials

**Environment Variables:**
```bash
LINKUP_API_KEY=your-linkup-api-key-xxxxxxxxxxxxxxxx
LINKUP_BASE_URL=https://api.linkup.com
```

**What it does:**
- Employment trends and hiring velocity
- Job posting analytics
- Web traffic and mobile app usage
- Alternative indicators for company health

---

### 6. Datadog (Observability & Monitoring)

**Get API Keys:**
1. Visit https://www.datadoghq.com/
2. Sign up (free trial available)
3. Go to: Organization Settings → API Keys
4. Go to: Organization Settings → Application Keys

**Environment Variables:**
```bash
DATADOG_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATADOG_APP_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATADOG_SITE=datadoghq.com  # or datadoghq.eu, us3.datadoghq.com, etc.
```

**What it does:**
- Tracks tool invocation metrics
- Monitors agent performance
- Pipeline execution status
- Error tracking and alerting
- Custom dashboards for agent health

---

### 7. TrueFoundry AI Gateway (LLM Routing)

**Get API Key:**
1. Visit https://truefoundry.com/
2. Sign up for AI Gateway
3. Create a gateway endpoint
4. Copy API credentials

**Environment Variables:**
```bash
TRUEFOUNDRY_API_KEY=your-truefoundry-key-xxxxxxxxxxxx
TRUEFOUNDRY_GATEWAY_URL=https://your-gateway.truefoundry.cloud
```

**What it does:**
- Routes LLM calls through managed gateway
- Rate limiting and cost optimization
- Telemetry and usage analytics
- Fallback management
- **Falls back to OpenAI if not configured**

---

### 8. OpenAI (Required for Agent)

**Get API Key:**
1. Visit https://platform.openai.com/
2. Sign up / log in
3. Go to: API Keys section
4. Create new secret key

**Environment Variables:**
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo-preview
# Optional custom endpoint:
# OPENAI_BASE_URL=https://api.openai.com/v1
```

**What it does:**
- Powers the agent reasoning
- Function calling for tool orchestration
- Natural language understanding
- Annotation generation

---

### 9. Freepik API (Visual Assets)

**Get API Key:**
1. Visit https://www.freepik.com/api
2. Request API access
3. Complete application
4. Receive API key

**Environment Variables:**
```bash
FREEPIK_API_KEY=your-freepik-api-key-xxxxxxxxxxxx
```

**What it does:**
- Icons for chart annotations
- Visual styling for different event types
- Background assets for UI
- Financial iconography

---

### 10. Airia (Workflow Orchestration)

**Setup:**
Airia integration is **implemented in code** and doesn't require external API keys. It's a workflow orchestration layer built on top of your agent system.

**Location:**
- `src/lib/backend/services/airia.ts`

**What it does:**
- Multi-step workflow orchestration
- Parallel task execution
- Conditional logic and loops
- Event-driven triggers
- Complex agent task coordination

---

### 11. OpenHands (Agent SDK)

**Setup:**
OpenHands integration uses the **MCP (Model Context Protocol)** standard and doesn't require separate API keys. It leverages your existing tool infrastructure.

**Location:**
- `src/lib/backend/services/openhands.ts`
- `src/lib/backend/mcp/server.ts`

**What it does:**
- Autonomous task execution
- MCP tool discovery
- Agent self-reflection
- Task management and tracking

---

### 12. Phenoml (Statistical Analysis)

**Setup:**
Phenoml algorithms are **implemented locally** in the codebase for statistical analysis.

**Location:**
- `src/lib/backend/services/phenoml.ts`

**What it does:**
- Anomaly detection (z-score analysis)
- Chart pattern recognition
- Price predictions
- Volume spike detection
- Trend analysis

---

## 📝 Final Configuration

### Create `.env.local` file:

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your API keys
nano .env.local
# or
code .env.local
```

### Verify Configuration:

```typescript
import { initializeBackend } from '@/lib/backend';

// This will check all services and print status
await initializeBackend();
```

You should see:
```
🚀 Initializing Trading Agent Backend...

📊 ClickHouse: Time-series & event storage
   Status: ✅ Connected

📰 Senso.ai: News & contextual retrieval
   Status: ✅ Configured

📄 Structify: Document structure extraction
   Status: ✅ Configured

🌐 DeepL: Translation service
   Status: ✅ Configured

📈 LinkUp: Alternative data
   Status: ✅ Configured

🔍 Datadog MCP: Observability & health metrics
   Status: ✅ Configured

🤖 TrueFoundry: AI Gateway for LLM routing
   Status: ✅ Configured

⚙️ Airia: Workflow orchestration
   Status: ✅ Workflows defined

🤝 OpenHands: Agent SDK & MCP integration
   Status: ✅ Initialized

📊 Phenoml: Statistical analysis
   Status: ✅ Configured

🎨 Freepik: Visual assets
   Status: ✅ Configured

✨ Backend initialization complete!
```

---

## 🎯 Priority Setup Order

1. **Essential (Required):**
   - ClickHouse (data storage)
   - OpenAI (agent reasoning)

2. **High Priority (Core Features):**
   - Senso.ai (news retrieval)
   - DeepL (translation)
   - Datadog (monitoring)

3. **Enhanced Features:**
   - Structify (document extraction)
   - LinkUp (alternative data)
   - TrueFoundry (LLM gateway)

4. **Optional (UI Enhancement):**
   - Freepik (visual assets)

5. **Built-in (No API Key):**
   - Airia (workflow orchestration)
   - OpenHands (agent SDK)
   - Phenoml (statistical analysis)

---

## 🆘 Troubleshooting

### Missing API Key Error
```
Error: Senso.ai API key not configured
```
**Solution:** Add the key to `.env.local` and restart dev server

### ClickHouse Connection Failed
```
Error: ClickHouse query failed: Connection refused
```
**Solution:** 
- Check if ClickHouse is running: `docker ps`
- Verify connection settings in `.env.local`
- Run schema initialization script

### OpenAI Rate Limit
```
Error: Rate limit exceeded
```
**Solution:**
- Use TrueFoundry AI Gateway for rate limiting
- Implement caching (already built-in)
- Reduce agent iterations in config

---

## 📊 Cost Management

**Free Tiers Available:**
- ClickHouse Cloud: Free tier
- DeepL: 500k characters/month free
- Datadog: 14-day free trial
- OpenAI: Pay-as-you-go (use caching)

**Optimization Tips:**
1. Enable caching (already implemented)
2. Use TrueFoundry for cost tracking
3. Monitor usage in Datadog
4. Set timeouts on all tools
5. Batch API requests when possible

---

## ✅ Verification Checklist

- [ ] ClickHouse running and schema initialized
- [ ] Senso.ai API key configured
- [ ] Structify API key configured  
- [ ] DeepL API key configured
- [ ] LinkUp API key configured
- [ ] Datadog API & App keys configured
- [ ] OpenAI API key configured
- [ ] TrueFoundry configured (or using OpenAI fallback)
- [ ] Freepik API key configured
- [ ] `.env.local` file created
- [ ] Backend initialization successful
- [ ] All 11 sponsor technologies showing ✅ status

---

## 🎉 Ready to Go!

Once all keys are configured, you can:

1. Start the development server: `npm run dev`
2. Initialize the backend: `import { initializeBackend } from '@/lib/backend'`
3. Start the pipelines: `getPipelineScheduler().startScheduled()`
4. Create your `/api/annotate` endpoint
5. Connect to your frontend dashboard

**All 11 sponsor technologies are now integrated and ready to use!** 🚀
