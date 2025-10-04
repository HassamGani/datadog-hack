"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  TextField,
  Button,
  InputAdornment,
  Alert,
  CircularProgress,
} from "@mui/material";
import { TrendingUp, TrendingDown, Search, PlayArrow, Stop, CalendarToday, ShowChart } from "@mui/icons-material";
import { Sparkles, TrendingUp as TrendingUpLucide, TrendingDown as TrendingDownLucide, ArrowUpCircle, ArrowDownCircle, Activity, DollarSign, BarChart3, Target, Zap } from "lucide-react";
import dynamic from "next/dynamic";
import { useFinnhubQuote } from "@/hooks/useFinnhubQuote";
import type { IndicatorConfig } from "@/lib/indicators/types";
import { processIndicators } from "@/lib/indicators/processor";
import IndicatorControls from "@/components/trading/IndicatorControls";
import TradingAgentChat from "@/components/agents/TradingAgentChat";
import UsefulSources from "@/components/dashboard/UsefulSources";
import type { TradingAgentContext, UsefulSource } from "@/lib/agents/tradingAgent";
import type { FinnhubQuote, StreamingPoint } from "@/lib/types";

const LightweightChart = dynamic(() => import("@/components/trading/LightweightChart"), {
  ssr: false,
});

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "TSLA", "NVDA", "META", "AMZN"];
const CRYPTO_SYMBOLS = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "BINANCE:SOLUSDT"];

type DataMode = "realtime" | "historical";

