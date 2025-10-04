/**
 * Phenoml Integration
 * Advanced statistical analysis and anomaly detection
 */

import type { PriceData } from '../types';

export interface PhenomlAnalysis {
  anomalies: Array<{
    ts: string;
    score: number;
    type: string;
    description: string;
  }>;
  patterns: Array<{
    name: string;
    confidence: number;
    timeRange: { start: string; end: string };
  }>;
  predictions: Array<{
    ts: string;
    predictedValue: number;
    confidence: number;
  }>;
}

export class PhenomlClient {
  /**
   * Detect anomalies in price data
   */
  async detectAnomalies(prices: PriceData[]): Promise<PhenomlAnalysis['anomalies']> {
    const anomalies: PhenomlAnalysis['anomalies'] = [];

    // Calculate z-scores for volume and price changes
    const returns = prices.slice(1).map((p, i) => ({
      ts: p.ts,
      return: (p.close - prices[i].close) / prices[i].close,
      volume: p.volume,
    }));

    const avgReturn = returns.reduce((sum, r) => sum + r.return, 0) / returns.length;
    const stdReturn =
      Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r.return - avgReturn, 2), 0) / returns.length
      ) || 1;

    // Detect price anomalies (z-score > 2.5)
    returns.forEach((r) => {
      const zScore = Math.abs((r.return - avgReturn) / stdReturn);
      if (zScore > 2.5) {
        anomalies.push({
          ts: r.ts,
          score: zScore,
          type: r.return > 0 ? 'spike' : 'drop',
          description: `Unusual ${r.return > 0 ? 'gain' : 'loss'} of ${(r.return * 100).toFixed(2)}% (z-score: ${zScore.toFixed(2)})`,
        });
      }
    });

    // Volume anomalies
    const avgVolume = returns.reduce((sum, r) => sum + r.volume, 0) / returns.length;
    const stdVolume =
      Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r.volume - avgVolume, 2), 0) / returns.length
      ) || 1;

    returns.forEach((r) => {
      const zScore = (r.volume - avgVolume) / stdVolume;
      if (zScore > 3) {
        anomalies.push({
          ts: r.ts,
          score: zScore,
          type: 'volume_spike',
          description: `Unusual trading volume: ${r.volume.toLocaleString()} (z-score: ${zScore.toFixed(2)})`,
        });
      }
    });

    return anomalies;
  }

  /**
   * Identify chart patterns
   */
  async identifyPatterns(prices: PriceData[]): Promise<PhenomlAnalysis['patterns']> {
    const patterns: PhenomlAnalysis['patterns'] = [];

    if (prices.length < 10) return patterns;

    // Head and shoulders pattern detection
    const peaks = this.findPeaks(prices);
    if (peaks.length >= 3) {
      const [left, head, right] = peaks.slice(-3);
      
      if (
        head.close > left.close &&
        head.close > right.close &&
        Math.abs(left.close - right.close) / left.close < 0.05
      ) {
        patterns.push({
          name: 'head_and_shoulders',
          confidence: 0.75,
          timeRange: {
            start: left.ts,
            end: right.ts,
          },
        });
      }
    }

    // Double bottom/top
    const troughs = this.findTroughs(prices);
    if (troughs.length >= 2) {
      const [first, second] = troughs.slice(-2);
      if (Math.abs(first.close - second.close) / first.close < 0.03) {
        patterns.push({
          name: 'double_bottom',
          confidence: 0.7,
          timeRange: {
            start: first.ts,
            end: second.ts,
          },
        });
      }
    }

    // Trend detection
    const trend = this.detectTrend(prices);
    if (trend !== 'sideways') {
      patterns.push({
        name: trend === 'up' ? 'uptrend' : 'downtrend',
        confidence: 0.8,
        timeRange: {
          start: prices[0].ts,
          end: prices[prices.length - 1].ts,
        },
      });
    }

    return patterns;
  }

  /**
   * Generate predictions
   */
  async generatePredictions(prices: PriceData[], horizon: number = 5): Promise<PhenomlAnalysis['predictions']> {
    const predictions: PhenomlAnalysis['predictions'] = [];

    if (prices.length < 10) return predictions;

    // Simple linear regression for trend
    const recent = prices.slice(-20);
    const n = recent.length;
    
    const xSum = (n * (n - 1)) / 2;
    const ySum = recent.reduce((sum, p) => sum + p.close, 0);
    const xySum = recent.reduce((sum, p, i) => sum + i * p.close, 0);
    const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    // Generate predictions
    const lastPrice = prices[prices.length - 1];
    const lastTime = new Date(lastPrice.ts).getTime();
    const timeStep = 60 * 60 * 1000; // 1 hour

    for (let i = 1; i <= horizon; i++) {
      const predictedValue = intercept + slope * (n + i - 1);
      const confidence = Math.max(0.5, 1 - (i * 0.1)); // Decrease confidence with distance

      predictions.push({
        ts: new Date(lastTime + i * timeStep).toISOString(),
        predictedValue,
        confidence,
      });
    }

    return predictions;
  }

  /**
   * Comprehensive analysis
   */
  async analyze(prices: PriceData[]): Promise<PhenomlAnalysis> {
    const [anomalies, patterns, predictions] = await Promise.all([
      this.detectAnomalies(prices),
      this.identifyPatterns(prices),
      this.generatePredictions(prices),
    ]);

    return { anomalies, patterns, predictions };
  }

  // Helper methods
  private findPeaks(prices: PriceData[]): PriceData[] {
    const peaks: PriceData[] = [];
    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i].high > prices[i - 1].high && prices[i].high > prices[i + 1].high) {
        peaks.push(prices[i]);
      }
    }
    return peaks;
  }

  private findTroughs(prices: PriceData[]): PriceData[] {
    const troughs: PriceData[] = [];
    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i].low < prices[i - 1].low && prices[i].low < prices[i + 1].low) {
        troughs.push(prices[i]);
      }
    }
    return troughs;
  }

  private detectTrend(prices: PriceData[]): 'up' | 'down' | 'sideways' {
    const first = prices[0].close;
    const last = prices[prices.length - 1].close;
    const change = (last - first) / first;

    if (change > 0.05) return 'up';
    if (change < -0.05) return 'down';
    return 'sideways';
  }
}

let phenomlClient: PhenomlClient | null = null;

export function getPhenomlClient(): PhenomlClient {
  if (!phenomlClient) {
    phenomlClient = new PhenomlClient();
  }
  return phenomlClient;
}
