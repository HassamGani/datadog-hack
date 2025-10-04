# Ticker Switching Fix for Historical Mode

## Problem
When switching tickers in historical mode, the historical data was cleared but not automatically re-fetched, requiring users to manually click "Fetch Data" each time they changed symbols. This created a poor user experience.

## Root Cause
The original implementation had a circular dependency issue:
1. `currentSymbol` was derived from `quote?.symbol || DEFAULT_SYMBOLS[0]`
2. In historical mode, `quote` came from `historicalData.quote`
3. This created a circular dependency when trying to auto-fetch based on symbol changes

## Solution

### 1. Added Independent Symbol Tracking
**Change**: Added a `selectedSymbol` state to track the user's symbol selection independently from the quote data.

```typescript
const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOLS[0]);
```

This allows us to:
- Track what symbol the user wants to view
- Avoid circular dependencies with quote data
- Properly detect when the user changes symbols

### 2. Updated Symbol Display Logic
**Change**: Updated `currentSymbol` to fall back to `selectedSymbol` instead of just the default.

```typescript
const currentSymbol = quote?.symbol || selectedSymbol;
```

### 3. Refactored Data Fetching
**Change**: Updated `fetchHistoricalData` to use `selectedSymbol` instead of `currentSymbol`.

```typescript
const fetchHistoricalData = useCallback(async () => {
  // Uses selectedSymbol instead of currentSymbol
  const response = await fetch(
    `/api/yahoo-finance?symbol=${encodeURIComponent(selectedSymbol)}&startDate=${historicalStartDate}&endDate=${historicalEndDate}`
  );
  // ...
}, [selectedSymbol, historicalStartDate, historicalEndDate]);
```

### 4. Added Auto-Fetch Effect
**Change**: Added a clean `useEffect` that automatically fetches historical data when the symbol or dates change in historical mode.

```typescript
useEffect(() => {
  if (dataMode === "historical" && selectedSymbol && historicalStartDate && historicalEndDate) {
    fetchHistoricalData();
  }
}, [selectedSymbol, dataMode, historicalStartDate, historicalEndDate, fetchHistoricalData]);
```

This effect triggers whenever:
- The user switches to historical mode
- The selected symbol changes
- The start or end date changes

### 5. Updated Symbol Change Handlers
**Change**: Simplified the symbol change handlers to update both `selectedSymbol` and the realtime symbol.

```typescript
const handleSymbolChange = (_: unknown, nextSymbol: string | null) => {
  if (!nextSymbol) return;
  
  setSelectedSymbol(nextSymbol);
  setRealtimeSymbol(nextSymbol);
  setCustomSymbol("");
  
  // Auto-fetch happens via useEffect
};
```

Removed the manual clearing of historical data - the effect handles re-fetching automatically.

### 6. Updated Toggle Button Groups
**Change**: Updated the Quick Select toggle buttons to use `selectedSymbol` for proper highlighting.

```typescript
<ToggleButtonGroup
  value={DEFAULT_SYMBOLS.includes(selectedSymbol) ? selectedSymbol : null}
  // ...
>
```

## Benefits

### ✅ Automatic Data Fetching
When in historical mode:
- Switching symbols automatically fetches new historical data
- Changing date ranges automatically re-fetches data
- No manual "Fetch Data" button click required (though it still works if preferred)

### ✅ No Circular Dependencies
- Symbol tracking is independent of quote data
- Clean dependency chains in effects
- No infinite re-render loops

### ✅ Better User Experience
- Seamless symbol switching in both modes
- Proper toggle button highlighting
- Loading states show during auto-fetch
- Error handling remains robust

### ✅ Consistent Behavior
- Realtime and historical modes now behave similarly
- Symbol changes feel natural and responsive
- Works with both Quick Select buttons and custom symbol input

## Testing Scenarios

All of these should now work smoothly:

1. **Quick Select Stocks**: Click AAPL → MSFT → TSLA in historical mode
   - Each click automatically loads new historical data
   - Loading indicator shows during fetch
   - Chart updates with new data

2. **Quick Select Crypto**: Click BTCUSDT → ETHUSDT in historical mode
   - Symbol conversion happens automatically
   - Data fetches without manual intervention

3. **Custom Symbol**: Type "GOOGL" and press Enter in historical mode
   - Immediately fetches historical data for GOOGL
   - No need to click "Fetch Data"

4. **Date Range Changes**: Change start or end date in historical mode
   - Automatically re-fetches data with new date range
   - Current symbol is preserved

5. **Mode Switching**: Switch from realtime to historical
   - Automatically fetches historical data for current symbol
   - Switch back to realtime resumes live streaming

6. **Symbol + Mode**: Change symbol while in realtime, then switch to historical
   - Historical data fetches for the newly selected symbol
   - No stale data issues

## Technical Notes

- **Realtime Symbol**: `setRealtimeSymbol` controls the Finnhub WebSocket subscription
- **Selected Symbol**: `selectedSymbol` state tracks user's choice across both modes
- **Current Symbol**: `currentSymbol` is a computed value for display purposes
- **Effect Dependencies**: Carefully managed to avoid unnecessary re-fetches

## Future Enhancements

Possible improvements:
- Add debouncing for rapid symbol switches
- Cache historical data per symbol to avoid repeated fetches
- Add a "Refresh" button for manual data updates
- Show a subtle indicator when auto-fetching occurs


