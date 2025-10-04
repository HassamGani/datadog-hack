import { NextRequest, NextResponse } from "next/server";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing symbol parameter" },
      { status: 400 }
    );
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Finnhub API key is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}`,
      {
        headers: {
          "X-Finnhub-Token": apiKey,
        },
        next: {
          revalidate: 0,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error || "Failed to fetch Finnhub data";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      symbol,
      current: data.c,
      change: data.d,
      percentChange: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Finnhub API error", error);
    return NextResponse.json(
      { error: "Unexpected error while fetching Finnhub data" },
      { status: 500 }
    );
  }
}

