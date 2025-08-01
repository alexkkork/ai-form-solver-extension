// Popup script for AI Form Solver extension
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await chrome.storage.sync.get([
    'geminiApiKey', 
    'formsProcessed', 
    'submitPatterns'
  ]);
  
  // Set saved API key
  const apiKeyField = document.getElementById('apiKey');
  if (settings.geminiApiKey) {
    apiKeyField.value = settings.geminiApiKey;
  }
  
  // Update learning status
  document.getElementById('formsProcessed').innerHTML = 
    `<span style="color: #4CAF50;">●</span> Forms processed: <strong>${settings.formsProcessed || 0}</strong>`;
  
  const submitPatterns = settings.submitPatterns || [];
  document.getElementById('submitPattern').innerHTML = 
    `<span style="color: ${submitPatterns.length > 0 ? '#4CAF50' : '#FFC107'};">●</span> Submit pattern: <strong>${submitPatterns.length > 0 ? 'Learned!' : 'Learning...'}</strong>`;



  // Save Settings button
  const saveButton = document.createElement('button');
  saveButton.id = 'saveSettings';
  saveButton.className = 'button';
  saveButton.innerHTML = '<span style="font-size: 16px;">💾</span> Save Settings';
  
  // Insert save button after API key field
  const apiKeyElement = document.getElementById('apiKey');
  apiKeyElement.parentNode.insertBefore(saveButton, apiKeyElement.nextSibling);
  
  saveButton.addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key!', 'error');
      return;
    }
    
    console.log('Saving Gemini API key');
    console.log('API key length:', apiKey.length);
    
    await chrome.storage.sync.set({ geminiApiKey: apiKey });
    showStatus('Settings saved successfully!', 'success');
  });

  // Button event listeners
  document.getElementById('solveForm').addEventListener('click', async () => {
    let apiKey = document.getElementById('apiKey').value.trim();
    
    // API keys are pre-configured, but allow override
    if (!apiKey) {
      // Load from storage if not entered
      const storage = await chrome.storage.sync.get(['geminiApiKey']);
      apiKey = storage.geminiApiKey;
    }

    showStatus('Taking screenshot and analyzing form...', 'info');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script if it's not already there
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        // Also inject CSS
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        });
      } catch (injectError) {
        console.log('Content script already injected or injection failed:', injectError);
      }
      
      // Send message to content script to solve form with timeout
      const response = await sendMessageWithTimeout(tab.id, {
        action: 'solveForm',
        apiKey: apiKey
      }, 30000); // Increased timeout for AI processing
      
      if (response && response.success) {
        showStatus('Form solved successfully!', 'success');
      } else {
        showStatus(`Error: ${response ? response.error : 'No response from content script'}`, 'error');
      }
    } catch (error) {
      console.error('Error in solveForm:', error);
      if (error.message.includes('Could not establish connection')) {
        showStatus('Connection error. Please refresh the page and try again.', 'error');
      } else {
        showStatus(`Error: ${error.message}`, 'error');
      }
    }
  });

  document.getElementById('detectFields').addEventListener('click', async () => {
    showStatus('Detecting form fields...', 'info');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script if needed
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        });
      } catch (injectError) {
        console.log('Content script already injected or injection failed:', injectError);
      }
      
      const response = await sendMessageWithTimeout(tab.id, {
        action: 'detectFields'
      }, 3000);
      
      if (response && response.success) {
        showStatus(`Found ${response.fieldCount} form fields!`, 'success');
      } else {
        showStatus(`Error: ${response ? response.error : 'No response from content script'}`, 'error');
      }
    } catch (error) {
      console.error('Error in detectFields:', error);
      if (error.message.includes('Could not establish connection')) {
        showStatus('Connection error. Please refresh the page and try again.', 'error');
      } else {
        showStatus(`Error: ${error.message}`, 'error');
      }
    }
  });

  document.getElementById('learnSubmit').addEventListener('click', async () => {
    showStatus('Click the submit button on the page to learn its location...', 'info');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script if needed
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        });
      } catch (injectError) {
        console.log('Content script already injected or injection failed:', injectError);
      }
      
      const response = await sendMessageWithTimeout(tab.id, {
        action: 'learnSubmit'
      }, 2000);
      
      if (response && response.success) {
        showStatus('Learning mode activated! Click the submit button.', 'success');
      } else {
        showStatus(`Error: ${response ? response.error : 'No response from content script'}`, 'error');
      }
    } catch (error) {
      console.error('Error in learnSubmit:', error);
      if (error.message.includes('Could not establish connection')) {
        showStatus('Connection error. Please refresh the page and try again.', 'error');
      } else {
        showStatus(`Error: ${error.message}`, 'error');
      }
    }
  });

  // Admin panel access removed - use bottom admin toggle instead

  // Admin login functionality
  document.getElementById('adminToggle').addEventListener('click', () => {
    const adminLogin = document.getElementById('adminLogin');
    adminLogin.style.display = adminLogin.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('adminLoginBtn').addEventListener('click', async () => {
    const passcode = document.getElementById('adminPasscode').value.trim();
    
    if (!passcode) {
      showStatus('Please enter the admin passcode', 'error');
      return;
    }
    
    if (passcode === 'muddyglass29') {
      await chrome.storage.sync.set({ isAdmin: true });
      showStatus('Admin access granted! Opening admin panel...', 'success');
      document.getElementById('reportError').style.display = 'block';
      
      // Open the web admin panel instead of local admin.html
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      let adminUrl = 'https://form-solver-ai-alexkkork123.replit.app/admin';
      
      if (tab.url && tab.url.includes('.replit.app')) {
        const hostname = new URL(tab.url).hostname;
        adminUrl = `https://${hostname}/admin`;
      }
      
      chrome.tabs.create({ url: adminUrl });
    } else {
      showStatus('Invalid passcode', 'error');
    }
  });

  // Error reporting functionality
  document.getElementById('reportError').addEventListener('click', async () => {
    showStatus('Collecting error data...', 'info');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject script to collect console logs
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Capture console logs from the page
          const logs = [];
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          // Override console methods temporarily to capture logs
          const capturedLogs = window.__capturedLogs || [];
          
          return {
            url: window.location.href,
            userAgent: navigator.userAgent,
            logs: capturedLogs.slice(-50), // Last 50 log entries
            timestamp: new Date().toISOString()
          };
        }
      });
      
      const errorData = results[0].result;
      
      // Get extension version
      const manifest = chrome.runtime.getManifest();
      
      // Get the correct backend URL dynamically
      let backendUrl = 'https://form-solver-ai-alexkkork123.replit.app';
      if (tab.url && tab.url.includes('.replit.app')) {
        const hostname = new URL(tab.url).hostname;
        backendUrl = `https://${hostname}`;
      }
      
      // Send error report to backend
      const response = await fetch(`${backendUrl}/api/error-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: errorData.url,
          errorMessage: 'User-reported error',
          consoleLogs: JSON.stringify(errorData.logs),
          userAgent: errorData.userAgent,
          extensionVersion: manifest.version
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        showStatus(`Error reported successfully! ID: ${result.reportId}`, 'success');
      } else {
        showStatus('Failed to report error', 'error');
      }
    } catch (error) {
      console.error('Error reporting failed:', error);
      showStatus(`Failed to report error: ${error.message}`, 'error');
    }
  });

  // Always show the report error button (remove admin requirement)
  document.getElementById('reportError').style.display = 'block';
});

// Utility function to send messages with timeout
function sendMessageWithTimeout(tabId, message, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Message timeout: No response from content script'));
    }, timeoutMs);
    
    chrome.tabs.sendMessage(tabId, message, (response) => {
      clearTimeout(timeout);
      
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';
  
  // Hide after 5 seconds for success/error messages
  if (type !== 'info') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
  }
}