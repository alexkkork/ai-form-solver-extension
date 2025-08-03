// Khan Academy API Integration for Extension
// This integrates with the backend API for answer verification

const KHAN_API_BASE = 'https://form-solver-ai-alexkkork123.replit.app/api/khan';

// Modified userscript that sends to API
const KHAN_API_USERSCRIPT = `
// ==UserScript==
// @name         Khan Academy Bot with API
// @version      2.0
// @description  Sends answers to verification API
// @author       AI Form Solver Extension
// @match        https://www.khanacademy.org/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';
    
    const API_BASE = '${KHAN_API_BASE}';
    let submissionQueue = [];
    let questionCounter = 0;
    let currentQuestionHash = '';
    let answerCache = new Map(); // Cache answers by question hash

    // Generate hash for question to uniquely identify it
    function hashQuestion(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    // Helper to send data to API
    async function sendToAPI(endpoint, data) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: API_BASE + endpoint,
                headers: {
                    "Content-Type": "application/json"
                },
                data: JSON.stringify(data),
                onload: function(response) {
                    try {
                        resolve(JSON.parse(response.responseText));
                    } catch (e) {
                        resolve({ success: false, error: e.message });
                    }
                },
                onerror: function() {
                    resolve({ success: false, error: "Network error" });
                }
            });
        });
    }

    // Capture screenshot using browser API
    function captureScreenshot() {
        return new Promise((resolve) => {
            // Send message to extension to capture screenshot
            window.postMessage({ 
                type: 'KHAN_CAPTURE_SCREENSHOT',
                timestamp: Date.now()
            }, '*');
            
            // Wait for response
            const handler = (event) => {
                if (event.data.type === 'KHAN_SCREENSHOT_RESULT') {
                    window.removeEventListener('message', handler);
                    resolve(event.data.screenshot);
                }
            };
            
            window.addEventListener('message', handler);
            
            // Timeout after 2 seconds
            setTimeout(() => {
                window.removeEventListener('message', handler);
                resolve(null);
            }, 2000);
        });
    }

    // Extract question text
    function extractQuestionText() {
        const selectors = [
            '.paragraph',
            '[data-test-id="question-area"] p',
            '.perseus-renderer > div > p',
            '.framework-perseus p'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                return Array.from(elements).map(el => el.textContent).join(' ').trim();
            }
        }
        return '';
    }

    // Override fetch to intercept Khan API calls
    const originalFetch = unsafeWindow.fetch;
    unsafeWindow.fetch = function () {
        return originalFetch.apply(this, arguments).then(async (res) => {
            if (res.url.includes("/getAssessmentItem")) {
                const clone = res.clone();
                const json = await clone.json();
                
                try {
                    const item = json.data.assessmentItem.item.itemData;
                    const question = JSON.parse(item).question;
                    
                    if (!question) return res;
                    
                    // Wait a bit for DOM to fully load
                    setTimeout(async () => {
                        // Try multiple times to get question text
                        let questionText = '';
                        let attempts = 0;
                        
                        while ((!questionText || questionText.length < 10) && attempts < 5) {
                            questionText = extractQuestionText();
                            if (!questionText || questionText.length < 10) {
                                await new Promise(resolve => setTimeout(resolve, 200));
                                attempts++;
                            }
                        }
                        
                        if (!questionText || questionText.length < 10) {
                            console.log('❌ Could not extract question text after', attempts, 'attempts');
                            return;
                        }
                        
                        const screenshot = await captureScreenshot();
                        
                        // Generate hash for current question
                        const questionHash = hashQuestion(questionText);
                        console.log('📝 Question extracted:', questionText.substring(0, 50) + '...', 'Hash:', questionHash);
                        
                        // If this is a new question, clear old data
                        if (currentQuestionHash !== questionHash) {
                            currentQuestionHash = questionHash;
                            console.log('🔄 New question detected, hash:', questionHash);
                        }
                        
                        // Check if we have cached answer for this exact question
                        if (answerCache.has(questionHash)) {
                            const cachedAnswer = answerCache.get(questionHash);
                            console.log('✅ Found cached answer for question:', questionHash);
                            displayAnswer(cachedAnswer);
                            return;
                        }
                        
                        // Always check if we have a matching answer using Gemini verification
                        const matchResponse = await sendToAPI('/match', {
                            question: questionText,
                            screenshot: screenshot,
                            questionHash: questionHash
                        });
                        
                        if (matchResponse.found) {
                            console.log('✅ Found matching answer:', matchResponse);
                            // Cache and display the matched answer
                            answerCache.set(questionHash, matchResponse);
                            displayAnswer(matchResponse);
                            return;
                        } else {
                            console.log('❌ No matching answer found, will use Gemini when available');
                        }
                        
                        // Process widgets and extract answers
                        const answers = [];
                        Object.keys(question.widgets).forEach(widgetName => {
                            const widget = question.widgets[widgetName];
                            const widgetType = widgetName.split(" ")[0];
                            
                            switch (widgetType) {
                                case "radio":
                                    if (widget.options?.choices) {
                                        const correct = widget.options.choices
                                            .filter(c => c.correct)
                                            .map(c => c.content);
                                        if (correct.length > 0) {
                                            answers.push({
                                                type: 'multiple_choice',
                                                answer: correct,
                                                widget: widgetName
                                            });
                                        }
                                    }
                                    break;
                                    
                                case "numeric-input":
                                case "input-number":
                                    if (widget.options?.answers) {
                                        const correct = widget.options.answers
                                            .filter(a => a.status === "correct")
                                            .map(a => a.value);
                                        if (correct.length > 0) {
                                            answers.push({
                                                type: 'numeric',
                                                answer: correct[0],
                                                widget: widgetName
                                            });
                                        }
                                    }
                                    break;
                                    
                                case "expression":
                                    if (widget.options?.answerForms) {
                                        const correct = widget.options.answerForms
                                            .filter(a => a.status === "correct")
                                            .map(a => a.value);
                                        if (correct.length > 0) {
                                            answers.push({
                                                type: 'expression',
                                                answer: correct,
                                                widget: widgetName
                                            });
                                        }
                                    }
                                    break;
                                    
                                case "dropdown":
                                    if (widget.options?.choices) {
                                        const correct = widget.options.choices
                                            .filter(c => c.correct)
                                            .map(c => c.content);
                                        if (correct.length > 0) {
                                            answers.push({
                                                type: 'dropdown',
                                                answer: correct,
                                                widget: widgetName
                                            });
                                        }
                                    }
                                    break;
                            }
                        });
                        
                        // Submit intercepted answers to backend
                        if (answers.length > 0) {
                            console.log('📦 Submitting intercepted answers for matching...');
                            
                            const submission = {
                                question: questionText,
                                answers: answers,
                                screenshot: screenshot,
                                questionHash: questionHash,
                                interceptedData: true,
                                metadata: {
                                    questionCounter: questionCounter++,
                                    url: window.location.href,
                                    timestamp: Date.now()
                                }
                            };
                            
                            // Send to API for smart matching
                            const response = await sendToAPI('/submit', submission);
                            
                            if (response.matched && response.displayNow) {
                                // This answer matches the current question!
                                console.log('✅ Intercepted answer matches current question!');
                                const displayData = {
                                    found: true,
                                    answer: response.answer,
                                    type: response.type,
                                    confidence: response.confidence
                                };
                                answerCache.set(questionHash, displayData);
                                displayAnswer(displayData);
                            } else if (response.storedForLater) {
                                console.log('📦 Answers stored for future matching');
                            }
                        }
                        
                        // Clean up old cache entries (keep last 20)
                        if (answerCache.size > 20) {
                            const entries = Array.from(answerCache.entries());
                            const toDelete = entries.slice(0, entries.length - 20);
                            toDelete.forEach(([key]) => answerCache.delete(key));
                        }
                    }, 1500); // Increased timeout for better DOM loading
                    
                } catch (error) {
                    console.error("Error processing Khan response:", error);
                }
            }
            
            return res;
        });
    };
    
    // Display answer helper
    function displayAnswer(response) {
        console.log('%c🎯 VERIFIED ANSWER FOUND!', 'color: #4CAF50; font-size: 20px; font-weight: bold;');
        console.log('Answer:', response.answer);
        console.log('Type:', response.type);
        console.log('Confidence:', response.confidence);
        
        // Set the answer globally
        window.KHAN_ANSWERS = [{
            type: response.type,
            answer: Array.isArray(response.answer) ? response.answer : [response.answer]
        }];
        
        // Trigger the extension's visual display
        if (window.showAnswerGuidance) {
            window.showAnswerGuidance(window.KHAN_ANSWERS);
        } else {
            console.warn('showAnswerGuidance not available yet, trying again in 1 second...');
            setTimeout(() => {
                if (window.showAnswerGuidance) {
                    window.showAnswerGuidance(window.KHAN_ANSWERS);
                }
            }, 1000);
        }
    }
    
    console.log('✅ Khan Academy API Bot loaded - sending to verification backend');
    console.log('🔄 Using question hashing to prevent answer offset issues');
})();
`;

// Function to inject the API userscript
function injectKhanAPIScript() {
  const script = document.createElement('script');
  script.textContent = KHAN_API_USERSCRIPT;
  script.id = 'khan-api-userscript';
  (document.head || document.documentElement).appendChild(script);
  script.remove();
  
  console.log('📡 Khan API userscript injected');
}

// Check if we're on Khan Academy and inject if needed
if (window.location.hostname.includes('khanacademy.org')) {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectKhanAPIScript);
  } else {
    injectKhanAPIScript();
  }
}

// Export for use in extension
window.khanAPI = {
  checkAnswer: async (question) => {
    try {
      const response = await fetch(`${KHAN_API_BASE}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error checking answer:', error);
      return { success: false, error: error.message };
    }
  },
  
  submitAnswer: async (data) => {
    try {
      const response = await fetch(`${KHAN_API_BASE}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Error submitting answer:', error);
      return { success: false, error: error.message };
    }
  }
};