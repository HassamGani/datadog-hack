/**
 * Technical Indicator Calculations for Day Trading
 */

export interface IndicatorDataPoint {
  time: number;
  value: number;
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(data: IndicatorDataPoint[], period: number): IndicatorDataPoint[] {
  if (data.length < period) return [];
  
  const result: IndicatorDataPoint[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, point) => acc + point.value, 0);
    const avg = sum / period;
    result.push({ time: data[i].time, value: avg });
  }
  
  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(data: IndicatorDataPoint[], period: number): IndicatorDataPoint[] {
  if (data.length < period) return [];
  
  const result: IndicatorDataPoint[] = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for the first value
  const firstSum = data.slice(0, period).reduce((acc, point) => acc + point.value, 0);
  let ema = firstSum / period;
  result.push({ time: data[period - 1].time, value: ema });
  
  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    ema = (data[i].value - ema) * multiplier + ema;
    result.push({ time: data[i].time, value: ema });
  }
  
  return result;
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(data: IndicatorDataPoint[], period: number = 14): IndicatorDataPoint[] {
  if (data.length < period + 1) return [];
  
  const result: IndicatorDataPoint[] = [];
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = data[i].value - data[i - 1].value;
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Calculate RSI for first period
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  result.push({ time: data[period].time, value: rsi });
  
  // Calculate RSI for remaining values using smoothed averages
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].value - data[i - 1].value;
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result.push({ time: data[i].time, value: rsi });
  }
  
  return result;
}

/**
 * Bollinger Bands
 */
export interface BollingerBandsResult {
  upper: IndicatorDataPoint[];
  middle: IndicatorDataPoint[];
  lower: IndicatorDataPoint[];
}

export function calculateBollingerBands(
  data: IndicatorDataPoint[], 
  period: number = 20, 
  stdDev: number = 2
): BollingerBandsResult {
  if (data.length < period) {
    return { upper: [], middle: [], lower: [] };
  }
  
  const result: BollingerBandsResult = { upper: [], middle: [], lower: [] };
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, point) => acc + point.value, 0);
    const mean = sum / period;
    
    const squaredDiffs = slice.map(point => Math.pow(point.value - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    const time = data[i].time;
    result.middle.push({ time, value: mean });
    result.upper.push({ time, value: mean + stdDev * standardDeviation });
    result.lower.push({ time, value: mean - stdDev * standardDeviation });
  }
  
  return result;
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export interface MACDResult {
  macd: IndicatorDataPoint[];
  signal: IndicatorDataPoint[];
  histogram: IndicatorDataPoint[];
}

export function calculateMACD(
  data: IndicatorDataPoint[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const result: MACDResult = { macd: [], signal: [], histogram: [] };
  
  if (data.length < slowPeriod + signalPeriod) {
    return result;
  }
  
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine: IndicatorDataPoint[] = [];
  const minLength = Math.min(fastEMA.length, slowEMA.length);
  
  for (let i = 0; i < minLength; i++) {
    const fastIdx = fastEMA.length - minLength + i;
    const slowIdx = slowEMA.length - minLength + i;
    
    if (fastEMA[fastIdx].time === slowEMA[slowIdx].time) {
      macdLine.push({
        time: fastEMA[fastIdx].time,
        value: fastEMA[fastIdx].value - slowEMA[slowIdx].value
      });
    }
  }
  
  // Calculate signal line (EMA of MACD)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // Calculate histogram (MACD - Signal)
  const histogram: IndicatorDataPoint[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macdIdx = macdLine.length - signalLine.length + i;
    histogram.push({
      time: signalLine[i].time,
      value: macdLine[macdIdx].value - signalLine[i].value
    });
  }
  
  result.macd = macdLine;
  result.signal = signalLine;
  result.histogram = histogram;
  
  return result;
}

/**
 * Volume Weighted Average Price (VWAP)
 * Note: Requires volume data, so this is a simplified version using equal weights
 */
export function calculateVWAP(data: IndicatorDataPoint[]): IndicatorDataPoint[] {
  if (data.length === 0) return [];
  
  const result: IndicatorDataPoint[] = [];
  let cumulativePrice = 0;
  
  for (let i = 0; i < data.length; i++) {
    cumulativePrice += data[i].value;
    const vwap = cumulativePrice / (i + 1);
    result.push({ time: data[i].time, value: vwap });
  }
  
  return result;
}

/**
 * Average True Range (ATR)
 * Simplified version using just price data
 */
export function calculateATR(data: IndicatorDataPoint[], period: number = 14): IndicatorDataPoint[] {
  if (data.length < period + 1) return [];
  
  const result: IndicatorDataPoint[] = [];
  const ranges: number[] = [];
  
  // Calculate true ranges
  for (let i = 1; i < data.length; i++) {
    const range = Math.abs(data[i].value - data[i - 1].value);
    ranges.push(range);
  }
  
  // Calculate ATR using SMA of ranges
  for (let i = period - 1; i < ranges.length; i++) {
    const sum = ranges.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
    const atr = sum / period;
    result.push({ time: data[i + 1].time, value: atr });
  }
  
  return result;
}

/**
 * Stochastic Oscillator
 */
export interface StochasticResult {
  k: IndicatorDataPoint[];
  d: IndicatorDataPoint[];
}

export function calculateStochastic(
  data: IndicatorDataPoint[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticResult {
  const result: StochasticResult = { k: [], d: [] };
  
  if (data.length < kPeriod) return result;
  
  // Calculate %K
  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map(p => p.value));
    const low = Math.min(...slice.map(p => p.value));
    const close = data[i].value;
    
    const k = low === high ? 50 : ((close - low) / (high - low)) * 100;
    result.k.push({ time: data[i].time, value: k });
  }
  
  // Calculate %D (SMA of %K)
  result.d = calculateSMA(result.k, dPeriod);
  
  return result;
}