export default function TradingDashboard() {
  const [customSymbol, setCustomSymbol] = useState("");
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([]);
  const [dataMode, setDataMode] = useState<DataMode>("realtime");
  const [usefulSources, setUsefulSources] = useState<UsefulSource[]>([]);
  
  // Track the selected symbol independently
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOLS[0]);
  
  // Historical data state
  const [historicalStartDate, setHistoricalStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [historicalEndDate, setHistoricalEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [historicalData, setHistoricalData] = useState<{
    quote: FinnhubQuote | null;
    history: StreamingPoint[];
  }>({ quote: null, history: [] });
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  const { quote: realtimeQuote, history: realtimeHistory, isLoading: isLoadingRealtime, error: realtimeError, isStreaming, setSymbol: setRealtimeSymbol, toggleStreaming } =
    useFinnhubQuote({ symbol: DEFAULT_SYMBOLS[0] });

  // Get current data based on mode
  const quote = dataMode === "realtime" ? realtimeQuote : historicalData.quote;
  const history = dataMode === "realtime" ? realtimeHistory : historicalData.history;
  const isLoading = dataMode === "realtime" ? isLoadingRealtime : isLoadingHistorical;
  const error = dataMode === "realtime" ? realtimeError : historicalError;
  
  // Get current symbol from quote or fall back to selected symbol
  const currentSymbol = quote?.symbol || selectedSymbol;

  // Price blink effect state
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);
  const prevPriceRef = useRef<number | null>(null);

  // Detect price changes and trigger flash
  useEffect(() => {
    if (!quote) return;
    
    const currentPrice = quote.current;
    const prevPrice = prevPriceRef.current;

    // Always update the ref for next comparison
    prevPriceRef.current = currentPrice;

    if (prevPrice !== null && Math.abs(currentPrice - prevPrice) > 0.01) {
      // Price changed, trigger flash
      const direction = currentPrice > prevPrice ? "up" : "down";
      setPriceFlash(direction);
      
      // Remove flash after animation
      const timer = setTimeout(() => {
        setPriceFlash(null);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [quote]);

  // Reset price ref when symbol changes
  useEffect(() => {
    prevPriceRef.current = null;
    setPriceFlash(null);
  }, [currentSymbol]);

  // Fetch historical data from Yahoo Finance
  const fetchHistoricalData = useCallback(async () => {
    if (!selectedSymbol || !historicalStartDate || !historicalEndDate) {
      setHistoricalError("Please provide symbol and date range");
      return;
    }

    setIsLoadingHistorical(true);
    setHistoricalError(null);

    try {
      const response = await fetch(
        `/api/yahoo-finance?symbol=${encodeURIComponent(selectedSymbol)}&startDate=${historicalStartDate}&endDate=${historicalEndDate}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch historical data");
      }

      const data = await response.json();
      setHistoricalData({
        quote: data.quote,
        history: data.history,
      });
    } catch (err) {
      console.error("Error fetching historical data:", err);
      setHistoricalError(err instanceof Error ? err.message : "Failed to fetch historical data");
    } finally {
      setIsLoadingHistorical(false);
    }
  }, [selectedSymbol, historicalStartDate, historicalEndDate]);

  // Auto-fetch historical data when symbol or dates change in historical mode
  useEffect(() => {
    if (dataMode === "historical" && selectedSymbol && historicalStartDate && historicalEndDate) {
      fetchHistoricalData();
    }
  }, [selectedSymbol, dataMode, historicalStartDate, historicalEndDate, fetchHistoricalData]);

  // Handle data mode change
  const handleDataModeChange = (_: unknown, newMode: DataMode | null) => {
    if (!newMode) return;
    setDataMode(newMode);
  };

  const handleSymbolChange = (_: unknown, nextSymbol: string | null) => {
    if (!nextSymbol) return;
    
    // Update both the selected symbol and realtime symbol
    setSelectedSymbol(nextSymbol);
    setRealtimeSymbol(nextSymbol);
    setCustomSymbol("");
    
    // The useEffect will automatically fetch new historical data if in historical mode
  };

  const handleCustomSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSymbol = customSymbol.trim().toUpperCase();
    if (trimmedSymbol) {
      // Update both the selected symbol and realtime symbol
      setSelectedSymbol(trimmedSymbol);
      setRealtimeSymbol(trimmedSymbol);
      
      // The useEffect will automatically fetch new historical data if in historical mode
    }
  };

  const changeColor = quote && quote.change >= 0 ? "success.main" : "error.main";
  const ChangeIcon = quote && quote.change >= 0 ? TrendingUp : TrendingDown;
  const changeLabel = useMemo(() => {
    if (!quote) return "";
    const direction = quote.change >= 0 ? "up" : "down";
    return `${direction} ${quote.percentChange.toFixed(2)}%`;
  }, [quote]);

  // Process indicators for visualization
  const indicatorSeries = useMemo(() => {
    if (history.length === 0) return [];
    const visibleIndicators = indicators.filter(ind => ind.visible);
    return processIndicators(history, visibleIndicators);
  }, [history, indicators]);

  // Indicator management functions
  const handleAddIndicator = (indicator: IndicatorConfig) => {
    setIndicators([...indicators, indicator]);
  };

  const handleRemoveIndicator = (id: string) => {
    setIndicators(indicators.filter(ind => ind.id !== id));
  };

  const handleToggleIndicator = (id: string) => {
    setIndicators(indicators.map(ind => 
      ind.id === id ? { ...ind, visible: !ind.visible } : ind
    ));
  };

  const handleUpdateIndicator = (id: string, params: Record<string, number>) => {
    setIndicators(indicators.map(ind =>
      ind.id === id ? { ...ind, params: { ...ind.params, ...params } } : ind
    ));
  };

  // Useful sources management
  const handleAddUsefulSource = (source: UsefulSource) => {
    setUsefulSources(prev => [source, ...prev]);
  };

  const handleRemoveUsefulSource = (id: string) => {
    setUsefulSources(prev => prev.filter(s => s.id !== id));
  };

  // Build agent context
  const agentContext: TradingAgentContext = useMemo(() => ({
    currentSymbol,
    currentPrice: quote?.current || 0,
    priceChange: quote?.change || 0,
    percentChange: quote?.percentChange || 0,
    indicators,
    priceHistory: history,
    dataMode,
    historicalDateRange: dataMode === "historical" ? {
      startDate: historicalStartDate,
      endDate: historicalEndDate,
    } : undefined,
    usefulSources,
  }), [currentSymbol, quote, indicators, history, dataMode, historicalStartDate, historicalEndDate, usefulSources]);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        py: { xs: 3, md: 6 },
        px: { xs: 2, md: 6 },
        backgroundImage: ({ palette }) =>
          `radial-gradient(circle at top, ${alpha(palette.primary.main, 0.22)}, transparent 55%)`,
      }}
    >
      <Stack spacing={1} mb={4}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Sparkles size={32} strokeWidth={2} style={{ color: '#1976d2' }} />
          <Typography variant="h4">Finday Trading Desk</Typography>
        </Stack>
        <Typography variant="subtitle1">
          Explore real-time market data, trending equities, and build your next trading idea.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Tip:</strong> For stocks, use ticker symbols like AAPL, GOOGL, or TSLA. For crypto, use the format EXCHANGE:PAIR (e.g., BINANCE:BTCUSDT, COINBASE:BTCUSD).
        </Typography>
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Data Source
                </Typography>
                <ToggleButtonGroup
                  value={dataMode}
                  exclusive
                  onChange={handleDataModeChange}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="realtime" aria-label="realtime data">
                    <ShowChart sx={{ mr: 1 }} fontSize="small" />
                    Realtime
                  </ToggleButton>
                  <ToggleButton value="historical" aria-label="historical data">
                    <CalendarToday sx={{ mr: 1 }} fontSize="small" />
                    Historical
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {dataMode === "historical" && (
                <>
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    value={historicalStartDate}
                    onChange={(e) => setHistoricalStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 160 }}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    value={historicalEndDate}
                    onChange={(e) => setHistoricalEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 160 }}
                  />
                  <Button
                    variant="contained"
                    onClick={fetchHistoricalData}
                    disabled={isLoadingHistorical}
                    startIcon={isLoadingHistorical ? <CircularProgress size={16} /> : <Search />}
                  >
                    {isLoadingHistorical ? "Loading..." : "Fetch Data"}
                  </Button>
                </>
              )}
            </Stack>

            {dataMode === "realtime" && (
              <Alert 
                severity={isStreaming ? "success" : "warning"}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    variant="outlined"
                    onClick={toggleStreaming}
                    disabled={isLoading}
                    startIcon={isStreaming ? <Stop /> : <PlayArrow />}
                  >
                    {isStreaming ? "Stop Streaming" : "Start Streaming"}
                  </Button>
                }
              >
                <Typography variant="body2">
                  <strong>WebSocket Status:</strong> {isStreaming ? "Connected - Receiving real-time data (symbol changes will auto-switch subscription)" : "Disconnected - Click 'Start Streaming' to receive live updates"}
                </Typography>
              </Alert>
            )}

            {dataMode === "historical" && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Historical Mode:</strong> Viewing historical data from Yahoo Finance. Select a date range and click "Fetch Data" to load historical prices. Technical indicators and the trading agent will analyze this historical data.
                </Typography>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack spacing={3}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {currentSymbol}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      transition: "all 0.2s ease-out",
                      backgroundColor: priceFlash === "up" 
                        ? "rgba(46, 125, 50, 0.35)" 
                        : priceFlash === "down" 
                        ? "rgba(211, 47, 47, 0.35)" 
                        : "transparent",
                      boxShadow: priceFlash === "up"
                        ? "0 0 12px rgba(46, 125, 50, 0.4)"
                        : priceFlash === "down"
                        ? "0 0 12px rgba(211, 47, 47, 0.4)"
                        : "none",
                    }}
                  >
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 600,
                      }}
                    >
                      {quote ? quote.current.toFixed(2) : "--"}
                    </Typography>
                  </Box>
                  {quote && (
                    <Chip
                      color={quote.change >= 0 ? "success" : "error"}
                      icon={<ChangeIcon fontSize="small" />}
                      label={`${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)} (${quote.percentChange.toFixed(2)}%)`}
                    />
                  )}
                </Stack>
              </Box>

              <Box component="form" onSubmit={handleCustomSymbolSubmit}>
                <TextField
                  size="small"
                  placeholder="Enter symbol (e.g., GOOGL, BINANCE:BTCUSDT)"
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value)}
                  sx={{ minWidth: { xs: "100%", sm: 300 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          type="submit"
                          size="small"
                          variant="contained"
                          sx={{ minWidth: "auto" }}
                        >
                          <Search />
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                Quick Select - Stocks
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={DEFAULT_SYMBOLS.includes(selectedSymbol) ? selectedSymbol : null}
                size="small"
                onChange={handleSymbolChange}
                aria-label="Select stock symbol"
                sx={{ flexWrap: "wrap" }}
              >
                {DEFAULT_SYMBOLS.map((ticker) => (
                  <ToggleButton key={ticker} value={ticker} aria-label={ticker}>
                    {ticker}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                Quick Select - Crypto
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={CRYPTO_SYMBOLS.includes(selectedSymbol) ? selectedSymbol : null}
                size="small"
                onChange={handleSymbolChange}
                aria-label="Select crypto symbol"
                sx={{ flexWrap: "wrap" }}
              >
                {CRYPTO_SYMBOLS.map((ticker) => (
                  <ToggleButton key={ticker} value={ticker} aria-label={ticker}>
                    {ticker.split(":")[1] || ticker}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>

            <Divider />

            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Metric label="Daily high" value={quote?.high} prefix="$" icon={<ArrowUpCircle size={18} />} />
              <Metric label="Daily low" value={quote?.low} prefix="$" icon={<ArrowDownCircle size={18} />} />
              <Metric label="Open" value={quote?.open} prefix="$" icon={<Target size={18} />} />
              <Metric label="Prev Close" value={quote?.previousClose} prefix="$" icon={<Activity size={18} />} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3} columns={{ xs: 1, md: 12 }}>
        <Grid size={{ xs: 1, md: 8 }}>
          <Stack spacing={3}>
            <Card sx={{ height: { xs: 320, md: 520 }, display: "flex", flexDirection: "column" }}>
              <CardHeader
                title={
                  <Typography variant="subtitle1">
                    {dataMode === "realtime" ? "Live price action" : "Historical price action"}
                  </Typography>
                }
                subheader={
                  dataMode === "historical" && historicalData.history.length > 0
                    ? `${historicalStartDate} to ${historicalEndDate} (${historicalData.history.length} data points)`
                    : undefined
                }
              />
              <CardContent sx={{ flexGrow: 1, minHeight: 0 }}>
                <LightweightChart
                  symbol={currentSymbol}
                  data={history}
                  isLoading={isLoading}
                  error={error}
                  indicators={indicatorSeries}
                />
              </CardContent>
            </Card>

            <Box sx={{ height: { xs: 400, md: 500 } }}>
              <TradingAgentChat 
                context={agentContext} 
                setIndicators={setIndicators}
                addUsefulSource={handleAddUsefulSource}
              />
            </Box>
          </Stack>
        </Grid>
        <Grid size={{ xs: 1, md: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ height: { xs: 240, md: 240 } }}>
              <CardHeader
                title={<Typography variant="subtitle1">Session snapshot</Typography>}
                subheader={quote ? new Date(quote.timestamp).toLocaleTimeString() : ""}
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <MiniMetric label="Price direction" value={changeLabel} color={changeColor} />
                  <MiniMetric label="Change" value={quote ? `${quote.change.toFixed(2)} USD` : "--"} />
                  <MiniMetric label="Prev close" value={quote ? `${quote.previousClose.toFixed(2)} USD` : "--"} />
                  <MiniMetric label="Open" value={quote ? `${quote.open.toFixed(2)} USD` : "--"} />
                  <MiniMetric label="Daily range" value={quote ? `${quote.low.toFixed(2)} – ${quote.high.toFixed(2)} USD` : "--"} />
                </Stack>
              </CardContent>
            </Card>
            
            <IndicatorControls
              indicators={indicators}
              onAddIndicator={handleAddIndicator}
              onRemoveIndicator={handleRemoveIndicator}
              onToggleIndicator={handleToggleIndicator}
              onUpdateIndicator={handleUpdateIndicator}
            />

            <Box sx={{ height: { xs: 400, md: 500 } }}>
              <UsefulSources 
                sources={usefulSources}
                onRemoveSource={handleRemoveUsefulSource}
              />
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

interface MetricProps {
  label: string;
  value?: number;
  prefix?: string;
  icon?: React.ReactNode;
}

function Metric({ label, value, prefix = "", icon }: MetricProps) {
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        {icon && <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>{icon}</Box>}
        <Typography variant="body2" sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {value !== undefined ? `${prefix}${value.toFixed(2)}` : "--"}
      </Typography>
    </Stack>
  );
}

interface MiniMetricProps {
  label: string;
  value: string;
  color?: string;
}

function MiniMetric({ label, value, color }: MiniMetricProps) {
  return (
    <Stack spacing={0.4}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color }}>
        {value}
      </Typography>
    </Stack>
  );
}
