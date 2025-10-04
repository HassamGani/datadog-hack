"use client";

import { useEffect, useRef } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { createChart, ISeriesApi, LineStyle, Time, AreaSeries } from "lightweight-charts";
import type { StreamingPoint } from "@/lib/types";

interface LightweightChartProps {
  symbol: string;
  data: StreamingPoint[];
  isLoading: boolean;
  error: string | null;
}

export default function LightweightChart({
  symbol,
  data,
  isLoading,
  error,
}: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing chart if symbol changes
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#cbd5f5",
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        mode: 0,
      },
      grid: {
        vertLines: {
          color: "rgba(148, 163, 184, 0.2)",
          style: LineStyle.Dotted,
        },
        horzLines: {
          color: "rgba(148, 163, 184, 0.2)",
          style: LineStyle.Dotted,
        },
      },
      autoSize: true,
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#5b8def",
      topColor: "rgba(91, 141, 239, 0.4)",
      bottomColor: "rgba(91, 141, 239, 0.05)",
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ autoSize: true });
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol]);

  useEffect(() => {
    if (!seriesRef.current) return;

    if (!data?.length) {
      seriesRef.current.setData([]);
      return;
    }

    const formatted = data.map(({ time, value }) => ({
      time: time as Time,
      value,
    }));

    seriesRef.current.setData(formatted);
    
    // Auto-fit the chart to show all data
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  if (error) {
    return (
      <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
        <Typography color="error.main">{error}</Typography>
        <Typography variant="body2" color="text.secondary">
          Try again later or check your Finnhub API key configuration.
        </Typography>
      </Stack>
    );
  }

  if (isLoading && data.length === 0) {
    return (
      <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
        <Typography color="text.secondary">Loading {symbol} data…</Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <Box ref={containerRef} sx={{ width: "100%", height: "100%" }} />
      {data.length === 0 && !isLoading && !error && (
        <Stack
          spacing={1}
          alignItems="center"
          justifyContent="center"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
          }}
        >
          <Typography color="text.secondary" variant="body2">
            Collecting data for {symbol}...
          </Typography>
          <Typography color="text.secondary" variant="caption">
            Chart will appear once data is available
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

