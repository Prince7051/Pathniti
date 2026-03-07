# Multilingual & TTS Quick Start Guide

## 🚀 Getting Started

The PathNiti application now includes multilingual support (English/Hindi) and text-to-speech functionality. This guide will help you get up and running quickly.

## 📋 Prerequisites

- Node.js 18+ installed
- Modern browser with Web Speech API support
- Development server running (`npm run dev`)

## 🌐 Language Features

### Current Languages
- **English** (en) - Default language
- **Hindi** (hi) - हिंदी support

### Language Selector
The language selector is available in:
- **Desktop**: Top-right corner of the header
- **Mobile**: In the mobile menu

### How to Switch Languages
1. Click the language selector (globe icon)
2. Choose your preferred language
3. The entire interface updates instantly
4. Your preference is saved for future visits

## 🔊 Text-to-Speech Features

### TTS Controls
TTS buttons appear next to main headings and can be used to:
- **Play**: Start reading the text
- **Pause**: Pause the current speech
- **Stop**: Stop and reset the speech

### Supported Content
- Main page headings
- Feature descriptions
- Navigation elements
- Any text wrapped with TTS component

### Browser Compatibility
- ✅ Chrome/Edge (Full support)
- ✅ Safari (Full support)
- ✅ Firefox (Full support)
- ⚠️ Mobile browsers (Limited voices)

## 🛠️ For Developers

### Adding New Text with Translation

1. **Add to translation files**:
   ```json
   // src/lib/locales/en.json
   {
     "my_section": {
       "new_text": "Hello World"
     }
   }
   
   // src/lib/locales/hi.json
   {
     "my_section": {
       "new_text": "नमस्ते दुनिया"
     }
   }
   ```

2. **Use in component**:
   ```typescript
   import { useTranslation } from '@/hooks/useTranslation';
   
   function MyComponent() {
     const { t } = useTranslation();
     return <h1>{t('my_section.new_text')}</h1>;
   }
   ```

### Adding TTS to Text

```typescript
import { TextToSpeech } from '@/components/TextToSpeech';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>
        {t('my_section.new_text')}
        <TextToSpeech 
          text={t('my_section.new_text')}
          variant="inline"
        />
      </h1>
    </div>
  );
}
```

### Adding New Language

1. **Create translation file**: `src/lib/locales/[code].json`
2. **Update i18n config**: Add to `src/lib/i18n.ts`
3. **Update language selector**: Add to `src/components/LanguageSelector.tsx`

## 🧪 Testing

### Manual Testing
1. **Language Switching**:
   - Switch between English and Hindi
   - Verify all text updates
   - Check mobile menu

2. **TTS Functionality**:
   - Click TTS buttons on headings
   - Test play/pause/stop
   - Verify language-specific voices

3. **Responsive Design**:
   - Test on different screen sizes
   - Check mobile language selector
   - Verify TTS button positioning

### Browser Testing
- Chrome: Full TTS support
- Safari: Full TTS support  
- Firefox: Full TTS support
- Mobile: Limited voice options

## 🐛 Troubleshooting

### TTS Not Working?
- Check browser compatibility
- Ensure microphone permissions
- Try refreshing the page

### Translations Not Loading?
- Check browser console for errors
- Verify JSON syntax in translation files
- Clear browser cache

### Language Not Saving?
- Check if localStorage is enabled
- Try in incognito/private mode
- Clear browser data

## 📱 Mobile Support

### Language Selector
- Available in mobile menu
- Touch-friendly interface
- Persistent selection

### TTS on Mobile
- Works on iOS Safari
- Works on Android Chrome
- Limited voice options
- May require user interaction

## 🎯 Best Practices

### For Content
- Keep translations consistent
- Use clear, simple language
- Test with native speakers

### For TTS
- Use TTS for important headings
- Keep TTS text concise
- Test voice quality

### For Performance
- Lazy load translation files
- Cache voice data
- Optimize bundle size

## 📚 Additional Resources

- [Full Implementation Guide](./MULTILINGUAL_TTS_IMPLEMENTATION.md)
- [React i18next Documentation](https://react.i18next.com/)
- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## 🤝 Contributing

To add new languages or improve TTS functionality:

1. Follow the implementation guide
2. Test thoroughly on multiple browsers
3. Ensure mobile compatibility
4. Update documentation

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review browser console for errors
- Test in different browsers
- Contact the development team

---

**Happy coding! 🎉**

The multilingual and TTS features are now ready to use. Start exploring the language selector and TTS controls to see the implementation in action.
