"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

interface AIChatProps {
  userProfile?: {
    user_id: string;
    class_level?: string;
    stream?: string;
    interests?: string[];
    location?: { state?: string; city?: string };
  };
  className?: string;
}

export default function AIChat({ userProfile, className = "" }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hello! I'm your AI career counselor. I can help you with stream selection, college guidance, career advice, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Determine the type of question for better AI response
      const questionType = determineQuestionType(input);

      const response = await fetch("/api/ai/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input.trim(),
          context: userProfile,
          type: questionType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.response,
        timestamp: new Date(),
        context: {
          type: questionType,
          usage: data.usage, // Include usage stats
        },
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const determineQuestionType = (question: string): string => {
    const lowerQuestion = question.toLowerCase();

    if (
      lowerQuestion.includes("stream") ||
      lowerQuestion.includes("subject") ||
      lowerQuestion.includes("science") ||
      lowerQuestion.includes("arts") ||
      lowerQuestion.includes("commerce")
    ) {
      return "stream_selection";
    }

    if (
      lowerQuestion.includes("college") ||
      lowerQuestion.includes("university") ||
      lowerQuestion.includes("admission") ||
      lowerQuestion.includes("course")
    ) {
      return "college_guidance";
    }

    if (
      lowerQuestion.includes("career") ||
      lowerQuestion.includes("job") ||
      lowerQuestion.includes("profession") ||
      lowerQuestion.includes("salary")
    ) {
      return "career_advice";
    }

    return "general";
  };

  const getQuestionTypeBadge = (type?: string) => {
    if (!type) return null;

    const badges = {
      stream_selection: {
        label: "Stream Selection",
        color: "bg-blue-100 text-blue-800",
      },
      college_guidance: {
        label: "College Guidance",
        color: "bg-green-100 text-green-800",
      },
      career_advice: {
        label: "Career Advice",
        color: "bg-purple-100 text-purple-800",
      },
      general: { label: "General", color: "bg-gray-100 text-gray-800" },
    };

    const badge = badges[type as keyof typeof badges] || badges.general;
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  return (
    <Card className={`h-[600px] flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          AI Career Counselor
          {userProfile && (
            <Badge variant="outline" className="ml-auto">
              Personalized
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 px-4 overflow-y-auto" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "ai" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-xs ${
                        message.type === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.type === "ai" && message.context && (message.context.type as string) && (
                      <div className="ml-2">
                        {getQuestionTypeBadge(message.context.type as string)}
                      </div>
                    )}
                  </div>
                </div>

                {message.type === "user" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about streams, colleges, careers..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
