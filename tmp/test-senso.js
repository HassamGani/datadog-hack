// quick smoke test for Senso client
const { getSensoAiClient } = require('./src/lib/backend/services/senso-ai');

async function run() {
  const client = getSensoAiClient();
  console.log('Client type:', client.constructor.name);
  const news = await client.searchNews({ symbol: 'AAPL', start: new Date().toISOString(), end: new Date().toISOString(), limit: 5 });
  console.log('News length:', news.length);
}

run().catch(err => { console.error(err); process.exit(1); });