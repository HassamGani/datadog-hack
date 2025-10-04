# Historical Data Implementation

## Overview
Added a toggle feature that allows users to switch between **Realtime Data** (from Finnhub WebSocket) and **Historical Data** (from Yahoo Finance) for the live chart.

## Changes Made

### 1. Dependencies
- **Added Package**: `yahoo-finance2` for fetching historical stock/crypto data from Yahoo Finance

### 2. API Route: `/api/yahoo-finance`
**File**: `src/app/api/yahoo-finance/route.ts`

- Fetches historical data from Yahoo Finance API
- Parameters:
  - `symbol`: Stock ticker or crypto symbol
  - `startDate`: Start date in YYYY-MM-DD format
  - `endDate`: End date in YYYY-MM-DD format
- Handles crypto symbol conversion (e.g., BINANCE:BTCUSDT → BTC-USD)
- Returns quote-like data and historical price points compatible with the chart

### 3. TradingDashboard Component
**File**: `src/components/dashboard/TradingDashboard.tsx`

#### New State Variables:
- `dataMode`: Tracks whether user is viewing "realtime" or "historical" data
- `historicalStartDate`: Start date for historical data range (default: 1 month ago)
- `historicalEndDate`: End date for historical data range (default: today)
- `historicalData`: Stores fetched historical quote and price history
- `isLoadingHistorical`: Loading state for historical data fetch
- `historicalError`: Error state for historical data fetch

#### New Functions:
- `fetchHistoricalData()`: Fetches historical data from Yahoo Finance API
- `handleDataModeChange()`: Handles toggle between realtime/historical modes
- Updated `handleSymbolChange()` and `handleCustomSymbolSubmit()` to clear historical data when symbol changes

#### UI Changes:
- **Data Source Toggle**: Switch between Realtime and Historical modes with icons
- **Date Pickers**: When in Historical mode, users can select start and end dates
- **Fetch Button**: Loads historical data for the selected date range
- **Mode-specific Alerts**: Different status messages for realtime vs historical modes
- **Chart Title**: Updates to show "Live price action" or "Historical price action"
- **Chart Subheader**: Shows date range and data point count in historical mode

### 4. Trading Agent Context
**File**: `src/lib/agents/tradingAgent.ts`

#### Updated TradingAgentContext Interface:
- Added `dataMode?: "realtime" | "historical"` field
- Added `historicalDateRange?: { startDate: string; endDate: string }` field

#### System Message Update:
- Agent now receives information about the current data mode
- In historical mode, the agent knows the exact date range being analyzed
- This allows the agent to provide context-aware insights

### 5. LightweightChart Component
**File**: `src/components/trading/LightweightChart.tsx`

No changes needed! The chart component already accepts generic data in the format `{ time: number; value: number }[]`, so it works seamlessly with both realtime and historical data.

### 6. Technical Indicators
**Files**: `src/lib/indicators/*`

No changes needed! All technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, etc.) work with the generic `IndicatorDataPoint[]` format, so they automatically work with historical data.

## Features

### Realtime Mode (Default)
- Uses Finnhub WebSocket for live streaming data
- Shows streaming status and controls
- Real-time price updates with visual flash effects
- Keeps last 1 hour of data

### Historical Mode
- Fetches data from Yahoo Finance
- Users can specify any date range
- Displays daily OHLCV (Open, High, Low, Close, Volume) data
- Supports both stocks and cryptocurrencies
- Shows data point count and date range in chart header

## How to Use

1. **Switch to Historical Mode**:
   - Click the "Historical" toggle button in the Data Source section

2. **Select Date Range**:
   - Use the Start Date and End Date pickers to choose your desired range
   - Default is last 1 month to today

3. **Fetch Data**:
   - Click the "Fetch Data" button to load historical prices
   - Loading indicator shows while fetching

4. **Analyze**:
   - Technical indicators automatically update with historical data
   - Trading agent understands the historical context
   - All features work the same way as in realtime mode

5. **Switch Back to Realtime**:
   - Click the "Realtime" toggle to return to live streaming data

## Symbol Conversion

The API automatically converts crypto symbols:
- `BINANCE:BTCUSDT` → `BTC-USD` (Yahoo Finance format)
- `BINANCE:ETHUSDT` → `ETH-USD`
- Stock symbols like `AAPL`, `MSFT` work directly

## Data Compatibility

Both realtime and historical data use the same format:
```typescript
interface StreamingPoint {
  time: number;    // Unix timestamp in seconds
  value: number;   // Close price
}

interface FinnhubQuote {
  symbol: string;
  current: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}
```

This ensures seamless switching between modes without any data transformation issues.

## Error Handling

- Invalid date ranges show user-friendly error messages
- Symbol not found errors are displayed clearly
- Network errors are caught and displayed
- Automatic fallback to safe states on errors

## Future Enhancements

Possible improvements:
- Add intraday intervals (1h, 4h, 15m) for historical data
- Cache historical data to avoid repeated fetches
- Add export functionality for historical data
- Support for additional data sources beyond Yahoo Finance
- Volume charts and advanced technical analysis tools


