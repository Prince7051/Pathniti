/**
 * Simple test script to verify multilingual and TTS functionality
 * Run this in the browser console on the homepage
 */

console.log('🧪 Testing Multilingual and TTS Implementation');

// Test 1: Check if i18n is loaded
console.log('1. Testing i18n initialization...');
if (typeof window !== 'undefined' && window.i18next) {
  console.log('✅ i18next is loaded');
  console.log('Current language:', window.i18next.language);
  console.log('Available languages:', window.i18next.languages);
} else {
  console.log('❌ i18next not found');
}

// Test 2: Check if TTS service is available
console.log('2. Testing TTS service...');
if (typeof window !== 'undefined' && window.speechSynthesis) {
  console.log('✅ Web Speech API is available');
  console.log('Available voices:', window.speechSynthesis.getVoices().length);
} else {
  console.log('❌ Web Speech API not available');
}

// Test 3: Check if language selector is present
console.log('3. Testing language selector...');
const languageSelector = document.querySelector('[data-testid="language-selector"]') || 
                        document.querySelector('button[class*="globe"]') ||
                        document.querySelector('button:has(svg)');
if (languageSelector) {
  console.log('✅ Language selector found');
} else {
  console.log('❌ Language selector not found');
}

// Test 4: Check if TTS buttons are present
console.log('4. Testing TTS buttons...');
const ttsButtons = document.querySelectorAll('button[class*="play"], button[class*="volume"]');
if (ttsButtons.length > 0) {
  console.log(`✅ Found ${ttsButtons.length} TTS buttons`);
} else {
  console.log('❌ No TTS buttons found');
}

// Test 5: Test language switching
console.log('5. Testing language switching...');
if (window.i18next) {
  const currentLang = window.i18next.language;
  const newLang = currentLang === 'en' ? 'hi' : 'en';
  
  console.log(`Switching from ${currentLang} to ${newLang}`);
  window.i18next.changeLanguage(newLang).then(() => {
    console.log('✅ Language switched successfully');
    console.log('New language:', window.i18next.language);
  }).catch(err => {
    console.log('❌ Language switch failed:', err);
  });
}

// Test 6: Test TTS functionality
console.log('6. Testing TTS functionality...');
if (window.speechSynthesis) {
  const utterance = new SpeechSynthesisUtterance('Hello, this is a test of the text-to-speech functionality.');
  utterance.onstart = () => console.log('✅ TTS started');
  utterance.onend = () => console.log('✅ TTS completed');
  utterance.onerror = (e) => console.log('❌ TTS error:', e.error);
  
  window.speechSynthesis.speak(utterance);
} else {
  console.log('❌ TTS not available');
}

console.log('🎉 Test completed! Check the results above.');
