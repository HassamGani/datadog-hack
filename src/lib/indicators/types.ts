/**
 * Types for technical indicators
 */

export type IndicatorType = 
  | 'sma' 
  | 'ema' 
  | 'rsi' 
  | 'bollinger' 
  | 'macd' 
  | 'vwap' 
  | 'atr' 
  | 'stochastic';

export interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  name: string;
  params: IndicatorParams;
  color?: string;
  visible: boolean;
}

export interface IndicatorParams {
  period?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  stdDev?: number;
  kPeriod?: number;
  dPeriod?: number;
}

export interface IndicatorSeries {
  id: string;
  name: string;
  data: Array<{ time: number; value: number }>;
  color: string;
  lineWidth?: number;
  priceLineVisible?: boolean;
}

export const INDICATOR_DEFAULTS: Record<IndicatorType, { name: string; params: IndicatorParams; color: string }> = {
  sma: { name: 'SMA', params: { period: 20 }, color: '#2196F3' },
  ema: { name: 'EMA', params: { period: 12 }, color: '#FF9800' },
  rsi: { name: 'RSI', params: { period: 14 }, color: '#9C27B0' },
  bollinger: { name: 'Bollinger Bands', params: { period: 20, stdDev: 2 }, color: '#4CAF50' },
  macd: { name: 'MACD', params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }, color: '#F44336' },
  vwap: { name: 'VWAP', params: {}, color: '#00BCD4' },
  atr: { name: 'ATR', params: { period: 14 }, color: '#FF5722' },
  stochastic: { name: 'Stochastic', params: { kPeriod: 14, dPeriod: 3 }, color: '#673AB7' },
};

export const INDICATOR_DESCRIPTIONS: Record<IndicatorType, string> = {
  sma: 'Simple Moving Average - Shows the average price over a specified period',
  ema: 'Exponential Moving Average - Gives more weight to recent prices',
  rsi: 'Relative Strength Index - Measures momentum on a scale of 0-100',
  bollinger: 'Bollinger Bands - Shows volatility with upper and lower bands',
  macd: 'MACD - Shows relationship between two moving averages',
  vwap: 'Volume Weighted Average Price - Average price weighted by volume',
  atr: 'Average True Range - Measures market volatility',
  stochastic: 'Stochastic Oscillator - Compares closing price to price range',
};

