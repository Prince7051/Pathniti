"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳',
  },
  {
    code: 'ks',
    name: 'Kashmiri',
    nativeName: 'کشمیری',
    flag: '🏔️',
  },
];

interface LanguageSelectorProps {
  variant?: 'button' | 'dropdown' | 'compact';
  showFlag?: boolean;
  showNativeName?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'dropdown',
  showFlag = true,
  showNativeName = true,
  className = '',
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setCurrentLanguage(languageCode);
    
    // Store language preference in localStorage
    localStorage.setItem('preferred-language', languageCode);
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  if (variant === 'button') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600">{t('language.current_language')}:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const currentIndex = languages.findIndex(lang => lang.code === currentLanguage);
            const nextIndex = (currentIndex + 1) % languages.length;
            const nextLang = languages[nextIndex];
            handleLanguageChange(nextLang.code);
          }}
          className="flex items-center space-x-2"
        >
          {showFlag && <span>{currentLang.flag}</span>}
          <span>{showNativeName ? currentLang.nativeName : currentLang.name}</span>
        </Button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <Globe className="w-4 h-4 text-gray-600" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => {
            const currentIndex = languages.findIndex(lang => lang.code === currentLanguage);
            const nextIndex = (currentIndex + 1) % languages.length;
            const nextLang = languages[nextIndex];
            handleLanguageChange(nextLang.code);
          }}
        >
          <span className="text-sm">{currentLang.flag}</span>
        </Button>
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Globe className="w-4 h-4 text-gray-600" />
      <div className="relative">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center space-x-2"
          onClick={() => {
            const currentIndex = languages.findIndex(lang => lang.code === currentLanguage);
            const nextIndex = (currentIndex + 1) % languages.length;
            const nextLang = languages[nextIndex];
            handleLanguageChange(nextLang.code);
          }}
        >
          {showFlag && <span>{currentLang.flag}</span>}
          <span>{showNativeName ? currentLang.nativeName : currentLang.name}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default LanguageSelector;
