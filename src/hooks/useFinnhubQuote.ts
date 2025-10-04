import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FinnhubQuote, StreamingPoint } from "@/lib/types";

interface UseFinnhubQuoteOptions {
  symbol: string;
}

interface UseFinnhubQuoteResult {
  quote: FinnhubQuote | null;
  history: StreamingPoint[];
  isLoading: boolean;
  error: string | null;
  isStreaming: boolean;
  setSymbol: (symbol: string) => void;
  toggleStreaming: () => void;
}

interface FinnhubWebSocketTrade {
  data: Array<{
    p: number; // Price
    s: string; // Symbol
    t: number; // Timestamp (ms)
    v: number; // Volume
  }>;
  type: string;
}

export function useFinnhubQuote(
  options: UseFinnhubQuoteOptions
): UseFinnhubQuoteResult {
  const { symbol: initialSymbol } = options;
  const [symbol, setSymbol] = useState(initialSymbol);
  const [quote, setQuote] = useState<FinnhubQuote | null>(null);
  const [history, setHistory] = useState<StreamingPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const currentSymbolRef = useRef<string>(symbol);
  const dailyStatsRef = useRef<{
    open: number | null;
    high: number | null;
    low: number | null;
    previousClose: number | null;
  }>({ open: null, high: null, low: null, previousClose: null });
  const lastPriceRef = useRef<number | null>(null);

  // Fetch initial quote data to get daily stats (optional - used for accurate daily stats)
  const fetchInitialQuote = useCallback(async (nextSymbol: string) => {
    try {
      const response = await fetch(
        `/api/finnhub?symbol=${encodeURIComponent(nextSymbol)}`,
        { 
          cache: "no-store",
          signal: AbortSignal.timeout(3000) // 3 second timeout
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("Rate limit hit - relying on WebSocket data only");
          return;
        }
        throw new Error(`Failed to fetch initial quote: ${response.status}`);
      }

      const data = (await response.json()) as FinnhubQuote;
      
      // Store daily stats
      dailyStatsRef.current = {
        open: data.open,
        high: data.high,
        low: data.low,
        previousClose: data.previousClose,
      };

      setQuote(data);
      console.log(`Loaded initial quote for ${nextSymbol}:`, data);
    } catch (err) {
      // Don't show error to user - WebSocket will provide real-time data
      console.warn("Could not fetch initial quote (will use WebSocket data):", err);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    // Don't create a new connection if one already exists
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    
    if (!apiKey) {
      setError("Finnhub API key is not configured");
      setIsLoading(false);
      return;
    }

    console.log(`Connecting to Finnhub WebSocket...`);
    setIsLoading(true);
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);
    wsRef.current = ws;

    ws.addEventListener('open', () => {
      console.log(`WebSocket connected, subscribing to ${currentSymbolRef.current}`);
      setError(null);
      ws.send(JSON.stringify({ type: 'subscribe', symbol: currentSymbolRef.current }));
      setIsLoading(false);
      setIsStreaming(true);
    });

    ws.addEventListener('message', (event) => {
      try {
        const message: FinnhubWebSocketTrade = JSON.parse(event.data);
        
        if (message.type === "trade" && message.data && message.data.length > 0) {
          // Process the latest trade
          const latestTrade = message.data[message.data.length - 1];
          const tradeSymbol = latestTrade.s;
          const price = latestTrade.p;
          const timestamp = latestTrade.t;

          // Only process trades for the current symbol
          if (tradeSymbol !== currentSymbolRef.current) {
            return;
          }

          // Always update high/low immediately
          const stats = dailyStatsRef.current;
          const currentHigh = Math.max(stats.high ?? price, price);
          const currentLow = Math.min(stats.low ?? price, price);
          dailyStatsRef.current.high = currentHigh;
          dailyStatsRef.current.low = currentLow;

          // Only update quote if price changed by more than 1 cent
          const lastPrice = lastPriceRef.current;
          if (lastPrice === null || Math.abs(price - lastPrice) >= 0.01) {
            lastPriceRef.current = price;
            
            // Update quote with latest price and calculated stats
            setQuote((prevQuote) => {
              const previousClose = stats.previousClose ?? price;
              const change = price - previousClose;
              const percentChange = previousClose !== 0 ? (change / previousClose) * 100 : 0;

              return {
                symbol: tradeSymbol,
                current: price,
                change,
                percentChange,
                high: currentHigh,
                low: currentLow,
                open: stats.open ?? price,
                previousClose,
                timestamp,
              };
            });

            // Add to history
            setHistory((prev) => {
              const newTime = Math.floor(timestamp / 1000);
              const lastPoint = prev[prev.length - 1];
              
              // Skip if timestamp is not newer than the last point
              if (lastPoint && newTime <= lastPoint.time) {
                return prev;
              }
              
              // Skip if the value hasn't changed significantly
              if (lastPoint && Math.abs(price - lastPoint.value) < 0.01) {
                return prev;
              }
              
              const newPoint: StreamingPoint = { time: newTime, value: price };
              const next: StreamingPoint[] = [...prev, newPoint];
              
              // Keep last hour of data
              const cutoff = Math.floor(Date.now() / 1000) - 60 * 60;
              return next.filter((point) => point.time >= cutoff);
            });
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    });

    ws.addEventListener('error', (event) => {
      console.error("WebSocket error:", event);
      setError("WebSocket connection error");
      setIsLoading(false);
      setIsStreaming(false);
    });

    ws.addEventListener('close', (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      setIsStreaming(false);
      setIsLoading(false);
      // Don't attempt to reconnect - user controls connection
    });
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      console.log("Manually closing WebSocket connection");
      // Unsubscribe from current symbol
      if (wsRef.current.readyState === WebSocket.OPEN && currentSymbolRef.current) {
        wsRef.current.send(
          JSON.stringify({ type: "unsubscribe", symbol: currentSymbolRef.current })
        );
      }
      wsRef.current.close(1000, "User closed connection"); // 1000 = normal closure
      wsRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const subscribeToSymbol = useCallback((symbolToSubscribe: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`Subscribing to ${symbolToSubscribe}`);
      wsRef.current.send(JSON.stringify({ type: 'subscribe', symbol: symbolToSubscribe }));
      currentSymbolRef.current = symbolToSubscribe;
    }
  }, []);

  const unsubscribeFromSymbol = useCallback((symbolToUnsubscribe: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`Unsubscribing from ${symbolToUnsubscribe}`);
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', symbol: symbolToUnsubscribe }));
    }
  }, []);

  const toggleStreaming = useCallback(() => {
    if (isStreaming) {
      disconnectWebSocket();
    } else {
      connectWebSocket();
      
      // Optionally fetch initial quote for accurate daily stats (non-blocking)
      fetchInitialQuote(symbol).catch(err => 
        console.warn("Could not load initial quote (using WebSocket only):", err)
      );
    }
  }, [isStreaming, symbol, disconnectWebSocket, connectWebSocket, fetchInitialQuote]);

  // Effect to handle symbol changes - switch subscription if streaming
  useEffect(() => {
    const previousSymbol = currentSymbolRef.current;
    
    // If streaming and symbol changed, switch subscriptions
    if (isStreaming && previousSymbol !== symbol && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log(`Switching from ${previousSymbol} to ${symbol}`);
      unsubscribeFromSymbol(previousSymbol);
      subscribeToSymbol(symbol);
      
      // Reset daily stats for new symbol
      dailyStatsRef.current = {
        open: null,
        high: null,
        low: null,
        previousClose: null,
      };
      
      // Reset last price to allow immediate update for new symbol
      lastPriceRef.current = null;
      
      // Optionally fetch initial quote for new symbol
      fetchInitialQuote(symbol).catch(err => 
        console.warn("Could not load initial quote for new symbol:", err)
      );
    } else {
      // Just update the ref if not streaming
      currentSymbolRef.current = symbol;
    }
    
    setError(null);
    setHistory([]); // Clear history when symbol changes
  }, [symbol, isStreaming, unsubscribeFromSymbol, subscribeToSymbol, fetchInitialQuote]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({ type: "unsubscribe", symbol: currentSymbolRef.current })
          );
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const result = useMemo<UseFinnhubQuoteResult>(
    () => ({ quote, history, isLoading, error, isStreaming, setSymbol, toggleStreaming }),
    [quote, history, isLoading, error, isStreaming, toggleStreaming]
  );

  return result;
}

