/**
 * Trading AI Agent for financial data analysis and indicator management
 */

import OpenAI from "openai";
import type { IndicatorConfig, IndicatorType } from "@/lib/indicators/types";
import { INDICATOR_DEFAULTS, INDICATOR_DESCRIPTIONS } from "@/lib/indicators/types";

const client = new OpenAI({apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true});

// Define the tools available to the agent
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "add_indicator",
      description: "Add a technical indicator to the live chart. Use this when the user wants to analyze the chart with a specific indicator like SMA, EMA, RSI, MACD, Bollinger Bands, etc.",
      parameters: {
        type: "object",
        properties: {
          indicator_type: {
            type: "string",
            enum: ["sma", "ema", "rsi", "bollinger", "macd", "vwap", "atr", "stochastic"],
            description: "The type of technical indicator to add",
          },
          period: {
            type: "number",
            description: "The period/lookback window for the indicator (e.g., 20 for SMA-20, 14 for RSI-14)",
          },
          fast_period: {
            type: "number",
            description: "Fast period for MACD (default: 12)",
          },
          slow_period: {
            type: "number",
            description: "Slow period for MACD (default: 26)",
          },
          signal_period: {
            type: "number",
            description: "Signal period for MACD (default: 9)",
          },
          std_dev: {
            type: "number",
            description: "Standard deviation multiplier for Bollinger Bands (default: 2)",
          },
        },
        required: ["indicator_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_indicator",
      description: "Remove a technical indicator from the live chart by its name or type",
      parameters: {
        type: "object",
        properties: {
          indicator_name: {
            type: "string",
            description: "The name or type of the indicator to remove (e.g., 'SMA', 'RSI', 'MACD')",
          },
        },
        required: ["indicator_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_indicators",
      description: "List all currently active indicators on the chart",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "modify_indicator",
      description: "Modify the parameters of an existing indicator",
      parameters: {
        type: "object",
        properties: {
          indicator_name: {
            type: "string",
            description: "The name or type of the indicator to modify",
          },
          new_period: {
            type: "number",
            description: "New period value for the indicator",
          },
        },
        required: ["indicator_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_market_data",
      description: "Get current market data including price, change, volume, and technical levels",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_chart",
      description: "Analyze the current chart with all active indicators and provide insights",
      parameters: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            description: "Specific aspect to focus on (e.g., 'trend', 'momentum', 'volatility', 'support_resistance')",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for information about trading, technical analysis, market news, or any financial topic. Returns a list of relevant websites with titles, URLs, and snippets.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant websites (e.g., 'technical analysis RSI indicator', 'latest market news', 'trading strategies')",
          },
          depth: {
            type: "string",
            enum: ["standard", "deep"],
            description: "Search depth - 'standard' for quick results, 'deep' for comprehensive search (default: 'standard')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_useful_source",
      description: "Add a useful website or resource to the 'Useful Sources' panel for later reference. Use this after searching the web to save helpful links.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the website or resource",
          },
          url: {
            type: "string",
            description: "The full URL of the website",
          },
          snippet: {
            type: "string",
            description: "A brief description or snippet about what this source contains",
          },
        },
        required: ["title", "url", "snippet"],
      },
    },
  },
];

export interface UsefulSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  addedAt: number;
}

export interface TradingAgentContext {
  currentSymbol: string;
  currentPrice: number;
  priceChange: number;
  percentChange: number;
  indicators: IndicatorConfig[];
  priceHistory: Array<{ time: number; value: number }>;
  dataMode?: "realtime" | "historical";
  historicalDateRange?: {
    startDate: string;
    endDate: string;
  };
  usefulSources?: UsefulSource[];
}

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentResponse {
  message: string;
  toolCalls?: Array<{
    function: string;
    arguments: any;
  }>;
}

