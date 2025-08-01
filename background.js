// AI Form Solver Background Script - Complete Version
console.log('AI Form Solver: Background script starting...');

// Initialize extension on install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AI Form Solver installed/updated:', details.reason);
  
  // Set default storage values
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    const defaults = {
      geminiApiKey: result.geminiApiKey || '',
      formsProcessed: 0,
      submitPatterns: [],
      lastUsed: Date.now()
    };
    
    chrome.storage.sync.set(defaults, () => {
      console.log('Default settings initialized');
    });
  });
  
  // Create context menu
  try {
    chrome.contextMenus.create({
      id: 'ai-form-solver',
      title: '🤖 Solve this form with AI',
      contexts: ['page', 'frame']
    });
    
    chrome.contextMenus.create({
      id: 'ai-form-detect',
      title: '🔍 Detect form fields',
      contexts: ['page', 'frame']
    });
  } catch (e) {
    console.log('Context menu creation skipped:', e);
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request.action);
  
  switch (request.action) {
    case 'takeScreenshot':
      captureScreenshot(sendResponse);
      return true; // Keep channel open
      
    case 'getApiKeys':
      chrome.storage.sync.get(['openaiApiKey', 'geminiApiKey', 'aiProvider'], (result) => {
        sendResponse({
          openaiApiKey: result.openaiApiKey,
          geminiApiKey: result.geminiApiKey,
          aiProvider: result.aiProvider || 'chatgpt'
        });
      });
      return true;
      
    case 'saveApiKeys':
      chrome.storage.sync.set({
        openaiApiKey: request.openaiApiKey,
        geminiApiKey: request.geminiApiKey,
        aiProvider: request.aiProvider
      }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'incrementFormsProcessed':
      chrome.storage.sync.get(['formsProcessed'], (result) => {
        const count = (result.formsProcessed || 0) + 1;
        chrome.storage.sync.set({ formsProcessed: count }, () => {
          sendResponse({ count });
        });
      });
      return true;
      
    case 'openTab':
      chrome.tabs.create({ url: request.url });
      sendResponse({ success: true });
      break;
      
    default:
      console.log('Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Capture screenshot function
function captureScreenshot(sendResponse) {
  chrome.tabs.captureVisibleTab(null, {
    format: 'jpeg',
    quality: 90
  }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      console.error('Screenshot failed:', chrome.runtime.lastError);
      sendResponse({ 
        success: false, 
        error: chrome.runtime.lastError.message 
      });
    } else {
      console.log('Screenshot captured successfully');
      sendResponse({ 
        success: true, 
        screenshot: dataUrl 
      });
    }
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  
  switch (info.menuItemId) {
    case 'ai-form-solver':
      // Inject content script if needed then solve
      injectAndExecute(tab.id, 'solveForm');
      break;
      
    case 'ai-form-detect':
      // Inject content script if needed then detect
      injectAndExecute(tab.id, 'detectFields');
      break;
  }
});

// Inject content script and execute action
function injectAndExecute(tabId, action) {
  // First inject CSS
  chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ['content.css']
  }, () => {
    // Then inject content script
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }, () => {
      // Wait a moment for script to initialize
      setTimeout(() => {
        // Send the action message
        chrome.tabs.sendMessage(tabId, { action: action }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Message failed:', chrome.runtime.lastError);
          } else {
            console.log('Action completed:', response);
          }
        });
      }, 100);
    });
  });
}

// Monitor tab updates for auto-injection (optional)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a form-heavy site
    const formSites = [
      'docs.google.com/forms',
      'forms.google.com',
      'typeform.com',
      'surveymonkey.com',
      'microsoft.com/forms',
      'jotform.com'
    ];
    
    const isFormSite = formSites.some(site => tab.url.includes(site));
    
    if (isFormSite) {
      console.log('Form site detected:', tab.url);
      // Could auto-inject here if desired
    }
  }
});

// Handle extension icon click (opens popup)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked');
  // Popup will handle this
});

// Keep service worker alive
let keepAlive = setInterval(() => {
  chrome.storage.local.get('lastPing', (result) => {
    chrome.storage.local.set({ lastPing: Date.now() });
  });
}, 20000);

console.log('AI Form Solver: Background script ready!');