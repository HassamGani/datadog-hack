"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  TextField,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Alert,
} from "@mui/material";
import { Send, SmartToy, Person, Refresh } from "@mui/icons-material";
import { Bot, MessageCircle, Sparkles, TrendingUp, Search, Brain, Activity, Target } from "lucide-react";
import type { TradingAgentContext, AgentMessage, UsefulSource } from "@/lib/agents/tradingAgent";
import { executeTool } from "@/lib/agents/tradingAgent";
import type { IndicatorConfig } from "@/lib/indicators/types";

interface TradingAgentChatProps {
  context: TradingAgentContext;
  setIndicators: (indicators: IndicatorConfig[]) => void;
  addUsefulSource: (source: UsefulSource) => void;
}

export default function TradingAgentChat({ context, setIndicators, addUsefulSource }: TradingAgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // First call to AI
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: {
            ...context,
            indicators: context.indicators,
          },
        }),
      });

      // Clone response so we can read it multiple times if needed
      const responseClone = response.clone();
      
      if (!response.ok) {
        let errorMessage = "Failed to get response from agent";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, try to get text from clone
          try {
            const errorText = await responseClone.text();
            errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
          } catch {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        try {
          const responseText = await responseClone.text();
          console.error("Failed to parse response as JSON:", responseText);
          throw new Error("Received invalid response from server. Check console for details.");
        } catch {
          throw new Error("Received invalid response from server (could not read response body).");
        }
      }

      // Check if AI wants to use tools
      if (data.toolCalls && data.toolCalls.length > 0) {
        // Execute tools
        const toolResults: string[] = [];
        
        for (const toolCall of data.toolCalls) {
          // Handle search_web separately as it needs an API call
          if (toolCall.function === "search_web") {
            try {
              const searchResponse = await fetch("/api/linkup", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  query: toolCall.arguments.query,
                  depth: toolCall.arguments.depth || "standard",
                }),
              });

              if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const results = searchData.results || [];
                
                if (results.length > 0) {
                  const resultSummary = results
                    .slice(0, 5) // Top 5 results
                    .map((r: any, i: number) => {
                      const snippet = r.snippet || "No description available";
                      const truncatedSnippet = snippet.length > 100 
                        ? snippet.substring(0, 100) + "..." 
                        : snippet;
                      return `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${truncatedSnippet}`;
                    })
                    .join("\n\n");
                  
                  toolResults.push(`search_web: Found ${results.length} results:\n\n${resultSummary}`);
                } else {
                  toolResults.push(`search_web: No results found for "${toolCall.arguments.query}"`);
                }
              } else {
                // Handle error response
                let errorMessage = `Error searching - ${searchResponse.statusText}`;
                try {
                  const errorData = await searchResponse.json();
                  errorMessage = errorData.error || errorMessage;
                } catch {
                  // Ignore JSON parse errors for error response
                }
                console.error("Search API error:", errorMessage);
                toolResults.push(`search_web: ${errorMessage}`);
              }
            } catch (err) {
              console.error("Error calling search API:", err);
              const errorMsg = err instanceof Error ? err.message : "Failed to search the web";
              toolResults.push(`search_web: ${errorMsg}`);
            }
          } else {
            // Execute other tools normally
            try {
              const result = executeTool(
                toolCall.function,
                toolCall.arguments,
                context,
                setIndicators,
                addUsefulSource
              );
              toolResults.push(`${toolCall.function}: ${result}`);
            } catch (err) {
              console.error(`Error executing tool ${toolCall.function}:`, err);
              const errorMsg = err instanceof Error ? err.message : "Tool execution failed";
              toolResults.push(`${toolCall.function}: Error - ${errorMsg}`);
            }
          }
        }

        // Build conversation history with tool results
        const conversationWithTools = [
          ...messages,
          userMessage,
          {
            role: "assistant" as const,
            content: `[Tool calls executed: ${data.toolCalls.map((tc: any) => tc.function).join(", ")}]`,
          },
          {
            role: "user" as const,
            content: `Tool results:\n${toolResults.join("\n")}\n\nPlease provide a summary of what you did and any insights for the user.`,
          },
        ];

        // Second call to get final response
        const finalResponse = await fetch("/api/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: conversationWithTools,
            context: {
              ...context,
              indicators: context.indicators,
            },
          }),
        });

        if (!finalResponse.ok) {
          throw new Error("Failed to get final response from agent");
        }

        const finalData = await finalResponse.json();

        // Add the AI's final message
        const assistantMessage: AgentMessage = {
          role: "assistant",
          content: finalData.message,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // No tools needed, just add the response
        const assistantMessage: AgentMessage = {
          role: "assistant",
          content: data.message,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error("Error calling agent:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      
      // Add error message
      const errorMessage: AgentMessage = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        avatar={
          <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
            <Brain size={24} />
          </Box>
        }
        title={<Typography variant="subtitle1">Trading AI Assistant</Typography>}
        subheader="Ask about the market or manage indicators"
        action={
          <IconButton size="small" onClick={handleReset} disabled={messages.length === 0}>
            <Refresh />
          </IconButton>
        }
      />
      <Divider />
      <CardContent sx={{ flexGrow: 1, overflow: "hidden", display: "flex", flexDirection: "column", p: 0 }}>
        {/* Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {messages.length === 0 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Sparkles size={48} style={{ color: '#9e9e9e' }} />
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Hi! I&apos;m your trading AI assistant. I can help you:
              </Typography>
              <Stack spacing={1} sx={{ mt: 2, alignItems: "center" }}>
                <Chip icon={<TrendingUp size={16} />} label="Add or remove technical indicators" size="small" />
                <Chip icon={<Activity size={16} />} label="Analyze current market trends" size="small" />
                <Chip icon={<MessageCircle size={16} />} label="Answer questions about indicators" size="small" />
                <Chip icon={<Target size={16} />} label="Provide trading insights" size="small" />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                Try: &quot;Add a 20-period SMA&quot; or &quot;What&apos;s the current trend?&quot;
              </Typography>
            </Box>
          )}

          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent: message.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  maxWidth: "80%",
                  bgcolor: message.role === "user" ? "primary.main" : "background.paper",
                  color: message.role === "user" ? "primary.contrastText" : "text.primary",
                  borderRadius: 2,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  {message.role === "assistant" && (
                    <SmartToy sx={{ fontSize: 20, mt: 0.3 }} />
                  )}
                  {message.role === "user" && (
                    <Person sx={{ fontSize: 20, mt: 0.3 }} />
                  )}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      color: message.role === "user" ? "primary.contrastText" : "text.primary",
                    }}
                  >
                    {message.content}
                  </Typography>
                </Stack>
              </Paper>
            </Box>
          ))}

          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
              <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SmartToy sx={{ fontSize: 20 }} />
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Thinking...
                  </Typography>
                </Stack>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, bgcolor: "background.default", borderTop: 1, borderColor: "divider" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask me anything about the market or indicators..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              multiline
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              sx={{ alignSelf: "flex-end" }}
            >
              <Send />
            </IconButton>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

