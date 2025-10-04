/**
 * Data Ingestion Pipelines
 * Background workers for news, prices, and alt-data ingestion
 */

import { getClickHouseClient } from '../clickhouse/client';
import { getSensoAiClient } from '../services/senso-ai';
import { getLinkUpClient } from '../services/linkup';
import { getDeepLClient } from '../services/deepl';
import { getStructifyClient } from '../services/structify';
import { getDatadogClient } from '../services/datadog';
import { newsCache, altDataCache, generateCacheKey } from '../utils/cache';
import type { DBStructuredEvent, DBAltData } from '../types';

/**
 * News & Filings Pipeline
 * Fetches, translates, structures, and stores news
 */
export class NewsPipeline {
  private clickhouse = getClickHouseClient();
  private sensoAi = getSensoAiClient();
  private deepl = getDeepLClient();
  private structify = getStructifyClient();
  private datadog = getDatadogClient();

  async run(symbol: string, start: Date, end: Date): Promise<void> {
    const jobId = `news-${symbol}-${start.getTime()}`;
    const cacheKey = generateCacheKey('news', symbol, start.toISOString(), end.toISOString());

    // Check cache
    const cached = newsCache.get(cacheKey);
    if (cached) {
      console.log(`News pipeline: Using cached data for ${symbol}`);
      return;
    }

    try {
      await this.datadog.sendEvent(
        'News Pipeline Started',
        `Starting news ingestion for ${symbol}`,
        [`symbol:${symbol}`, 'pipeline:news']
      );

      // 1. Fetch raw news from Senso.ai
      console.log(`Fetching news for ${symbol}...`);
      const rawNews = await this.sensoAi.searchNews({
        symbol,
        start: start.toISOString(),
        end: end.toISOString(),
        limit: 50,
      });

      console.log(`Found ${rawNews.length} news articles`);

      // 2. Translate non-English content using DeepL
      const nonEnglishNews = rawNews.filter((n) => n.lang !== 'en');
      let translations = new Map<string, string>();

      if (nonEnglishNews.length > 0) {
        console.log(`Translating ${nonEnglishNews.length} non-English articles...`);
        
        const translationResult = await this.deepl.translateTexts({
          texts: nonEnglishNews.map((n, idx) => ({
            id: `${idx}`,
            lang: n.lang,
            text: n.headline + '\n' + n.content,
          })),
          target_lang: 'en',
        });

        translationResult.translations.forEach((t) => {
          translations.set(t.id, t.translated);
        });
      }

      // 3. Process and structure events
      const structuredEvents: DBStructuredEvent[] = [];
      
      for (let i = 0; i < rawNews.length; i++) {
        const news = rawNews[i];
        const translatedContent = translations.get(`${i}`) || news.content;

        // Determine event type
        let eventType = 'news';
        if (news.source.includes('SEC') || news.url.includes('sec.gov')) {
          eventType = 'filing';
        } else if (news.source.includes('Press Release')) {
          eventType = 'press_release';
        }

        structuredEvents.push({
          symbol,
          ts: new Date(news.ts),
          type: eventType,
          summary: news.headline,
          url: news.url,
          lang: news.lang,
          translated_summary: translatedContent.split('\n')[0], // First line as summary
        });

        // 4. If it's a document (PDF/filing), extract structured data using Structify
        if (eventType === 'filing' || news.url.endsWith('.pdf')) {
          try {
            console.log(`Extracting structured data from ${news.url}...`);
            const facts = await this.structify.extractFromDocument({
              doc_url: news.url,
              symbol,
            });

            // Add extracted facts as separate events
            for (const fact of facts) {
              structuredEvents.push({
                symbol,
                ts: new Date(fact.ts),
                type: 'extracted_fact',
                summary: `${fact.field}: ${fact.value}`,
                url: news.url,
                lang: 'en',
                translated_summary: fact.info,
              });
            }
          } catch (error) {
            console.error(`Failed to extract from ${news.url}:`, error);
            // Continue with other documents
          }
        }
      }

      // 5. Store in ClickHouse
      if (structuredEvents.length > 0) {
        console.log(`Storing ${structuredEvents.length} structured events...`);
        await this.clickhouse.insertStructuredEvents(structuredEvents);
      }

      // Cache results
      newsCache.set(cacheKey, true, 300); // 5 minutes

      await this.datadog.sendEvent(
        'News Pipeline Completed',
        `Processed ${rawNews.length} articles for ${symbol}`,
        [`symbol:${symbol}`, 'pipeline:news', 'status:success']
      );

      await this.datadog.sendMetric('trading_agent.pipeline.news.articles', rawNews.length, [
        `symbol:${symbol}`,
      ]);
    } catch (error) {
      console.error('News pipeline error:', error);
      
      await this.datadog.sendEvent(
        'News Pipeline Failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
        [`symbol:${symbol}`, 'pipeline:news', 'status:error']
      );

      throw error;
    }
  }
}

/**
 * Alt-Data Pipeline
 * Fetches alternative data from LinkUp and Senso.ai
 */
