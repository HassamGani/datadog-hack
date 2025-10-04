/**
 * Indicator processor to calculate indicator values from price data
 */

import type { IndicatorDataPoint } from './calculations';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateBollingerBands,
  calculateMACD,
  calculateVWAP,
  calculateATR,
  calculateStochastic,
} from './calculations';
import type { IndicatorConfig, IndicatorSeries } from './types';

export function processIndicators(
  priceData: IndicatorDataPoint[],
  indicators: IndicatorConfig[]
): IndicatorSeries[] {
  const series: IndicatorSeries[] = [];

  for (const indicator of indicators) {
    if (!indicator.visible) continue;

    try {
      switch (indicator.type) {
        case 'sma': {
          const period = indicator.params.period || 20;
          const data = calculateSMA(priceData, period);
          series.push({
            id: indicator.id,
            name: `${indicator.name} (${period})`,
            data,
            color: indicator.color || '#2196F3',
            lineWidth: 2,
          });
          break;
        }

        case 'ema': {
          const period = indicator.params.period || 12;
          const data = calculateEMA(priceData, period);
          series.push({
            id: indicator.id,
            name: `${indicator.name} (${period})`,
            data,
            color: indicator.color || '#FF9800',
            lineWidth: 2,
          });
          break;
        }

        case 'rsi': {
          const period = indicator.params.period || 14;
          const data = calculateRSI(priceData, period);
          series.push({
            id: indicator.id,
            name: `${indicator.name} (${period})`,
            data,
            color: indicator.color || '#9C27B0',
            lineWidth: 2,
          });
          break;
        }

        case 'bollinger': {
          const period = indicator.params.period || 20;
          const stdDev = indicator.params.stdDev || 2;
          const bands = calculateBollingerBands(priceData, period, stdDev);
          
          const baseColor = indicator.color || '#4CAF50';
          series.push(
            {
              id: `${indicator.id}_upper`,
              name: `${indicator.name} Upper`,
              data: bands.upper,
              color: baseColor,
              lineWidth: 1,
            },
            {
              id: `${indicator.id}_middle`,
              name: `${indicator.name} Middle`,
              data: bands.middle,
              color: baseColor,
              lineWidth: 2,
            },
            {
              id: `${indicator.id}_lower`,
              name: `${indicator.name} Lower`,
              data: bands.lower,
              color: baseColor,
              lineWidth: 1,
            }
          );
          break;
        }

        case 'macd': {
          const fastPeriod = indicator.params.fastPeriod || 12;
          const slowPeriod = indicator.params.slowPeriod || 26;
          const signalPeriod = indicator.params.signalPeriod || 9;
          const macdData = calculateMACD(priceData, fastPeriod, slowPeriod, signalPeriod);
          
          series.push(
            {
              id: `${indicator.id}_macd`,
              name: `${indicator.name} Line`,
              data: macdData.macd,
              color: indicator.color || '#F44336',
              lineWidth: 2,
            },
            {
              id: `${indicator.id}_signal`,
              name: `${indicator.name} Signal`,
              data: macdData.signal,
              color: '#2196F3',
              lineWidth: 2,
            }
          );
          break;
        }

        case 'vwap': {
          const data = calculateVWAP(priceData);
          series.push({
            id: indicator.id,
            name: indicator.name,
            data,
            color: indicator.color || '#00BCD4',
            lineWidth: 2,
          });
          break;
        }

        case 'atr': {
          const period = indicator.params.period || 14;
          const data = calculateATR(priceData, period);
          series.push({
            id: indicator.id,
            name: `${indicator.name} (${period})`,
            data,
            color: indicator.color || '#FF5722',
            lineWidth: 2,
          });
          break;
        }

        case 'stochastic': {
          const kPeriod = indicator.params.kPeriod || 14;
          const dPeriod = indicator.params.dPeriod || 3;
          const stochData = calculateStochastic(priceData, kPeriod, dPeriod);
          
          series.push(
            {
              id: `${indicator.id}_k`,
              name: `${indicator.name} %K`,
              data: stochData.k,
              color: indicator.color || '#673AB7',
              lineWidth: 2,
            },
            {
              id: `${indicator.id}_d`,
              name: `${indicator.name} %D`,
              data: stochData.d,
              color: '#E91E63',
              lineWidth: 2,
            }
          );
          break;
        }
      }
    } catch (error) {
      console.error(`Error processing indicator ${indicator.name}:`, error);
    }
  }

  return series;
}

