# 🎯 SIMPLIFIED SETUP - ONE FILE FOR ALL API KEYS!

## ✨ Super Simple Configuration

Instead of scattering environment variables across multiple files, **just edit ONE `.env` file** with all your API keys!

---

## 🚀 Quick Start (3 Steps)

### Step 1: Copy the Template

```bash
cp .env.example .env
```

### Step 2: Edit the File

Open `.env` and fill in your API keys:

```bash
# OpenAI - Required for agent
OPENAI_API_KEY=sk-your-key-here

# ClickHouse - Database
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=trading_agent
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=your_password

# Senso.ai - News retrieval
SENSO_AI_API_KEY=your-senso-key

# ... and so on for all services
```

### Step 3: That's It! 🎉

The system will automatically:
- ✅ Load your keys from `.env` into `src/lib/api-keys.ts`
- ✅ Show you which keys are configured
- ✅ Keep your keys secure (`.env` is in `.gitignore`)

---

## 📋 Which API Keys Do You Need?

### ✅ Required (Essential)

1. **ClickHouse** - Database password
   - Get: https://clickhouse.cloud/ OR use Docker locally
   
2. **OpenAI** - Agent reasoning (REQUIRED)
   - Get: https://platform.openai.com/api-keys

### 🎯 Sponsor Technologies (High Priority)

3. **Senso.ai** - News retrieval ($2,000 prize)
   - Get: https://senso.ai/

4. **Structify** - Document extraction ($2,000 + AirPods prize)
   - Get: https://structify.ai/

5. **DeepL** - Translation ($1,000 prize)
   - Get: https://www.deepl.com/pro-api (500k chars/month FREE!)

6. **LinkUp** - Alternative data ($1,499 prize)
   - Get: https://linkup.com/

7. **Datadog** - Observability ($500 + GC prize)
   - Get: https://www.datadoghq.com/
   - Keys: https://app.datadoghq.com/organization-settings/api-keys

8. **Freepik** - Visual assets ($1,000 prize)
   - Get: https://www.freepik.com/api

### ⚙️ Optional

9. **TrueFoundry** - AI Gateway ($500 + $15k credits prize)
   - Get: https://truefoundry.com/
   - If not configured, will use OpenAI directly

10. **Finnhub** - Your existing API key
    - Already have this one!

---

## 🔍 Check Your Configuration

After filling in your keys, run this to see status:

```typescript
import { displayApiKeyStatus } from '@/lib/api-keys';

displayApiKeyStatus();
```

Output will show:
```
═══════════════════════════════════════════════════════════
🔑 API KEYS STATUS
═══════════════════════════════════════════════════════════

✅ CONFIGURED:
   ✓ ClickHouse
   ✓ OpenAI
   ✓ Senso.ai
   ✓ DeepL
   ✓ Datadog
   ✓ Freepik

❌ MISSING:
   ✗ Structify
   ✗ LinkUp

ℹ️  OPTIONAL:
   • TrueFoundry (will use OpenAI direct)

═══════════════════════════════════════════════════════════
Total: 6/8 configured
═══════════════════════════════════════════════════════════
```

---

## 🔐 Security Notes

✅ **Good News**: `src/lib/api-keys.ts` is already in `.gitignore`

Your actual keys will never be committed to git!

---

## 💡 How It Works

### The System:
```bash
# 1. You edit: .env (ONE file with all keys)
OPENAI_API_KEY=sk-xxx
SENSO_AI_API_KEY=yyy
STRUCTIFY_API_KEY=zzz
# ... etc

# 2. System loads into: src/lib/api-keys.ts
export const API_KEYS = {
  openai: { apiKey: process.env.OPENAI_API_KEY },
  sensoAi: { apiKey: process.env.SENSO_AI_API_KEY },
  // ... auto-loaded!
}

# 3. Your code uses: API_KEYS object everywhere
import { API_KEYS } from '@/lib/api-keys';
// Clean, typed, centralized!
```

### Benefits:
- ✅ **ONE file** to edit (`.env`)
- ✅ **Type-safe** access via `API_KEYS`
- ✅ **Secure** (`.env` never committed)
- ✅ **Clean code** (no `process.env` scattered everywhere)

---

## 🎯 Priority Setup Order

**Minimum to get started:**
1. ClickHouse (Docker is easiest)
2. OpenAI (required for agent)

**Add these next for full functionality:**
3. Senso.ai (news)
4. DeepL (translation)
5. Datadog (monitoring)

**Complete the integration:**
6. Structify (document extraction)
7. LinkUp (alternative data)
8. Freepik (visual assets)
9. TrueFoundry (optional AI gateway)

---

## ⚙️ Technologies That DON'T Need Keys

These are fully functional without external APIs:

- ✅ **Airia** - Workflow orchestration (built into code)
- ✅ **OpenHands** - Agent SDK (uses MCP tools)
- ✅ **Phenoml** - Statistical analysis (local algorithms)

---

## 🆘 Still Want to Use Environment Variables?

No problem! The system supports both:

1. **Centralized file** (recommended): `src/lib/api-keys.ts`
2. **Environment variables**: `.env.local`

If both exist, the centralized file takes priority.

---

## 📖 Detailed Setup Instructions

For step-by-step guides on getting each API key, see:
- **`API_KEYS_SETUP.md`** - Detailed instructions
- **`BACKEND_COMPLETE.md`** - Quick overview

---

## ✅ Next Steps

1. ✅ Copy the template: `cp .env.example .env`
2. ✅ Fill in your keys in `.env`
3. ✅ Run `displayApiKeyStatus()` to verify
4. ✅ Initialize ClickHouse database
5. ✅ Run `initializeBackend()` to test all services

**That's it! All keys in ONE place, properly secured!** 🚀