export async function callTradingAgent(
  messages: AgentMessage[],
  context: TradingAgentContext
): Promise<AgentResponse> {
  try {
    // Check if API key is configured
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to your .env.local file.");
    }

    // Build system message with current context
    const dataModeSuffix = context.dataMode === "historical" && context.historicalDateRange
      ? `\n- Data Mode: Historical (${context.historicalDateRange.startDate} to ${context.historicalDateRange.endDate})`
      : '\n- Data Mode: Real-time (Live streaming data)';

    const systemMessage: OpenAI.Chat.Completions.ChatCompletionSystemMessageParam = {
      role: "system",
      content: `You are an expert day trading assistant specializing in technical analysis. You help traders analyze financial charts and manage technical indicators.

Current Context:
- Symbol: ${context.currentSymbol}
- Current Price: $${context.currentPrice.toFixed(2)}
- Change: ${context.priceChange >= 0 ? '+' : ''}${context.priceChange.toFixed(2)} (${context.percentChange.toFixed(2)}%)
- Active Indicators: ${context.indicators.length > 0 ? context.indicators.map(i => `${i.name} (${Object.entries(i.params).map(([k, v]) => `${k}:${v}`).join(', ')})`).join(', ') : 'None'}
- Price Data Points: ${context.priceHistory.length}${dataModeSuffix}

Available Indicators:
${Object.entries(INDICATOR_DESCRIPTIONS).map(([type, desc]) => `- ${INDICATOR_DEFAULTS[type as IndicatorType].name}: ${desc}`).join('\n')}

Your capabilities:
1. Add, remove, or modify technical indicators on the chart using available tools
2. Analyze market trends, momentum, volatility, and support/resistance levels
3. Provide trading insights based on technical indicators
4. Answer questions about technical analysis and indicators
5. Explain indicator readings and their implications
6. Search the web for trading resources, market news, and educational content
7. Save useful sources to the "Useful Sources" panel for later reference

IMPORTANT INSTRUCTIONS:
- When asked to add/remove/modify indicators, use the appropriate tool functions
- After using tools, you will be shown the results and asked to summarize - wait for that
- For questions and analysis requests, respond conversationally without using tools
- Be friendly, concise, and helpful in your responses
- Provide actionable insights when analyzing the market`,
    };

    // Convert messages to OpenAI format
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      systemMessage,
      ...messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
    ];

    // Call OpenAI with function calling using chat.completions.create
    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: chatMessages,
      tools: tools,
      tool_choice: "auto",
      max_completion_tokens: 64000,
    });

    const choice = response.choices[0];
    const message = choice.message;

    // Check if there are tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCalls = message.tool_calls.map((tc) => {
        if (tc.type === 'function') {
          return {
            function: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          };
        }
        return null;
      }).filter((tc): tc is { function: string; arguments: any } => tc !== null);

      return {
        message: message.content || "Processing your request...",
        toolCalls,
      };
    }

    return {
      message: message.content || "I'm ready to help you analyze the market and manage indicators.",
    };
  } catch (error) {
    console.error("Error calling trading agent:", error);
    throw new Error(`Failed to get response from trading agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to execute tool calls
export function executeTool(
  toolName: string,
  args: any,
  context: TradingAgentContext,
  setIndicators: (indicators: IndicatorConfig[]) => void,
  addUsefulSource?: (source: UsefulSource) => void
): string {
  switch (toolName) {
    case "add_indicator": {
      const { indicator_type, period, fast_period, slow_period, signal_period, std_dev } = args;
      const defaults = INDICATOR_DEFAULTS[indicator_type as IndicatorType];
      
      const params: any = { ...defaults.params };
      if (period !== undefined) params.period = period;
      if (fast_period !== undefined) params.fastPeriod = fast_period;
      if (slow_period !== undefined) params.slowPeriod = slow_period;
      if (signal_period !== undefined) params.signalPeriod = signal_period;
      if (std_dev !== undefined) params.stdDev = std_dev;

      const newIndicator: IndicatorConfig = {
        id: `${indicator_type}_${Date.now()}`,
        type: indicator_type,
        name: defaults.name,
        params,
        color: defaults.color,
        visible: true,
      };

      setIndicators([...context.indicators, newIndicator]);
      return `Added ${defaults.name} indicator with parameters: ${JSON.stringify(params)}`;
    }

    case "remove_indicator": {
      const { indicator_name } = args;
      const normalizedName = indicator_name.toLowerCase();
      const filtered = context.indicators.filter(
        (ind) =>
          !ind.name.toLowerCase().includes(normalizedName) &&
          !ind.type.toLowerCase().includes(normalizedName)
      );

      if (filtered.length === context.indicators.length) {
        return `No indicator found matching "${indicator_name}"`;
      }

      setIndicators(filtered);
      return `Removed ${context.indicators.length - filtered.length} indicator(s) matching "${indicator_name}"`;
    }

    case "list_indicators": {
      if (context.indicators.length === 0) {
        return "No indicators are currently active on the chart.";
      }
      return `Active indicators:\n${context.indicators.map((ind, i) => 
        `${i + 1}. ${ind.name} - Parameters: ${JSON.stringify(ind.params)} - Visible: ${ind.visible}`
      ).join('\n')}`;
    }

    case "modify_indicator": {
      const { indicator_name, new_period } = args;
      const normalizedName = indicator_name.toLowerCase();
      let modified = false;

      const updated = context.indicators.map((ind) => {
        if (ind.name.toLowerCase().includes(normalizedName) || ind.type.toLowerCase().includes(normalizedName)) {
          modified = true;
          return {
            ...ind,
            params: { ...ind.params, period: new_period },
          };
        }
        return ind;
      });

      if (!modified) {
        return `No indicator found matching "${indicator_name}"`;
      }

      setIndicators(updated);
      return `Modified ${indicator_name} to use period ${new_period}`;
    }

    case "get_market_data": {
      return `Current Market Data for ${context.currentSymbol}:
- Price: $${context.currentPrice.toFixed(2)}
- Change: ${context.priceChange >= 0 ? '+' : ''}$${context.priceChange.toFixed(2)} (${context.percentChange.toFixed(2)}%)
- Data Points: ${context.priceHistory.length} price points available
- Time Range: ${context.priceHistory.length > 0 ? `Last ${Math.round((Date.now() / 1000 - context.priceHistory[0].time) / 60)} minutes` : 'N/A'}`;
    }

    case "analyze_chart": {
      const { focus } = args;
      let analysis = `Chart Analysis for ${context.currentSymbol}:\n\n`;
      
      analysis += `Price Action: Currently trading at $${context.currentPrice.toFixed(2)}, ${context.priceChange >= 0 ? 'up' : 'down'} ${Math.abs(context.percentChange).toFixed(2)}%\n\n`;
      
      if (context.indicators.length > 0) {
        analysis += `Active Indicators (${context.indicators.length}):\n`;
        context.indicators.forEach((ind) => {
          analysis += `- ${ind.name}: ${JSON.stringify(ind.params)}\n`;
        });
      } else {
        analysis += "No technical indicators are currently active. Consider adding indicators like SMA, RSI, or MACD for better analysis.\n";
      }

      if (focus) {
        analysis += `\nFocus: ${focus}\n`;
      }

      return analysis;
    }

    case "search_web": {
      // This will be executed asynchronously by the chat component
      return `Searching the web for: "${args.query}"...`;
    }

    case "add_useful_source": {
      const { title, url, snippet } = args;
      
      // Validate inputs
      if (!title || !url || !snippet) {
        return "Error: Missing required fields (title, url, or snippet) for adding source";
      }

      if (!addUsefulSource) {
        return "Unable to add source - functionality not available in current context";
      }

      try {
        const newSource: UsefulSource = {
          id: `source_${Date.now()}`,
          title: String(title).trim(),
          url: String(url).trim(),
          snippet: String(snippet).trim(),
          addedAt: Date.now(),
        };

        addUsefulSource(newSource);
        return `✅ Successfully added "${title}" to Useful Sources panel`;
      } catch (error) {
        console.error("Error adding useful source:", error);
        return `Failed to add source: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

