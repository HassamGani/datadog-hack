/**
 * MCP (Model Context Protocol) Server
 * Exposes all tools as MCP-compatible endpoints
 */

import { ALL_TOOLS } from '../tools';
import type { ToolDefinition } from '../types';

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class MCPServer {
  private tools: Map<string, ToolDefinition>;

  constructor() {
    this.tools = new Map(ALL_TOOLS.map((tool) => [tool.name, tool]));
  }

  /**
   * List all available tools
   */
  listTools(): Array<{
    name: string;
    description: string;
    inputSchema: object;
  }> {
    return ALL_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Handle MCP JSON-RPC request
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const { id, method, params } = request;

    try {
      switch (method) {
        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: this.listTools(),
            },
          };

        case 'tools/call': {
          const { name, arguments: args } = params;
          const tool = this.tools.get(name);

          if (!tool) {
            return {
              jsonrpc: '2.0',
              id,
              error: {
                code: -32601,
                message: `Tool not found: ${name}`,
              },
            };
          }

          const result = await tool.handler(args);

          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result),
                },
              ],
            },
          };
        }

        case 'initialize':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: 'trading-agent-mcp',
                version: '1.0.0',
              },
            },
          };

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
          data: error instanceof Error ? error.stack : undefined,
        },
      };
    }
  }

  /**
   * Process batch requests
   */
  async handleBatchRequest(requests: MCPRequest[]): Promise<MCPResponse[]> {
    return Promise.all(requests.map((req) => this.handleRequest(req)));
  }
}

let mcpServer: MCPServer | null = null;

export function getMCPServer(): MCPServer {
  if (!mcpServer) {
    mcpServer = new MCPServer();
  }
  return mcpServer;
}
