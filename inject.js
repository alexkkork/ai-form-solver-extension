// Simple Khan Academy Extension - Shows CURRENT question answers only

console.log('🚀 Khan Academy SIMPLE Answer Guide v4.0 - FIXED VERSION');

// IMMEDIATE TEST - Show green overlay to verify extension is working
if (window.location.hostname.includes('khanacademy.org')) {
    console.log('✅ Khan Academy detected - showing test overlay');
    
    // Create immediate test overlay
    const testOverlay = document.createElement('div');
    testOverlay.id = 'test-extension-overlay';
    testOverlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 999999;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    testOverlay.innerHTML = `
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">✅ Extension Loaded!</div>
        <div>Khan Academy detected. Extension is working.</div>
        <button onclick="this.parentElement.remove()" style="background: white; color: #4CAF50; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Close</button>
    `;
    
    document.body.appendChild(testOverlay);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (document.getElementById('test-extension-overlay')) {
            testOverlay.remove();
        }
    }, 10000);
} else {
    console.log('❌ Not on Khan Academy - hostname:', window.location.hostname);
}

// Global variables
let questionCount = parseInt(localStorage.getItem('khan_question_count') || '0');
let KHAN_ANSWERS = [];
        window.KHAN_ANSWERS = [];
        
const USE_GEMINI_FOR_FIRST_N = 2;
const originalFetch = window.fetch;

// Override fetch to intercept Khan API
window.fetch = function () {
    return originalFetch.apply(this, arguments).then(async (res) => {
        if (res.url.includes("/getAssessmentItem")) {
            console.log('🎯 Khan API detected:', res.url);
            
            // For first 2 questions, use Gemini
            if (questionCount < USE_GEMINI_FOR_FIRST_N) {
                questionCount++;
                localStorage.setItem('khan_question_count', questionCount.toString());
                console.log(`🤖 Question ${questionCount} - Using Gemini`);
                
                // Call Gemini for current question
                setTimeout(() => {
                    const questionText = document.querySelector('.paragraph')?.textContent || '';
                    if (questionText) {
                        console.log('📝 Calling Gemini for:', questionText.substring(0, 100));
                        // Send to content.js for Gemini processing
                        window.postMessage({
                            type: 'CALL_GEMINI_FOR_KHAN',
                            question: questionText
                        }, '*');
                    }
                }, 1000);
                
                return res;
            }
            
            // For questions 3+, extract answers from Khan API
            console.log(`📡 Question ${questionCount + 1} - Using Khan API`);
            questionCount++;
            localStorage.setItem('khan_question_count', questionCount.toString());
            
            const clone = res.clone();
            const json = await clone.json();
            
            // Extract answers from Khan API response
            const extractedAnswers = [];
            
            try {
                const item = json.data?.assessmentItem?.item;
                const question = item?.itemData;
                
                if (question?.widgets) {
                    Object.entries(question.widgets).forEach(([widgetId, widget]) => {
                        if (widget.type === 'numeric-input' || widget.type === 'input-number') {
                            const answer = widget.options?.answers?.[0]?.value;
                            if (answer !== undefined) {
                                extractedAnswers.push({
                                    type: 'numeric',
                                    answer: answer
                                });
                                console.log(`✅ Extracted numeric answer: ${answer}`);
                            }
                        } else if (widget.type === 'radio') {
                            const correctChoice = widget.options?.choices?.find(choice => choice.correct);
                            if (correctChoice) {
                                extractedAnswers.push({
                                    type: 'multiple_choice',
                                    answer: [correctChoice]
                                });
                                console.log(`✅ Extracted multiple choice answer:`, correctChoice);
                            }
                        } else if (widget.type === 'dropdown') {
                            const correctChoice = widget.options?.choices?.find(choice => choice.correct);
                            if (correctChoice) {
                                extractedAnswers.push({
                                    type: 'dropdown',
                                    answer: [correctChoice.content]
                                });
                                console.log(`✅ Extracted dropdown answer: ${correctChoice.content}`);
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Error extracting answers:', error);
            }
            
            // Store answers globally
            KHAN_ANSWERS = extractedAnswers;
            window.KHAN_ANSWERS = extractedAnswers;
            
            console.log('🎯 CURRENT QUESTION ANSWERS:', extractedAnswers);
            
            // ALWAYS show current question answers (not previous ones!)
            if (extractedAnswers.length > 0) {
                        setTimeout(() => {
                    window.showAnswerGuidance(extractedAnswers);
                }, 500);
            }
        }
        
        return res;
    });
};

// Listen for Gemini responses
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GEMINI_KHAN_ANSWER') {
        console.log('🤖 Received Gemini answer:', event.data.answer);
        
        const geminiAnswers = [{
            type: 'numeric',
            answer: event.data.answer[0] || event.data.answer
        }];
        
        KHAN_ANSWERS = geminiAnswers;
        window.KHAN_ANSWERS = geminiAnswers;
        
        // Show Gemini answers
        setTimeout(() => {
            window.showAnswerGuidance(geminiAnswers);
        }, 500);
    }
});

// Simple answer display function
window.showAnswerGuidance = function(answers) {
    if (!answers || answers.length === 0) {
        console.log('⚠️ No answers to display');
        return;
    }
    
    console.log('🎯 SHOWING ANSWERS:', answers);
    
    // Remove existing overlay
    const existing = document.getElementById('khan-answer-guide');
    if (existing) existing.remove();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'khan-answer-guide';
    overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 999999;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    let content = `<div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">📚 Khan Academy Answers</div>`;
    
    answers.forEach((answer, index) => {
        if (answer.type === 'numeric') {
            content += `<div style="margin-bottom: 8px;">✅ Enter: <strong>${answer.answer}</strong></div>`;
        } else if (answer.type === 'multiple_choice') {
            content += `<div style="margin-bottom: 8px;">✅ Choose: <strong>A</strong></div>`;
        } else if (answer.type === 'dropdown') {
            content += `<div style="margin-bottom: 8px;">✅ Select: <strong>${answer.answer[0]}</strong></div>`;
        }
    });
    
    content += `<button onclick="window.KHAN_FILL()" style="background: white; color: #4CAF50; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-top: 10px; width: 100%;">🚀 Auto-Fill</button>`;
    
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (document.getElementById('khan-answer-guide')) {
            overlay.remove();
        }
    }, 30000);
};