export class AltDataPipeline {
  private clickhouse = getClickHouseClient();
  private linkup = getLinkUpClient();
  private sensoAi = getSensoAiClient();
  private datadog = getDatadogClient();

  async run(symbol: string, start: Date, end: Date): Promise<void> {
    const cacheKey = generateCacheKey('altdata', symbol, start.toISOString(), end.toISOString());

    const cached = altDataCache.get(cacheKey);
    if (cached) {
      console.log(`Alt-data pipeline: Using cached data for ${symbol}`);
      return;
    }

    try {
      await this.datadog.sendEvent(
        'Alt-Data Pipeline Started',
        `Fetching alternative data for ${symbol}`,
        [`symbol:${symbol}`, 'pipeline:altdata']
      );

      const altDataPoints: DBAltData[] = [];

      // 1. Fetch from LinkUp (employment, web traffic)
      console.log(`Fetching LinkUp data for ${symbol}...`);
      try {
        const linkupData = await this.linkup.getAltData({
          symbol,
          start: start.toISOString(),
          end: end.toISOString(),
        });

        for (const point of linkupData) {
          altDataPoints.push({
            symbol,
            ts: new Date(point.ts),
            metric: `linkup_${point.metric}`,
            value: point.value,
          });
        }

        console.log(`Found ${linkupData.length} LinkUp data points`);
      } catch (error) {
        console.error('LinkUp fetch error:', error);
      }

      // 2. Fetch from Senso.ai alt data endpoints
      console.log(`Fetching Senso.ai alt data for ${symbol}...`);
      try {
        const sensoData = await this.sensoAi.getAltData(
          symbol,
          start.toISOString(),
          end.toISOString()
        );

        for (const metric of sensoData) {
          altDataPoints.push({
            symbol,
            ts: new Date(metric.timestamp),
            metric: `senso_${metric.name}`,
            value: metric.value,
          });
        }

        console.log(`Found ${sensoData.length} Senso.ai data points`);
      } catch (error) {
        console.error('Senso.ai alt data error:', error);
      }

      // 3. Store in ClickHouse
      if (altDataPoints.length > 0) {
        console.log(`Storing ${altDataPoints.length} alt-data points...`);
        await this.clickhouse.insertAltData(altDataPoints);
      }

      // Cache results
      altDataCache.set(cacheKey, true, 600); // 10 minutes

      await this.datadog.sendEvent(
        'Alt-Data Pipeline Completed',
        `Processed ${altDataPoints.length} data points for ${symbol}`,
        [`symbol:${symbol}`, 'pipeline:altdata', 'status:success']
      );

      await this.datadog.sendMetric('trading_agent.pipeline.altdata.points', altDataPoints.length, [
        `symbol:${symbol}`,
      ]);
    } catch (error) {
      console.error('Alt-data pipeline error:', error);

      await this.datadog.sendEvent(
        'Alt-Data Pipeline Failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
        [`symbol:${symbol}`, 'pipeline:altdata', 'status:error']
      );

      throw error;
    }
  }
}

/**
 * Pipeline Scheduler
 * Runs pipelines on a schedule
 */
export class PipelineScheduler {
  private newsPipeline = new NewsPipeline();
  private altDataPipeline = new AltDataPipeline();
  private symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'META', 'AMZN', 'GOOGL'];

  /**
   * Run all pipelines for recent data
   */
  async runAll(): Promise<void> {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    for (const symbol of this.symbols) {
      try {
        console.log(`Running pipelines for ${symbol}...`);
        
        await Promise.all([
          this.newsPipeline.run(symbol, start, end),
          this.altDataPipeline.run(symbol, start, end),
        ]);

        console.log(`Completed pipelines for ${symbol}`);
      } catch (error) {
        console.error(`Pipeline error for ${symbol}:`, error);
      }
    }
  }

  /**
   * Start scheduled execution
   */
  startScheduled(intervalMinutes: number = 30): NodeJS.Timeout {
    console.log(`Starting pipeline scheduler (interval: ${intervalMinutes} minutes)`);
    
    // Run immediately
    this.runAll().catch(console.error);

    // Then run on schedule
    return setInterval(() => {
      this.runAll().catch(console.error);
    }, intervalMinutes * 60 * 1000);
  }
}

// Singleton instances
let newsPipeline: NewsPipeline | null = null;
let altDataPipeline: AltDataPipeline | null = null;
let pipelineScheduler: PipelineScheduler | null = null;

export function getNewsPipeline(): NewsPipeline {
  if (!newsPipeline) {
    newsPipeline = new NewsPipeline();
  }
  return newsPipeline;
}

export function getAltDataPipeline(): AltDataPipeline {
  if (!altDataPipeline) {
    altDataPipeline = new AltDataPipeline();
  }
  return altDataPipeline;
}

export function getPipelineScheduler(): PipelineScheduler {
  if (!pipelineScheduler) {
    pipelineScheduler = new PipelineScheduler();
  }
  return pipelineScheduler;
}
