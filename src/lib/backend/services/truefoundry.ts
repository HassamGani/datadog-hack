/**
 * TrueFoundry AI Gateway Client
 * For routing and managing LLM model calls
 */

import { getServiceConfig } from '../config';

export interface LLMRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  tool_choice?: string | object;
}

export interface LLMResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: any[];
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class TrueFoundryClient {
  private config = getServiceConfig().truefoundry;
  private openaiConfig = getServiceConfig().openai;

  async completions(request: LLMRequest): Promise<LLMResponse> {
    // Route through TrueFoundry AI Gateway if configured, otherwise direct to OpenAI
    const baseUrl = this.config.gatewayUrl || 'https://api.openai.com/v1';
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey || this.openaiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || this.openaiConfig.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens,
        tools: request.tools,
        tool_choice: request.tool_choice,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TrueFoundry/OpenAI API error: ${error}`);
    }

    return await response.json();
  }

  async streamCompletions(
    request: LLMRequest,
    onChunk: (chunk: any) => void
  ): Promise<void> {
    const baseUrl = this.config.gatewayUrl || 'https://api.openai.com/v1';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey || this.openaiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        model: request.model || this.openaiConfig.model,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TrueFoundry streaming error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const chunk = JSON.parse(data);
            onChunk(chunk);
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

let truefoundryClient: TrueFoundryClient | null = null;

export function getTrueFoundryClient(): TrueFoundryClient {
  if (!truefoundryClient) {
    truefoundryClient = new TrueFoundryClient();
  }
  return truefoundryClient;
}
