// Configuration file for AI Form Solver Extension
// Only define CONFIG if it doesn't already exist to prevent redeclaration errors
if (typeof window.CONFIG === 'undefined') {
  window.CONFIG = {
    // OpenAI API Key - Get from: https://platform.openai.com/api-keys
    OPENAI_API_KEY: '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',
    
    // Gemini API Key - Get from: https://aistudio.google.com/app/apikey
    GEMINI_API_KEY: 'AIzaSyBR478JqRvOIm2Odo-CCq5qwTb3dIMdGHM',
    
    // Default AI provider
    DEFAULT_AI_PROVIDER: 'chatgpt'
  };
}

// Only initialize storage in background script context, not content scripts
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled && typeof window.isContentScript === 'undefined') {
  try {
    chrome.runtime.onInstalled.addListener(() => {
      chrome.storage.sync.set({
        'openaiApiKey': window.CONFIG.OPENAI_API_KEY,
        'geminiApiKey': window.CONFIG.GEMINI_API_KEY,
        'aiProvider': window.CONFIG.DEFAULT_AI_PROVIDER
      });
    });
  } catch (error) {
    console.log('Storage initialization skipped in content script context');
  }
}