import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date parameters are required" },
        { status: 400 }
      );
    }

    // Parse dates
    const period1 = new Date(startDate);
    const period2 = new Date(endDate);

    // Validate dates
    if (isNaN(period1.getTime()) || isNaN(period2.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (period1 >= period2) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Convert crypto symbols if needed (BINANCE:BTCUSDT -> BTC-USD)
    let yahooSymbol = symbol;
    if (symbol.includes(":")) {
      const [exchange, pair] = symbol.split(":");
      // Try to convert to Yahoo format (e.g., BTCUSDT -> BTC-USD)
      if (pair.endsWith("USDT")) {
        yahooSymbol = `${pair.slice(0, -4)}-USD`;
      } else if (pair.endsWith("USD")) {
        yahooSymbol = `${pair.slice(0, -3)}-USD`;
      }
    }

    // Fetch historical data from Yahoo Finance
    const result = await yahooFinance.historical(yahooSymbol, {
      period1,
      period2,
      interval: "1d", // Daily data
    });

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: `No historical data found for symbol: ${symbol}` },
        { status: 404 }
      );
    }

    // Transform data to match our format (StreamingPoint)
    const historicalData = result.map((item) => ({
      time: Math.floor(new Date(item.date).getTime() / 1000),
      value: item.close,
    }));

    // Calculate statistics for quote-like data
    const latestItem = result[result.length - 1];
    const previousItem = result[result.length - 2] || latestItem;
    const change = latestItem.close - previousItem.close;
    const percentChange = (change / previousItem.close) * 100;

    const quote = {
      symbol: yahooSymbol,
      current: latestItem.close,
      change,
      percentChange,
      high: latestItem.high,
      low: latestItem.low,
      open: latestItem.open,
      previousClose: previousItem.close,
      timestamp: new Date(latestItem.date).getTime(),
    };

    return NextResponse.json({
      quote,
      history: historicalData,
    });
  } catch (error) {
    console.error("Error fetching historical data from Yahoo Finance:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch historical data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}


