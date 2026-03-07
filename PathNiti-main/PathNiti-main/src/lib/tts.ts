/**
 * Text-to-Speech utility with language support
 */

export interface TTSOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

export interface TTSState {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string;
  currentLanguage: string;
  availableVoices: SpeechSynthesisVoice[];
}

class TTSService {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private stateChangeListeners: Array<() => void> = [];
  private state: TTSState = {
    isSupported: false,
    isSpeaking: false,
    isPaused: false,
    currentText: '',
    currentLanguage: 'en',
    availableVoices: [],
  };

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
      this.state.isSupported = 'speechSynthesis' in window;
      
      if (this.state.isSupported && this.synthesis) {
        this.loadVoices();
        // Some browsers load voices asynchronously
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (this.synthesis) {
      this.state.availableVoices = this.synthesis.getVoices();
    }
  }

  /**
   * Get the current TTS state
   */
  getState(): TTSState {
    return { ...this.state };
  }

  /**
   * Get available voices for a specific language
   */
  getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    let voices = this.state.availableVoices.filter(voice => 
      voice.lang.startsWith(language) || voice.lang.startsWith(language.split('-')[0])
    );
    
    // For Kashmiri, also include Urdu voices as fallback
    if (language === 'ks' || language === 'kashmiri') {
      const urduVoices = this.state.availableVoices.filter(voice => 
        voice.lang.startsWith('ur') || voice.lang.includes('urdu')
      );
      voices = [...voices, ...urduVoices];
    }
    
    return voices;
  }

  /**
   * Get the best voice for a language
   */
  getBestVoiceForLanguage(language: string): SpeechSynthesisVoice | null {
    const voices = this.getVoicesForLanguage(language);
    
    if (voices.length === 0) {
      return null;
    }

    // Prefer local voices over remote ones
    const localVoices = voices.filter(voice => voice.localService);
    if (localVoices.length > 0) {
      return localVoices[0];
    }

    // Fallback to first available voice
    return voices[0];
  }

  /**
   * Speak text with specified options
   */
  speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.state.isSupported || !this.synthesis) {
        reject(new Error('Speech synthesis is not supported'));
        return;
      }

      // Stop any current speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language
      const language = options.language || this.state.currentLanguage;
      utterance.lang = this.getLanguageCode(language);

      // Set voice
      if (options.voice) {
        utterance.voice = options.voice;
      } else {
        const bestVoice = this.getBestVoiceForLanguage(language);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      // Set speech parameters
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      // Event handlers
      utterance.onstart = () => {
        this.state.isSpeaking = true;
        this.state.isPaused = false;
        this.state.currentText = text;
        this.state.currentLanguage = language;
        this.currentUtterance = utterance;
        this.notifyStateChange();
      };

      utterance.onend = () => {
        this.state.isSpeaking = false;
        this.state.isPaused = false;
        this.state.currentText = '';
        this.currentUtterance = null;
        this.notifyStateChange();
        resolve();
      };

      utterance.onerror = (event) => {
        this.state.isSpeaking = false;
        this.state.isPaused = false;
        this.state.currentText = '';
        this.currentUtterance = null;
        this.notifyStateChange();
        
        // Don't reject for interruption errors as they're often expected
        if (event.error === 'interrupted') {
          console.log('TTS interrupted - this is normal when stopping or switching');
          resolve(); // Resolve instead of reject for interruptions
        } else {
          reject(new Error(`Speech synthesis error: ${event.error}`));
        }
      };

      utterance.onpause = () => {
        this.state.isPaused = true;
        this.notifyStateChange();
      };

      utterance.onresume = () => {
        this.state.isPaused = false;
        this.notifyStateChange();
      };

      this.synthesis!.speak(utterance);
    });
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.state.isSpeaking && !this.state.isPaused && this.synthesis) {
      this.synthesis.pause();
      this.notifyStateChange();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.state.isSpeaking && this.state.isPaused && this.synthesis) {
      this.synthesis.resume();
      this.notifyStateChange();
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.state.isSpeaking = false;
    this.state.isPaused = false;
    this.state.currentText = '';
    this.currentUtterance = null;
    this.notifyStateChange();
  }

  /**
   * Convert language code to speech synthesis format
   */
  private getLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'ks': 'ks-Arab', // Kashmiri in Arabic script
      'kashmiri': 'ks-Arab',
      'hindi': 'hi-IN',
      'english': 'en-US',
    };

    return languageMap[language.toLowerCase()] || language;
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    return this.getVoicesForLanguage(language).length > 0;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    const languages = new Set<string>();
    this.state.availableVoices.forEach(voice => {
      const lang = voice.lang.split('-')[0];
      languages.add(lang);
    });
    return Array.from(languages).sort();
  }

  /**
   * Add state change listener
   */
  onStateChange(callback: () => void): void {
    this.stateChangeListeners.push(callback);
  }

  /**
   * Remove state change listener
   */
  offStateChange(callback: () => void): void {
    const index = this.stateChangeListeners.indexOf(callback);
    if (index > -1) {
      this.stateChangeListeners.splice(index, 1);
    }
  }

  /**
   * Notify all state change listeners
   */
  private notifyStateChange(): void {
    this.stateChangeListeners.forEach(callback => callback());
  }
}

// Create singleton instance
export const ttsService = new TTSService();

// Export the class for testing
export { TTSService };
