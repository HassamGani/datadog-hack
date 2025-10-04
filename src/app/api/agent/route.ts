import { NextRequest, NextResponse } from "next/server";
import { callTradingAgent, type TradingAgentContext, type AgentMessage } from "@/lib/agents/tradingAgent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context }: { messages: AgentMessage[]; context: TradingAgentContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array required" },
        { status: 400 }
      );
    }

    if (!context) {
      return NextResponse.json(
        { error: "Invalid request: context required" },
        { status: 400 }
      );
    }

    const response = await callTradingAgent(messages, context);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in agent API route:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to process request" 
      },
      { status: 500 }
    );
  }
}