// Simple auto-fill function
window.KHAN_FILL = function() {
    if (!window.KHAN_ANSWERS || window.KHAN_ANSWERS.length === 0) {
        console.log('❌ No answers to fill');
        return;
    }
    
    console.log('🚀 Auto-filling...');
    
    window.KHAN_ANSWERS.forEach((answer) => {
        if (answer.type === 'numeric') {
            const input = document.querySelector('input[type="text"], input[type="number"]');
            if (input) {
                input.value = answer.answer;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                console.log(`✅ Filled: ${answer.answer}`);
            }
        } else if (answer.type === 'multiple_choice') {
            const radio = document.querySelector('input[type="radio"]');
            if (radio) {
                radio.click();
                console.log('✅ Selected first option');
            }
        }
    });
    
    // Click check button
    setTimeout(() => {
        const checkButton = document.querySelector('[data-test-id="exercise-check-answer-button"]');
        if (checkButton) {
            checkButton.click();
            console.log('✅ Clicked check button');
        }
    }, 500);
};

console.log('✅ Simple Khan Academy extension loaded!');
console.log('💡 This version shows CURRENT question answers only');

// Integration with Enhanced KhanHack
setTimeout(() => {
    if (window.EnhancedKhanHack) {
        console.log('🔗 Enhanced KhanHack detected - Integration active');
        
        // Show integration notification
        const integrationNotice = document.createElement('div');
        integrationNotice.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 999998;
            max-width: 320px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.2);
        `;
        integrationNotice.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">🚀 Enhanced KhanHack Loaded!</div>
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">
                ✅ Full UI with Smart Answer Cycling<br>
                🤖 BETA Auto-Answer System<br>
                🌾 BETA Point Farmer<br>
                👻 Ghost Mode Available
            </div>
            <div style="font-size: 11px; opacity: 0.7; text-align: center; margin-top: 8px;">
                Check bottom-left corner for main menu
            </div>
        `;
        
        document.body.appendChild(integrationNotice);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (integrationNotice.parentNode) {
                integrationNotice.style.opacity = '0';
                integrationNotice.style.transform = 'translateX(100%)';
                integrationNotice.style.transition = 'all 0.5s ease';
                setTimeout(() => integrationNotice.remove(), 500);
            }
        }, 8000);
        
        // Coordinate with enhanced module
        window.addEventListener('khanhack-answer-extracted', (event) => {
            console.log('📨 Enhanced KhanHack extracted answer:', event.detail);
            // Could display in our simple overlay too if needed
        });
        
    } else {
        console.log('⚠️ Enhanced KhanHack not detected - running in simple mode');
    }
}, 2000);