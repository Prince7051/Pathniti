"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge"; // Temporarily unused
import {
  Loader2,
  Send,
  RotateCcw,
  MessageSquare,
  Bot,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import { offlineSarthiAI } from "@/lib/offline-sarthi-ai";

interface Message {
  id: string;
  session_id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: {
    capability_used?: string;
    confidence_score?: number;
    processing_time_ms?: number;
    is_offline_response?: boolean;
  };
}


interface SarthiChatProps {
  className?: string;
  initialMessage?: string;
}

export function SarthiChat({
  className = "",
  initialMessage,
}: SarthiChatProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const initializeSession = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.id,
          session_name: "Chat with Sarthi",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
      } else {
        console.error("Failed to initialize chat session");
      }
    } catch (error) {
      console.error("Error initializing chat session:", error);
    }
  }, [user?.id]);

  // Initialize chat session
  useEffect(() => {
    if (user && !sessionId) {
      initializeSession();
    }
  }, [user, sessionId, initializeSession]);

  // Listen for online/offline status changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSendMessage = useCallback(async (messageContent?: string) => {
    const content = messageContent || inputValue.trim();
    if (!content || !sessionId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      session_id: sessionId || "",
      type: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Use offline-first Sarthi AI
      const sarthiResponse = await offlineSarthiAI.processMessage(
        content,
        sessionId,
        {
          user_profile: profile
            ? {
                user_id: user?.id || "",
                class_level: (profile as { class_level?: string }).class_level || "",
                stream: (profile as { stream?: string }).stream || "",
                interests: (profile as { interests?: string[] }).interests || [],
                location: (profile as { location?: Record<string, unknown> }).location || {},
              }
            : undefined,
          conversation_history: messages,
        },
      );

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        session_id: sessionId,
        type: "assistant",
        content: sarthiResponse.response,
        timestamp: new Date().toISOString(),
        metadata: {
          capability_used: sarthiResponse.capability_used,
          confidence_score: sarthiResponse.confidence_score,
          processing_time_ms: sarthiResponse.processing_time_ms,
          is_offline_response: sarthiResponse.is_offline_response,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save messages to offline storage
      await offlineSarthiAI.saveMessage(userMessage);
      await offlineSarthiAI.saveMessage(assistantMessage);
    } catch (error) {
      console.error("Error sending message:", error);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        session_id: sessionId,
        type: "assistant",
        content:
          "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
        timestamp: new Date().toISOString(),
        metadata: {
          capability_used: "error_handling",
          confidence_score: 0.1,
          processing_time_ms: 0,
          is_offline_response: true,
        },
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [inputValue, sessionId, user, profile, messages]);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && sessionId && messages.length === 0) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, sessionId, messages.length, handleSendMessage]);

  const handleResetConversation = async () => {
    if (!sessionId) return;

    try {
      await fetch("/api/chat/session/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      setMessages([]);
      await initializeSession();
    } catch (error) {
      console.error("Failed to reset conversation:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  if (!user) {
    return (
      <Card className={`w-full max-w-4xl mx-auto ${className}`}>
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">
            Sign in to chat with Sarthi
          </h3>
          <p className="text-gray-600">
            Please sign in to start your conversation with AI Sarthi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`w-full h-full bg-white flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">Sarthi</h2>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">Education Counselor</p>
                {/* Offline/Online Status Indicator */}
                {isOnline ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Wifi className="h-3 w-3" />
                    <span className="text-xs">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <WifiOff className="h-3 w-3" />
                    <span className="text-xs">Offline</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetConversation}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages - Full Height */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex gap-4 max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === "user"
                      ? "bg-blue-500"
                      : "bg-gradient-to-r from-blue-500 to-purple-600"
                  }`}
                >
                  {message.type === "user" ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message */}
                <div
                  className={`rounded-2xl px-5 py-3 shadow-sm ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-5 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Sarthi is typing
                    </span>
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message Sarthi..."
              disabled={isLoading}
              className="flex-1 border-gray-300 rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              size="sm"
              className="rounded-full w-12 h-12 p-0 bg-blue-500 hover:bg-blue-600 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
