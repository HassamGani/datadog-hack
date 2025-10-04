/**
 * OpenHands / MCP Integration
 * Agent SDK for autonomous task execution
 */

import { getMCPServer } from '../mcp/server';
import { getAgentOrchestrator } from '../agent/orchestrator';

export interface OpenHandsTask {
  id: string;
  type: 'analysis' | 'research' | 'automation';
  description: string;
  context: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export class OpenHandsAgent {
  private mcpServer = getMCPServer();
  private orchestrator = getAgentOrchestrator();
  private tasks = new Map<string, OpenHandsTask>();

  /**
   * Initialize agent with MCP capabilities
   */
  async initialize(): Promise<void> {
    console.log('OpenHands Agent: Initializing with MCP tools...');
    
    const tools = this.mcpServer.listTools();
    console.log(`OpenHands: Discovered ${tools.length} MCP tools`);
    
    tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    console.log('OpenHands Agent: Ready for autonomous task execution');
  }

  /**
   * Execute autonomous market research task
   */
  async executeResearchTask(
    symbol: string,
    question: string,
    timeframe: { start: string; end: string }
  ): Promise<OpenHandsTask> {
    const taskId = `research-${Date.now()}`;
    
    const task: OpenHandsTask = {
      id: taskId,
      type: 'research',
      description: `Research ${symbol}: ${question}`,
      context: { symbol, question, timeframe },
      status: 'running',
    };

    this.tasks.set(taskId, task);

    try {
      console.log(`OpenHands: Starting research task ${taskId}`);

      // Use the orchestrator to analyze
      const result = await this.orchestrator.annotate({
        symbol,
        question,
        start: timeframe.start,
        end: timeframe.end,
      });

      task.status = 'completed';
      task.result = result;

      console.log(`OpenHands: Task ${taskId} completed successfully`);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`OpenHands: Task ${taskId} failed:`, error);
    }

    this.tasks.set(taskId, task);
    return task;
  }

  /**
   * Execute autonomous data collection task
   */
  async executeDataCollectionTask(symbols: string[], days: number): Promise<OpenHandsTask> {
    const taskId = `collection-${Date.now()}`;
    
    const task: OpenHandsTask = {
      id: taskId,
      type: 'automation',
      description: `Collect ${days} days of data for ${symbols.length} symbols`,
      context: { symbols, days },
      status: 'running',
    };

    this.tasks.set(taskId, task);

    try {
      console.log(`OpenHands: Starting data collection task ${taskId}`);

      const end = new Date();
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

      // Call MCP tools to collect data
      const requests = symbols.map((symbol) => ({
        jsonrpc: '2.0' as const,
        id: symbol,
        method: 'tools/call',
        params: {
          name: 'get_raw_news',
          arguments: {
            symbol,
            start: start.toISOString(),
            end: end.toISOString(),
            limit: 100,
          },
        },
      }));

      const responses = await this.mcpServer.handleBatchRequest(requests);
      
      task.status = 'completed';
      task.result = {
        collected: responses.length,
        symbols,
      };

      console.log(`OpenHands: Task ${taskId} completed successfully`);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.tasks.set(taskId, task);
    return task;
  }

  /**
   * Get task status
   */
  getTask(taskId: string): OpenHandsTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * List all tasks
   */
  listTasks(): OpenHandsTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Agent self-improvement via reflection
   */
  async reflect(): Promise<void> {
    console.log('OpenHands: Performing agent reflection...');
    
    const completedTasks = Array.from(this.tasks.values()).filter(
      (t) => t.status === 'completed'
    );
    
    const failedTasks = Array.from(this.tasks.values()).filter(
      (t) => t.status === 'failed'
    );

    console.log(`OpenHands Reflection:
  - Total tasks: ${this.tasks.size}
  - Completed: ${completedTasks.length}
  - Failed: ${failedTasks.length}
  - Success rate: ${((completedTasks.length / this.tasks.size) * 100).toFixed(1)}%`);

    // Identify patterns in failures
    if (failedTasks.length > 0) {
      console.log('OpenHands: Analyzing failure patterns...');
      failedTasks.forEach((task) => {
        console.log(`  - ${task.id}: ${task.error}`);
      });
    }
  }
}

let openHandsAgent: OpenHandsAgent | null = null;

export function getOpenHandsAgent(): OpenHandsAgent {
  if (!openHandsAgent) {
    openHandsAgent = new OpenHandsAgent();
    openHandsAgent.initialize().catch(console.error);
  }
  return openHandsAgent;
}
