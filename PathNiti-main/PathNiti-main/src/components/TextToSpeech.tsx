"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';
import { ttsService, TTSOptions } from '@/lib/tts';
import { cn } from '@/lib/utils';

interface TextToSpeechProps {
  text: string;
  language?: string;
  className?: string;
  variant?: 'button' | 'inline' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  autoDetectLanguage?: boolean;
  options?: TTSOptions;
}

export function TextToSpeech({
  text,
  language,
  className = '',
  variant = 'button',
  size = 'md',
  showText = false,
  autoDetectLanguage = true,
  options = {},
}: TextToSpeechProps) {
  const { i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
      
      // Check if this component's text is currently being spoken
      if (state.currentText === text && state.isSpeaking) {
        setIsSpeaking(true);
      } else if (currentTextRef.current === text) {
        setIsSpeaking(false);
        setIsPaused(false);
      }
    };

    const interval = setInterval(checkTTSState, 100);
    return () => clearInterval(interval);
  }, [text, isSupported]);

  const getCurrentLanguage = (): string => {
    if (language) return language;
    if (autoDetectLanguage) return i18n.language;
    return 'en';
  };

  const handlePlay = async () => {
    if (!isSupported) {
      setError('Text-to-speech is not supported in your browser');
      return;
    }

    if (!text.trim()) {
      setError('No text to speak');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentLang = getCurrentLanguage();
      currentTextRef.current = text;
      currentLanguageRef.current = currentLang;

      const ttsOptions: TTSOptions = {
        language: currentLang,
        rate: 1,
        pitch: 1,
        volume: 1,
        ...options,
      };

      await ttsService.speak(text, ttsOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error playing audio');
      console.error('TTS Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (isSpeaking && !isPaused) {
      ttsService.pause();
    } else if (isSpeaking && isPaused) {
      ttsService.resume();
    }
  };

  const handleStop = () => {
    ttsService.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    currentTextRef.current = '';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8 p-1';
      case 'lg':
        return 'h-12 w-12 p-2';
      default:
        return 'h-10 w-10 p-2';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  if (!isSupported) {
    return (
      <div className={cn('flex items-center space-x-2 text-gray-500', className)}>
        <VolumeX className={getIconSize()} />
        {showText && <span className="text-sm">TTS not supported</span>}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {showText && (
          <span className="text-sm text-gray-600">
            {isSpeaking ? 'Speaking...' : 'Listen'}
          </span>
        )}
        <div className="flex items-center space-x-1">
          {!isSpeaking ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlay}
              disabled={isLoading || !text.trim()}
              className={cn('h-8 w-8 p-0', getSizeClasses())}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary"></div>
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePause}
                className="h-8 w-8 p-0"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStop}
                className="h-8 w-8 p-0"
              >
                <Square className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-500">{error}</span>
        )}
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={cn('fixed bottom-4 right-4 z-50', className)}>
        <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2">
          {!isSpeaking ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlay}
              disabled={isLoading || !text.trim()}
              className="rounded-full"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-primary"></div>
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
          ) : (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePause}
                className="rounded-full"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStop}
                className="rounded-full"
              >
                <Square className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default button variant
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {!isSpeaking ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlay}
          disabled={isLoading || !text.trim()}
          className="flex items-center space-x-2"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary"></div>
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>Listen</span>
        </Button>
      ) : (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePause}
            className="flex items-center space-x-2"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            className="flex items-center space-x-2"
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </Button>
        </div>
      )}
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}

export default TextToSpeech;
