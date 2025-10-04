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
    const apiKey = process.env.NEXT_PUBLIC_LINKUP_API_KEY;
    
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_LINKUP_API_KEY is not set");
    }

    linkupClient = new LinkupClient({ apiKey });
    console.log("Linkup SDK client initialized successfully");
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
      return response.results.map((result: any) => ({
        title: result.name || result.title || "Untitled",
        url: result.url || "",
        snippet: result.content || result.snippet || "",
      }));
    }

    return [];
  } catch (error) {
    console.error("Error searching web with Linkup:", error);
    throw error;
  }
}

