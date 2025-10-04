import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FinnhubQuote, StreamingPoint } from "@/lib/types";

const DEFAULT_INTERVAL_MS = 1000;

interface UseFinnhubQuoteOptions {
  symbol: string;
  intervalMs?: number;
}

interface UseFinnhubQuoteResult {
  quote: FinnhubQuote | null;
  history: StreamingPoint[];
  isLoading: boolean;
  error: string | null;
  setSymbol: (symbol: string) => void;
}

export function useFinnhubQuote(
  options: UseFinnhubQuoteOptions
): UseFinnhubQuoteResult {
  const { symbol: initialSymbol, intervalMs = DEFAULT_INTERVAL_MS } = options;
  const [symbol, setSymbol] = useState(initialSymbol);
  const [quote, setQuote] = useState<FinnhubQuote | null>(null);
  const [history, setHistory] = useState<StreamingPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchQuote = useCallback(
    async (nextSymbol: string) => {
      if (!nextSymbol) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setError(null);

      try {
        const response = await fetch(
          `/api/finnhub?symbol=${encodeURIComponent(nextSymbol)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "Failed to fetch quote");
        }

        const data = (await response.json()) as FinnhubQuote;

        setQuote(data);
        setHistory((prev) => {
          const next: StreamingPoint[] = [
            ...prev,
            { time: Math.floor(data.timestamp / 1000), value: data.current },
          ];
          const cutoff = Math.floor(Date.now() / 1000) - 60 * 60;
          return next.filter((point) => point.time >= cutoff);
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message ?? "Unexpected error");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    setIsLoading(true);
    setHistory([]); // Clear history when symbol changes

    fetchQuote(symbol);

    intervalId = setInterval(() => fetchQuote(symbol), intervalMs);

    return () => {
      if (intervalId) clearInterval(intervalId);
      abortControllerRef.current?.abort();
    };
  }, [symbol, intervalMs, fetchQuote]);

  const result = useMemo<UseFinnhubQuoteResult>(
    () => ({ quote, history, isLoading, error, setSymbol }),
    [quote, history, isLoading, error]
  );

  return result;
}

