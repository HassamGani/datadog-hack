/**
 * Linkup SDK Client for web search functionality
 */

import { LinkupClient } from "linkup-sdk";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

let linkupClient: LinkupClient | null = null;

/**
 * Get or initialize the Linkup client
 */
function getLinkupClient(): LinkupClient {
  if (!linkupClient) {
    // Use server-side env var (without NEXT_PUBLIC prefix)
    const apiKey = process.env.LINKUP_API_KEY || process.env.NEXT_PUBLIC_LINKUP_API_KEY;
    
    if (!apiKey) {
      throw new Error("LINKUP_API_KEY is not configured. Please add it to your .env.local file to enable web search.");
    }

    linkupClient = new LinkupClient({ apiKey });
    console.log("✅ Linkup SDK client initialized successfully");
  }

  return linkupClient;
}

/**
 * Search the web using Linkup SDK
 */
export async function searchWeb(
  query: string,
  depth: "standard" | "deep" = "standard"
): Promise<SearchResult[]> {
  try {
    const client = getLinkupClient();

    // Perform the search using Linkup SDK
    const response = await client.search({
      query,
      depth,
      outputType: "searchResults",
    });

    // Transform results into our SearchResult format
    if (response.results && Array.isArray(response.results)) {
      return response.results
        .filter((result: any) => result && (result.name || result.title) && result.url) // Filter out invalid results
        .map((result: any) => ({
          title: (result.name || result.title || "Untitled").trim(),
          url: (result.url || "").trim(),
          snippet: (result.content || result.snippet || "No description available").trim().substring(0, 500), // Limit snippet length
        }));
    }

    return [];
  } catch (error) {
    console.error("❌ Error searching web with Linkup:", error);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("API key") || error.message.includes("LINKUP_API_KEY")) {
        throw new Error("Linkup API key is not configured. Add LINKUP_API_KEY to .env.local to enable web search.");
      }
      throw new Error(`Web search failed: ${error.message}`);
    }
    
    throw new Error("Failed to search web. Please try again later.");
  }
}

