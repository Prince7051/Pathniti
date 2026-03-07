"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/providers";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, X, Bot } from "lucide-react";
import { SarthiChat } from "./SarthiChat";

interface SarthiChatWidgetProps {
  className?: string;
  initialMessage?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export function SarthiChatWidget({
  className = "",
  initialMessage,
  position = "bottom-right",
}: SarthiChatWidgetProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isPermanentlyClosed, setIsPermanentlyClosed] = useState(false);

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setIsMinimized(false);
    }
    setHasNewMessage(false);
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const expandChat = () => {
    setIsMinimized(false);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setIsPermanentlyClosed(true);
    // Store in localStorage to remember the user's preference
    localStorage.setItem("sarthi-chat-closed", "true");
  };

  // Check if chat was permanently closed
  useEffect(() => {
    const wasClosed = localStorage.getItem("sarthi-chat-closed");
    if (wasClosed === "true") {
      setIsPermanentlyClosed(true);
    }
  }, []);

  // Reset closed state when user navigates to chat page
  useEffect(() => {
    if (pathname === "/chat") {
      setIsPermanentlyClosed(false);
      localStorage.removeItem("sarthi-chat-closed");
    }
  }, [pathname]);

  // Show notification for new users
  useEffect(() => {
    if (user && !isOpen) {
      const hasSeenChat = localStorage.getItem("sarthi-chat-seen");
      if (!hasSeenChat) {
        setHasNewMessage(true);
        localStorage.setItem("sarthi-chat-seen", "true");
      }
    }
  }, [user, isOpen]);

  // Don't show widget for non-authenticated users
  if (!user) {
    return null;
  }

  // Don't show widget on certain pages where it shouldn't appear
  const hiddenPages = [
    "/comprehensive-assessment",
    "/assessment-results",
    "/quiz",
    "/test-assessment",
    "/chat", // Don't show widget on dedicated chat page
  ];

  const shouldHideWidget = hiddenPages.some(page => pathname.startsWith(page)) || isPermanentlyClosed;

  if (shouldHideWidget) {
    return null;
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      {!isOpen ? (
        // Chat Button
        <Button
          onClick={toggleChat}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 p-0 group relative"
          size="lg"
        >
          <MessageSquare className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-200" />
          {hasNewMessage && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-xs text-white font-bold">!</span>
            </div>
          )}
        </Button>
      ) : (
        // Chat Window
        <div
          className={`w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ${isMinimized ? "h-14" : ""} transition-all duration-300`}
        >
          {isMinimized ? (
            // Minimized Header
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              onClick={expandChat}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">
                      Sarthi
                    </span>
                    <p className="text-xs text-gray-500">Click to expand</p>
                  </div>
                </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeChat();
                      }}
                      className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full"
                      title="Close chat"
                    >
                      <X className="w-4 h-4" />
                    </Button>
              </div>
            </div>
          ) : (
            // Full Chat Interface
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Sarthi</h3>
                      <p className="text-xs text-gray-600">
                        Education Counselor
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={minimizeChat}
                      className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full"
                    >
                      <span className="text-sm">_</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeChat}
                      className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full"
                      title="Close chat permanently"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <SarthiChat
                  className="border-0 shadow-none h-full"
                  initialMessage={initialMessage}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for embedding in pages
export function SarthiChatCompact({
  className = "",
  initialMessage,
}: {
  className?: string;
  initialMessage?: string;
}) {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6 text-center">
          <Bot className="w-8 h-8 mx-auto mb-3 text-gray-400" />
          <h3 className="font-semibold mb-2">Chat with AI Sarthi</h3>
          <p className="text-sm text-gray-600 mb-4">
            Sign in to get personalized education guidance
          </p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-green-600" />
          AI Sarthi
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96">
          <SarthiChat
            className="border-0 shadow-none h-full"
            initialMessage={initialMessage}
          />
        </div>
      </CardContent>
    </Card>
  );
}
