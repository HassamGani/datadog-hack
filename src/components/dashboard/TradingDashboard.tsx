"use client";

import { useMemo, useState } from "react";
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
} from "@mui/material";
import { TrendingUp, TrendingDown, Search } from "@mui/icons-material";
import dynamic from "next/dynamic";
import { useFinnhubQuote } from "@/hooks/useFinnhubQuote";

const LightweightChart = dynamic(() => import("@/components/trading/LightweightChart"), {
  ssr: false,
});

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "TSLA", "NVDA", "META", "AMZN"];
const CRYPTO_SYMBOLS = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "BINANCE:SOLUSDT"];

export default function TradingDashboard() {
  const [customSymbol, setCustomSymbol] = useState("");
  const { quote, history, isLoading, error, setSymbol } =
    useFinnhubQuote({ symbol: DEFAULT_SYMBOLS[0] });

  // Get current symbol from quote or use default
  const currentSymbol = quote?.symbol || DEFAULT_SYMBOLS[0];

  const handleSymbolChange = (_: unknown, nextSymbol: string | null) => {
    if (!nextSymbol) return;
    setSymbol(nextSymbol);
    setCustomSymbol("");
  };

  const handleCustomSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSymbol = customSymbol.trim().toUpperCase();
    if (trimmedSymbol) {
      setSymbol(trimmedSymbol);
    }
  };

  const changeColor = quote && quote.change >= 0 ? "success.main" : "error.main";
  const ChangeIcon = quote && quote.change >= 0 ? TrendingUp : TrendingDown;
  const changeLabel = useMemo(() => {
    if (!quote) return "";
    const direction = quote.change >= 0 ? "up" : "down";
    return `${direction} ${quote.percentChange.toFixed(2)}%`;
  }, [quote]);

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
        <Typography variant="h4">Finday Trading Desk</Typography>
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
                  <Typography variant="h3" sx={{ fontWeight: 600 }}>
                    {quote ? quote.current.toFixed(2) : "--"}
                  </Typography>
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
                value={DEFAULT_SYMBOLS.includes(currentSymbol) ? currentSymbol : null}
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
                value={CRYPTO_SYMBOLS.includes(currentSymbol) ? currentSymbol : null}
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
              <Metric label="Daily high" value={quote?.high} prefix="$" />
              <Metric label="Daily low" value={quote?.low} prefix="$" />
              <Metric label="Open" value={quote?.open} prefix="$" />
              <Metric label="Prev Close" value={quote?.previousClose} prefix="$" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3} columns={{ xs: 1, md: 12 }}>
        <Grid size={{ xs: 1, md: 8 }}>
          <Card sx={{ height: { xs: 320, md: 420 }, display: "flex", flexDirection: "column" }}>
            <CardHeader
              title={<Typography variant="subtitle1">Live price action</Typography>}
              subheader="Streaming data updates every second"
            />
            <CardContent sx={{ flexGrow: 1, minHeight: 0 }}>
              <LightweightChart
                symbol={currentSymbol}
                data={history}
                isLoading={isLoading}
                error={error}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 1, md: 4 }}>
          <Card sx={{ height: { xs: 320, md: 420 } }}>
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
        </Grid>

        <Grid size={{ xs: 1, md: 4 }}>
          <InsightCard
            title="Streaming data"
            description="Pricing updates every second enable faster strategy testing and alerting."
          />
        </Grid>
        <Grid size={{ xs: 1, md: 4 }}>
          <InsightCard
            title="Extend with indicators"
            description="Add moving averages, MACD, VWAP and more without changing this layout."
          />
        </Grid>
        <Grid size={{ xs: 1, md: 4 }}>
          <InsightCard
            title="Portfolio ready"
            description="Plug in watchlists, order tickets, and risk analytics modules seamlessly."
          />
        </Grid>
      </Grid>
    </Box>
  );
}

interface MetricProps {
  label: string;
  value?: number;
  prefix?: string;
}

function Metric({ label, value, prefix = "" }: MetricProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
        {label}
      </Typography>
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

interface InsightCardProps {
  title: string;
  description: string;
}

function InsightCard({ title, description }: InsightCardProps) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

