"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Pause, Play, Square, Loader2, AlertCircle } from "lucide-react";
import { ttsService } from "@/lib/tts";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface GlobalTTSProps {
  className?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "floating";
  variant?: "button" | "compact" | "minimal";
}

export function GlobalTTS({
  className,
  position = "top-right",
  variant = "button",
}: GlobalTTSProps) {
  const { i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReadingPage, setIsReadingPage] = useState(false);
  
  const currentTextRef = useRef<string>('');
  const currentLanguageRef = useRef<string>('');

  useEffect(() => {
    // Only check TTS support on client side
    if (typeof window !== 'undefined') {
      setIsSupported(ttsService.getState().isSupported);
      
      if (!ttsService.getState().isSupported) {
        setError('Text-to-speech is not supported in your browser');
        return;
      }
    }

    // Listen for TTS state changes
    const checkTTSState = () => {
      const state = ttsService.getState();
      setIsSpeaking(state.isSpeaking);
      setIsPaused(state.isPaused);
      currentTextRef.current = state.currentText;
      currentLanguageRef.current = state.currentLanguage;
    };

    ttsService.onStateChange(checkTTSState);
    return () => ttsService.offStateChange(checkTTSState);
  }, []);

  const extractPageText = (): string => {
    if (typeof window === 'undefined') return '';
    
    // Get all visible text content from the page
    const textElements = document.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, p, span, div, a, button, label, li, td, th, blockquote, article, section, main, header, footer, nav, aside'
    );
    
    const textContent: string[] = [];
    
    textElements.forEach((element) => {
      const text = element.textContent?.trim();
      if (text && text.length > 0 && isElementVisible(element)) {
        // Skip elements that are likely UI controls or navigation
        if (!isLikelyUIElement(element)) {
          textContent.push(text);
        }
      }
    });
    
    // Remove duplicates and join with periods
    const uniqueText = Array.from(new Set(textContent));
    return uniqueText.join('. ');
  };

  const isElementVisible = (element: Element): boolean => {
    const style = window.getComputedStyle(element);
    const htmlElement = element as HTMLElement;
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      htmlElement.offsetWidth > 0 &&
      htmlElement.offsetHeight > 0
    );
  };

  const isLikelyUIElement = (element: Element): boolean => {
    const tagName = element.tagName.toLowerCase();
    const className = element.className.toLowerCase();
    const id = element.id.toLowerCase();
    
    // Skip common UI elements
    const uiPatterns = [
      'button', 'btn', 'nav', 'menu', 'dropdown', 'modal', 'popup',
      'tooltip', 'badge', 'icon', 'logo', 'search', 'filter', 'sort',
      'pagination', 'breadcrumb', 'tab', 'accordion', 'carousel',
      'slider', 'toggle', 'switch', 'checkbox', 'radio', 'input',
      'select', 'textarea', 'form', 'field', 'label', 'error',
      'success', 'warning', 'info', 'loading', 'spinner', 'progress'
    ];
    
    return uiPatterns.some(pattern => 
      className.includes(pattern) || 
      id.includes(pattern) || 
      tagName === pattern
    );
  };

  const handleReadPage = async () => {
    if (!isSupported) {
      setError('Text-to-speech is not supported in your browser');
      return;
    }
    
    // Prevent rapid successive calls
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setIsReadingPage(true);
    
    try {
      // Stop any current speech first
      ttsService.stop();
      
      // Small delay to ensure previous speech is stopped
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const pageText = extractPageText();
      
      if (!pageText || pageText.trim().length === 0) {
        setError('No readable content found on this page');
        return;
      }
      
      const langToUse = i18n.language;
      await ttsService.speak(pageText, { language: langToUse });
      setIsSpeaking(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Global TTS Error:", err);
      
      // Don't show error for interruption - it's expected behavior
      if (err instanceof Error && err.message.includes('interrupted')) {
        console.log('TTS was interrupted - this is normal');
        setIsSpeaking(false);
        setIsPaused(false);
      } else {
        setError("Failed to read page content. Please try again.");
        setIsSpeaking(false);
        setIsPaused(false);
      }
    } finally {
      setIsLoading(false);
      setIsReadingPage(false);
    }
  };

  const handlePause = () => {
    ttsService.pause();
    setIsPaused(true);
  };

  const handleResume = () => {
    ttsService.resume();
    setIsPaused(false);
  };

  const handleStop = () => {
    ttsService.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Determine if the current text being spoken is from this global TTS
  const isThisGlobalTTS = isSpeaking && isReadingPage;

  if (!isSupported && error) {
    return (
      <div className={cn(
        "fixed z-50 flex items-center text-red-500 text-sm bg-white p-2 rounded shadow-lg",
        position === "top-right" && "top-4 right-4",
        position === "top-left" && "top-4 left-4",
        position === "bottom-right" && "bottom-4 right-4",
        position === "bottom-left" && "bottom-4 left-4",
        position === "floating" && "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        className
      )}>
        <AlertCircle className="h-4 w-4 mr-1" />
        <span>{error}</span>
      </div>
    );
  }

  if (!isSupported) {
    return null; // Don't render if not supported and no error to show
  }

  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "fixed top-4 right-4 z-50";
      case "top-left":
        return "fixed top-4 left-4 z-50";
      case "bottom-right":
        return "fixed bottom-4 right-4 z-50";
      case "bottom-left":
        return "fixed bottom-4 left-4 z-50";
      case "floating":
        return "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50";
      default:
        return "fixed top-4 right-4 z-50";
    }
  };

  const buttonProps = {
    size: (variant === "compact" ? "sm" : "default") as "sm" | "default",
    variant: (position === "floating" ? "default" : "outline") as "default" | "outline",
    className: cn(
      "tts-global-button",
      position === "floating" && "rounded-full shadow-lg",
      variant === "minimal" && "p-2",
      className
    ),
  };

  if (isThisGlobalTTS && !isPaused) {
    return (
      <div className={getPositionClasses()}>
        <div className="flex items-center space-x-2 bg-white p-2 rounded shadow-lg">
          <Button {...buttonProps} onClick={handlePause} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
            {variant === "button" && "Pause"}
          </Button>
          <Button {...buttonProps} onClick={handleStop} disabled={isLoading}>
            <Square className="h-4 w-4" />
            {variant === "button" && "Stop"}
          </Button>
        </div>
      </div>
    );
  } else if (isThisGlobalTTS && isPaused) {
    return (
      <div className={getPositionClasses()}>
        <div className="flex items-center space-x-2 bg-white p-2 rounded shadow-lg">
          <Button {...buttonProps} onClick={handleResume} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {variant === "button" && "Resume"}
          </Button>
          <Button {...buttonProps} onClick={handleStop} disabled={isLoading}>
            <Square className="h-4 w-4" />
            {variant === "button" && "Stop"}
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <div className={getPositionClasses()}>
        <Button {...buttonProps} onClick={handleReadPage} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {variant === "button" && "Read Page"}
        </Button>
      </div>
    );
  }
}

export default GlobalTTS;
