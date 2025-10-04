/**
 * Agent Orchestrator
 * Coordinates LLM-based reasoning with tool invocations via OpenAI function calling
 */

import { getTrueFoundryClient } from '../services/truefoundry';
import { getClickHouseClient } from '../clickhouse/client';
import { ALL_TOOLS } from '../tools';
import { AGENT_CONFIG } from '../config';
import type {
  AnnotationRequest,
  AnnotationResponse,
  Annotation,
  ToolDefinition,
} from '../types';

const SYSTEM_PROMPT = `You are an advanced reasoning agent integrated with backend tools.
You have access to the following tool primitives (via MCP):
- get_prices
- get_structured_events
- get_raw_news
- translate_texts
- extract_structured_from_doc
- get_alt_data
- detect_inflection_points
- get_health_metrics

Your goal: answer the user's question and produce **annotations** and an **explanation**.

**Suggested reasoning workflow**:
1. Call get_prices(symbol, start, end, granularity) to get time-series data.
2. Call detect_inflection_points(symbol, start, end, sensitivity) → get candidate timestamps.
3. For each candidate timestamp t_i:
   a. Call get_structured_events(symbol, t_i - δ, t_i + δ)
   b. Call get_raw_news(symbol, t_i - δ, t_i + δ, limit=N)
   c. If any news has lang != "en", call translate_texts for those items.
   d. For news items pointing to docs (PDF/URL), call extract_structured_from_doc.
4. Optionally call get_alt_data(symbol, start, end) for supportive metrics.
5. Rank the candidate events by relevance (time proximity, severity, signal strength)
6. Compose output JSON:

{
  "annotations": [
    { "ts": <ISO8601>, "tag": <string>, "note": <string>, "source_tool": <tool name> },
    …
  ],
  "explanation": <string>
}

- note should be concise, like "Q3 EPS missed expectations" or "Regulation rumor translated from Arabic."
- explanation should narrate how these events might explain the price behavior.

**Do not hallucinate**. If no strong signals are found, respond that "no strong explanatory events found."
If a tool fails, continue with available data and note in the explanation which data was missing.

Return exactly the JSON as output (no extra commentary).`;

export class AgentOrchestrator {
  private llmClient = getTrueFoundryClient();
  private clickhouse = getClickHouseClient();
  private toolMap: Map<string, ToolDefinition>;

  constructor() {
    this.toolMap = new Map(ALL_TOOLS.map((tool) => [tool.name, tool]));
  }

  /**
   * Main entry point: process an annotation request
   */
  async annotate(request: AnnotationRequest): Promise<AnnotationResponse> {
    const { symbol, start, end, question } = request;

    const userMessage = `Symbol: ${symbol}
Time Range: ${start} to ${end}
Question: ${question}

Please analyze this situation and provide annotations.`;

    // Convert tools to OpenAI function format
    const tools = ALL_TOOLS.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));

    let messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ];

    let iterations = 0;
    const maxIterations = AGENT_CONFIG.maxToolCalls;

    while (iterations < maxIterations) {
      iterations++;

      const response = await this.llmClient.completions({
        model: 'gpt-4-turbo-preview',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.3,
      });

      const choice = response.choices[0];
      const message = choice.message;

      // Check if agent wants to call tools
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Execute tool calls
        const toolResults = await this.executeToolCalls(message.tool_calls);

        // Add assistant message and tool responses to conversation
        messages.push({
          role: 'assistant',
          content: message.content || '',
        });

        for (const result of toolResults) {
          messages.push({
            role: 'assistant',
            content: JSON.stringify(result),
          });
        }

        continue;
      }

      // Agent returned final answer
      if (message.content) {
        try {
          const result = JSON.parse(message.content) as AnnotationResponse;

          // Store annotations in database
          if (result.annotations && result.annotations.length > 0) {
            await this.storeAnnotations(symbol, result.annotations);
          }

          return result;
        } catch (error) {
          // If parsing fails, wrap the content as explanation
          return {
            annotations: [],
            explanation: message.content,
          };
        }
      }

      // Shouldn't reach here, but break to prevent infinite loop
      break;
    }

    return {
      annotations: [],
      explanation: 'Agent exceeded maximum iterations without completing.',
    };
  }

  /**
   * Execute tool calls in parallel (or sequentially if needed)
   */
  private async executeToolCalls(toolCalls: any[]): Promise<any[]> {
    const promises = toolCalls.map(async (toolCall) => {
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      const tool = this.toolMap.get(toolName);
      if (!tool) {
        return {
          tool_call_id: toolCall.id,
          error: `Tool ${toolName} not found`,
        };
      }

      try {
        const result = await tool.handler(args);
        return {
          tool_call_id: toolCall.id,
          result,
        };
      } catch (error) {
        return {
          tool_call_id: toolCall.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    if (AGENT_CONFIG.parallelToolCalls) {
      return await Promise.all(promises);
    } else {
      // Sequential execution
      const results = [];
      for (const promise of promises) {
        results.push(await promise);
      }
      return results;
    }
  }

  /**
   * Store annotations in ClickHouse
   */
  private async storeAnnotations(symbol: string, annotations: Annotation[]): Promise<void> {
    const dbAnnotations = annotations.map((a) => ({
      symbol,
      ts: new Date(a.ts),
      tag: a.tag,
      note: a.note,
      source_tool: a.source_tool,
    }));

    await this.clickhouse.insertAnnotations(dbAnnotations);
  }
}

let agentOrchestrator: AgentOrchestrator | null = null;

export function getAgentOrchestrator(): AgentOrchestrator {
  if (!agentOrchestrator) {
    agentOrchestrator = new AgentOrchestrator();
  }
  return agentOrchestrator;
}
