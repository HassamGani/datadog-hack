/**
 * API route for Linkup web search functionality
 */

import { NextRequest, NextResponse } from "next/server";
import { searchWeb } from "@/lib/mcp/linkup-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, depth = "standard" } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Perform the search
    const results = await searchWeb(query, depth);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in Linkup API route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search web" },
      { status: 500 }
    );
  }
}

