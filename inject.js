// Khan Academy SMART Answer Guide v3.0.3 - KHAN ACADEMY ONLY
console.log('🚀 Khan Academy SMART Answer Guide v3.0.3 - KHAN ACADEMY EXCLUSIVE');

// Store the original fetch function and extracted answers
const originalFetch = window.fetch;
let KHAN_ANSWERS = [];
window.KHAN_ANSWERS = KHAN_ANSWERS;
window.KHAN_QUESTION_ID = null; // Track current question to prevent mixing answers

// Answer queue to handle pre-loaded answers
let answerQueue = [];
let previousQuestionAnswers = null; // Store answers from previous question

// Track question count for Gemini usage
let questionCount = 0;
const USE_GEMINI_FOR_FIRST_N = 2; // Use Gemini for first 2 questions

// Monitor DOM for question changes - CRITICAL FIX
let lastQuestionContent = '';
const questionObserver = new MutationObserver(() => {
    const currentQuestion = document.querySelector('.paragraph')?.textContent || '';
    if (currentQuestion && currentQuestion !== lastQuestionContent) {
        console.log('📍 Question content changed');
        lastQuestionContent = currentQuestion;
        
        // Clear current display but NOT previousQuestionAnswers
        KHAN_ANSWERS = [];
        window.KHAN_ANSWERS = [];
        
        // Remove ALL overlays and highlights
        const overlays = document.querySelectorAll('#khan-answer-guidance, #khan-answer-guide, .khan-highlight-correct');
        overlays.forEach(overlay => {
            if (overlay.classList && overlay.classList.contains('khan-highlight-correct')) {
                overlay.classList.remove('khan-highlight-correct');
            } else {
                overlay.remove();
            }
        });
    }
});

// Listen for Gemini AI responses
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GEMINI_KHAN_ANSWER') {
        console.log('🤖 Received Gemini answer:', event.data.answer);
        
        // Format the answer as an array if it's not already
        const geminiAnswers = Array.isArray(event.data.answer) ? event.data.answer : [event.data.answer];
        
        // Convert to structured format for numeric answers
        const structuredAnswers = geminiAnswers.map(ans => ({
            type: 'numeric',
            answer: ans
        }));
        
        // Store as answers for THIS question (not previous)
        KHAN_ANSWERS = structuredAnswers;
        window.KHAN_ANSWERS = structuredAnswers;
        
        // Show the answer immediately for the current question
        window.showAnswerGuidance(structuredAnswers);
        
        // Do NOT store as previous answers - this is for the current question
        console.log('💡 Gemini answered current question:', structuredAnswers);
    }
});

// Start observing once DOM is ready
setTimeout(() => {
    if (window.location.hostname.includes('khanacademy.org')) {
        questionObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        console.log('👁️ Question change observer started');
    }
}, 2000);

// Override fetch function - EXACT pattern from working userscript
window.fetch = function () {
    return originalFetch.apply(this, arguments).then(async (res) => {
        // Check if the URL contains getAssessmentItem - EXACT match from userscript
        if (res.url.includes("/getAssessmentItem")) {
            console.log('🎯 Khan Assessment API detected v2.10.34:', res.url);
            
            // Show API detection announcement
            const apiDetectionAnnouncement = document.createElement('div');
            apiDetectionAnnouncement.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: #00BCD4;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 999999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            apiDetectionAnnouncement.innerHTML = `🔍 Khan Academy API Call Detected<br><small>Extracting answers...</small>`;
            document.body.appendChild(apiDetectionAnnouncement);
            setTimeout(() => apiDetectionAnnouncement.remove(), 3000);
            
            const clone = res.clone();
            const json = await clone.json();
            
            console.log('📦 Khan API Response v2.10.34:', json);
            
            // Extract the question data EXACTLY like the userscript
            let item, question;
            
            try {
                item = json.data.assessmentItem.item.itemData;
                question = JSON.parse(item).question;
                console.log('✅ Successfully parsed question data:', question);
                
                // Generate unique question ID from content
                const questionId = question.content ? question.content.substring(0, 50) : Date.now().toString();
                
                // ALWAYS clear when processing a new question
                console.log('🔄 Processing new question - clearing all data');
                KHAN_ANSWERS = [];
                window.KHAN_ANSWERS = [];
                window.KHAN_CURRENT_ANSWERS = null;
                
                // Remove ALL answer overlays
                const overlays = document.querySelectorAll('#khan-answer-guidance, #khan-answer-guide, .khan-highlight-correct');
                overlays.forEach(overlay => {
                    if (overlay.classList) {
                        overlay.classList.remove('khan-highlight-correct');
                    } else {
                        overlay.remove();
                    }
                });
                
                // Set the new question ID
                window.KHAN_QUESTION_ID = questionId;
                console.log('📌 New Question ID:', questionId);
                
            } catch (e) {
                console.error('❌ Error parsing Khan Academy data:', e);
                return res;
            }
            
            if (!question) {
                console.log('⚠️ No question data found');
                return res;
            }
            
            // Extract answers using the EXACT logic from the userscript
            const extractedAnswers = [];
            
            Object.keys(question.widgets).map(widgetName => {
                const widget = question.widgets[widgetName];
                const widgetType = widgetName.split(" ")[0];
                
                console.log(`🔍 Processing widget: ${widgetName}, type: ${widgetType}`);
                
                switch (widgetType) {
                    case "numeric-input":
                    case "input-number":
                        // Free response answers - EXACT userscript logic
                        if (widget.options?.answers) {
                            const answers = widget.options.answers
                                .filter(a => a.status === "correct")
                                .map(a => a.value);
                            answers.forEach(val => {
                                extractedAnswers.push({
                                    type: 'numeric',
                                    answer: val,
                                    widget: widgetName
                                });
                            });
                            console.log(`✅ Numeric answers:`, answers);
                        } else if (widget.options?.value !== undefined) {
                            extractedAnswers.push({
                                type: 'numeric', 
                                answer: widget.options.value,
                                widget: widgetName
                            });
                            console.log(`✅ Numeric value:`, widget.options.value);
                        }
                        break;
                        
                    case "radio":
                        // Multiple choice - Handle text and images like KhanHack
                        if (widget.options?.choices) {
                            const correctChoices = widget.options.choices.filter(c => c.correct);
                            const processedAnswers = [];
                            
                            correctChoices.forEach(choice => {
                                const content = choice.content;
                                console.log(`🔍 Processing choice content:`, content);
                                
                                // Check for images in the content
                                if (content.includes('web+graphie')) {
                                    // Extract web+graphie image URL
                                    const split = content.split('](web+graphie');
                                    const text = split[0].slice(2); // Remove ![
                                    const midUrl = split[1].split(')')[0];
                                    const imageUrl = 'https' + midUrl + '.svg';
                                    
                                    console.log(`📸 Found web+graphie image: ${imageUrl}`);
                                    processedAnswers.push({
                                        type: 'image',
                                        text: text,
                                        url: imageUrl,
                                        original: content
                                    });
                                } else if (content.includes('![')) {
                                    // Extract regular image URL from markdown
                                    const imageUrl = content.slice(content.indexOf('https'), content.lastIndexOf(')'));
                                    
                                    console.log(`📸 Found regular image: ${imageUrl}`);
                                    processedAnswers.push({
                                        type: 'image',
                                        url: imageUrl,
                                        original: content
                                    });
                                } else {
                                    // Regular text answer
                                    processedAnswers.push({
                                        type: 'text',
                                        content: content
                                    });
                                }
                            });
                            
                            if (processedAnswers.length > 0) {
                                extractedAnswers.push({
                                    type: 'multiple_choice',
                                    answer: processedAnswers,
                                    widget: widgetName
                                });
                                console.log(`✅ Multiple choice answers with images:`, processedAnswers);
                            }
                        }
                        break;
                        
                    case "expression":
                        // Expression answers - EXACT userscript logic
                        if (widget.options?.answerForms) {
                            const answers = widget.options.answerForms
                                .filter(a => Object.values(a).includes("correct"))
                                .map(a => a.value);
                            if (answers.length > 0) {
                                extractedAnswers.push({
                                    type: 'expression',
                                    answer: answers,
                                    widget: widgetName
                                });
                                console.log(`✅ Expression answers:`, answers);
                            }
                        }
                        break;
                        
                    case "dropdown":
                        // Dropdown answers - EXACT userscript logic
                        if (widget.options?.choices) {
                            const correctChoices = widget.options.choices
                                .filter(c => c.correct)
                                .map(c => c.content);
                            if (correctChoices.length > 0) {
                                extractedAnswers.push({
                                    type: 'dropdown',
                                    answer: correctChoices,
                                    widget: widgetName
                                });
                                console.log(`✅ Dropdown answers:`, correctChoices);
                            }
                        }
                        break;
                        
                    case "number-line":
                    case "interactive-graph":
                    case "matrix":
                    case "passage":
                    case "image":
                        // Interactive widgets - mark as needing manual interaction
                        console.log(`⚠️ Interactive widget detected: ${widgetType} - requires manual interaction`);
                        extractedAnswers.push({
                            type: 'interactive',
                            answer: 'MANUAL_INTERACTION_REQUIRED',
                            widget: widgetName,
                            widgetType: widgetType
                        });
                        break;
                }
            });
            
            console.log('🎯 FINAL EXTRACTED ANSWERS:', extractedAnswers);
            
            // SIMPLE APPROACH: Just log answers to console and store globally
            if (extractedAnswers.length > 0) {
                // Clear any previous answers to prevent mixing
                window.KHAN_ANSWERS = null;
                KHAN_ANSWERS = extractedAnswers;
                window.KHAN_ANSWERS = KHAN_ANSWERS;
                
                console.log('===============================================');
                console.log('🎯 KHAN ACADEMY ANSWERS EXTRACTED:');
                extractedAnswers.forEach((answer, index) => {
                    console.log(`   ${index + 1}. ${answer.answer} (type: ${answer.type})`);
                });
                console.log('===============================================');
                console.log('💡 Use window.KHAN_ANSWERS to access these answers');
                console.log('💡 Use window.KHAN_FILL() to auto-fill the current form');
                
                // NEW APPROACH: Show PREVIOUS question's answers
                if (window.location.hostname.includes('khanacademy.org')) {
                    // Clear any existing overlays first
                    const existingOverlays = document.querySelectorAll('#khan-answer-guidance, #khan-answer-guide');
                    existingOverlays.forEach(overlay => overlay.remove());
                    
                    // Increment question count when new answers are extracted
                    questionCount++;
                    console.log(`📊 Question #${questionCount} detected`);
                    
                    // REDESIGNED LOGIC: Use Gemini for first 2 questions, then "one behind" system
                    if (questionCount <= USE_GEMINI_FOR_FIRST_N) {
                        console.log(`🤖 Using Gemini AI for question #${questionCount} (first ${USE_GEMINI_FOR_FIRST_N} questions)`);
                        
                        // Show announcement in overlay
                        const announcement = document.createElement('div');
                        announcement.style.cssText = `
                            position: fixed;
                            top: 100px;
                            right: 20px;
                            background: #2196F3;
                            color: white;
                            padding: 15px 20px;
                            border-radius: 8px;
                            font-size: 16px;
                            z-index: 999999;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        `;
                        announcement.innerHTML = `🤖 Using Gemini AI for Question #${questionCount}`;
                        document.body.appendChild(announcement);
                        setTimeout(() => announcement.remove(), 3000);
                        
                        // For the first N questions, always use Gemini AI
                        setTimeout(() => {
                            window.callGeminiForCurrentQuestion();
                        }, 1000);
                    } else if (previousQuestionAnswers && previousQuestionAnswers.length > 0) {
                        console.log('📚 SWITCHING TO INTERCEPTED ANSWER SYSTEM - Previous question answers available:', previousQuestionAnswers);
                        
                        // Show announcement for system switch
                        const switchAnnouncement = document.createElement('div');
                        switchAnnouncement.style.cssText = `
                            position: fixed;
                            top: 100px;
                            right: 20px;
                            background: #4CAF50;
                            color: white;
                            padding: 15px 20px;
                            border-radius: 8px;
                            font-size: 16px;
                            z-index: 999999;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        `;
                        switchAnnouncement.innerHTML = `📚 Switched to Intercepted Answer System (Like KhanHack)<br><small>Showing answers from previous question</small>`;
                        document.body.appendChild(switchAnnouncement);
                        setTimeout(() => switchAnnouncement.remove(), 5000);
                        
                        // Check if previous answers match current question type
                        const hasMultipleChoice = document.querySelectorAll('input[type="radio"]').length > 0;
                        const hasNumericInput = document.querySelectorAll('input[type="text"], input[type="number"]').length > 0;
                        
                        // Get current question content for better matching
                        const currentQuestionText = document.querySelector('.paragraph')?.textContent?.toLowerCase() || '';
                        
                        // Detect question types more intelligently
                        const isFractionQuestion = currentQuestionText.includes('fraction') || 
                                                  currentQuestionText.includes('of') && currentQuestionText.includes('/');
                        const isAreaQuestion = currentQuestionText.includes('area') || currentQuestionText.includes('region');
                        const isMultiplicationQuestion = currentQuestionText.includes('multiply') || currentQuestionText.includes('×');
                        const isDivisionQuestion = currentQuestionText.includes('divide') || currentQuestionText.includes('÷');
                        
                        // Filter previous answers based on question context
                        const matchingPreviousAnswers = previousQuestionAnswers.filter(answer => {
                            // For "choose all that apply" questions, ONLY show multiple choice answers
                            const isCheckAllThatApply = currentQuestionText.includes('choose all');
                            
                            // Don't show numeric answers from basic arithmetic on fraction/area questions
                            if ((isFractionQuestion || isAreaQuestion) && hasMultipleChoice) {
                                // Only show multiple choice answers for these questions
                                return answer.type === 'multiple_choice';
                            }
                            
                            if (isCheckAllThatApply || hasMultipleChoice) {
                                return answer.type === 'multiple_choice';
                            }
                            
                            if (hasNumericInput && !hasMultipleChoice) {
                                // Check if the answer value makes sense for the question
                                const answerValue = String(answer.answer);
                                
                                // Don't show large numbers on fraction questions
                                if (isFractionQuestion && parseInt(answerValue) > 100) {
                                    return false;
                                }
                                
                                return answer.type === 'numeric' || answer.type === 'numeric-input';
                            }
                            
                            return false;
                        });
                        
                        if (matchingPreviousAnswers.length > 0) {
                            console.log('✅ Showing matching previous answers:', matchingPreviousAnswers);
                            setTimeout(() => {
                                window.showAnswerGuidance(matchingPreviousAnswers);
                            }, 1000);
                        } else {
                            console.log('⚠️ Previous answers don\'t match current question type');
                            console.log('Question type:', hasMultipleChoice ? 'Multiple Choice' : 'Numeric');
                            console.log('Previous answers:', previousQuestionAnswers.map(a => ({ type: a.type, answer: a.answer })));
                            
                            // IMPORTANT: After question 2, ALWAYS show intercepted answers regardless of type match
                            // This is the whole point of the hybrid system - use intercepted answers after initial questions
                            console.log('📚 Showing ALL previous answers (hybrid system active)');
                            
                            // Show announcement about using all answers
                            const allAnswersAnnouncement = document.createElement('div');
                            allAnswersAnnouncement.style.cssText = `
                                position: fixed;
                                top: 160px;
                                right: 20px;
                                background: #FF9800;
                                color: white;
                                padding: 15px 20px;
                                border-radius: 8px;
                                font-size: 14px;
                                z-index: 999999;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            `;
                            allAnswersAnnouncement.innerHTML = `⚠️ Showing all intercepted answers<br><small>Look for the one that matches your question</small>`;
                            document.body.appendChild(allAnswersAnnouncement);
                            setTimeout(() => allAnswersAnnouncement.remove(), 4000);
                            
                            // Show ALL previous answers, let the user pick the right one
                            setTimeout(() => {
                                window.showAnswerGuidance(previousQuestionAnswers);
                            }, 1000);
                        }
                    } else {
                        console.log('⚠️ No previous answers available yet');
                        
                        // After question 2, we should have intercepted answers
                        // If not available, show a message instead of calling Gemini
                        if (questionCount > USE_GEMINI_FOR_FIRST_N) {
                            const noAnswersAnnouncement = document.createElement('div');
                            noAnswersAnnouncement.style.cssText = `
                                position: fixed;
                                top: 100px;
                                right: 20px;
                                background: #F44336;
                                color: white;
                                padding: 15px 20px;
                                border-radius: 8px;
                                font-size: 16px;
                                z-index: 999999;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            `;
                            noAnswersAnnouncement.innerHTML = `❌ No intercepted answers available<br><small>Try refreshing the page</small>`;
                            document.body.appendChild(noAnswersAnnouncement);
                            setTimeout(() => noAnswersAnnouncement.remove(), 5000);
                        } else {
                            // For questions 1-2, use Gemini as planned
                            setTimeout(() => {
                                window.callGeminiForCurrentQuestion();
                            }, 1000);
                        }
                    }
                    
                    // Now store current answers for the NEXT question
                    previousQuestionAnswers = extractedAnswers;
                    console.log('💾 Stored current answers for next question:', extractedAnswers);
                    
                    // Show big announcement when answers are intercepted
                    const interceptedAnnouncement = document.createElement('div');
                    interceptedAnnouncement.style.cssText = `
                        position: fixed;
                        top: 200px;
                        right: 20px;
                        background: #9C27B0;
                        color: white;
                        padding: 20px 25px;
                        border-radius: 10px;
                        font-size: 18px;
                        z-index: 999999;
                        box-shadow: 0 6px 20px rgba(0,0,0,0.4);
                        border: 2px solid white;
                    `;
                    interceptedAnnouncement.innerHTML = `
                        <div style="font-weight: bold; margin-bottom: 10px;">🎯 ANSWERS INTERCEPTED!</div>
                        <div style="font-size: 14px;">
                            ${extractedAnswers.length} answer(s) captured from Khan API<br>
                            Type: ${extractedAnswers.map(a => a.type).join(', ')}<br>
                            Values: ${extractedAnswers.map(a => Array.isArray(a.answer) ? a.answer.join(', ') : a.answer).join(', ')}<br>
                            <small style="opacity: 0.8;">These will show on the NEXT question</small>
                        </div>
                    `;
                    document.body.appendChild(interceptedAnnouncement);
                    setTimeout(() => interceptedAnnouncement.remove(), 7000);
                }
                    
                // Auto-fill after 3 seconds if enabled
                const autoFillEnabled = false; // Disabled by default for safety
                if (autoFillEnabled) {
                    setTimeout(() => {
                        window.KHAN_FILL();
                    }, 3000);
                }
            }
        }
        
        return res;
    });
};

// KHAN ACADEMY AUTO-FILL FUNCTION
window.KHAN_FILL = function() {
    // Only work on Khan Academy
    if (!window.location.hostname.includes('khanacademy.org')) {
        console.log('📍 Not on Khan Academy - auto-fill disabled');
        return;
    }
    
    console.log('🚀 AUTO-FILLING KHAN ACADEMY FORM WITH:', window.KHAN_ANSWERS);
    
    if (!window.KHAN_ANSWERS || window.KHAN_ANSWERS.length === 0) {
        console.log('❌ NO ANSWERS AVAILABLE TO FILL');
        return;
    }
    
    let answerIndex = 0;
    const answers = window.KHAN_ANSWERS;
    
    // Fill math inputs (numeric answers)
    const mathInputs = document.querySelectorAll('input[type="text"], .perseus-math-input input, input.perseus-math-input');
    console.log(`📝 Found ${mathInputs.length} math input fields`);
    
    mathInputs.forEach((input, index) => {
        if (answerIndex < answers.length) {
            const answer = answers[answerIndex];
            if (answer.type === 'numeric' || answer.type === 'numeric-input') {
                console.log(`✏️ Filling math input ${index} with: ${answer.answer}`);
                input.value = answer.answer;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                answerIndex++;
            }
        }
    });
    
    // Fill multiple choice (radio buttons)
    answers.forEach((answer, index) => {
        if (answer.type === 'multiple_choice' && answer.answer.length > 0) {
            const choiceText = answer.answer[0];
            console.log(`🔘 Looking for multiple choice: ${choiceText}`);
            
            const radioButtons = document.querySelectorAll('input[type="radio"]');
            radioButtons.forEach((radio) => {
                const label = radio.parentElement.textContent || radio.nextElementSibling?.textContent || '';
                if (label.includes(choiceText) || choiceText.includes(label)) {
                    console.log(`✅ Clicking radio button: ${label}`);
                    radio.click();
                }
            });
        }
    });
    
    // Auto-click Check button
    setTimeout(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const checkButton = buttons.find(btn => btn.textContent.toLowerCase().includes('check'));
        if (checkButton) {
            console.log('🎯 Clicking Check button');
            checkButton.click();
        }
    }, 1000);
};

// Visual Guidance System - Show correct answers with indicators (Khan Academy only)
window.showAnswerGuidance = function(answers) {
    // Only work on Khan Academy
    if (!window.location.hostname.includes('khanacademy.org')) {
        console.log('📍 Not on Khan Academy - guidance disabled');
        return;
    }
    
    console.log('🎯 SHOWING KHAN ACADEMY ANSWER GUIDANCE (from previous question)');
    
    if (!answers || answers.length === 0) {
        console.log('⚠️ No answers to display');
        return;
    }
    
    // CRITICAL: Clear any existing overlay first
    const existingOverlay = document.getElementById('khan-answer-guidance');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Get current question content to verify we're showing answers for the right question
    const currentQuestionText = document.querySelector('.paragraph')?.textContent || '';
    const questionType = currentQuestionText.toLowerCase();
    
    // Check answer type against question type
    const hasMultipleChoice = document.querySelectorAll('input[type="radio"]').length > 0;
    const hasNumericInput = document.querySelectorAll('input[type="text"], input[type="number"]').length > 0;
    
    // Handle both structured answers (from Khan intercept) and simple arrays (from Gemini)
    let processedAnswers = answers;
    
    // If answers are simple strings/numbers, convert them to structured format
    if (answers.length > 0 && (typeof answers[0] === 'string' || typeof answers[0] === 'number')) {
        processedAnswers = answers.map(ans => ({
            type: hasMultipleChoice ? 'multiple_choice' : 'numeric',
            answer: ans
        }));
        console.log('📋 Converted simple answers to structured format:', processedAnswers);
    }
    
    // STRICT FILTERING: Only show answers that match current question type
    const matchingAnswers = processedAnswers.filter(answer => {
        // For multiple choice questions, ONLY show multiple choice answers
        if (hasMultipleChoice && !hasNumericInput) {
            return answer.type === 'multiple_choice';
        }
        // For numeric input questions, ONLY show numeric answers
        if (hasNumericInput && !hasMultipleChoice) {
            return answer.type === 'numeric' || answer.type === 'numeric-input';
        }
        // For mixed questions (both types), match appropriately
        if (hasMultipleChoice && answer.type === 'multiple_choice') return true;
        if (hasNumericInput && (answer.type === 'numeric' || answer.type === 'numeric-input')) return true;
        if (answer.type === 'dropdown') return true;
        return false;
    });
    
    if (matchingAnswers.length === 0) {
        console.log('⚠️ No matching answers for current question type');
        console.log('Current question has:', { hasMultipleChoice, hasNumericInput });
        console.log('Available answers:', processedAnswers.map(a => ({ type: a.type, answer: a.answer })));
        return;
    }
    
    // Check if this is an image-based question
    const hasImageQuestion = questionType.includes('which image') || 
                           questionType.includes('which picture') ||
                           questionType.includes('which diagram') ||
                           document.querySelector('.perseus-renderer img') !== null;
    
    // Create guidance overlay
    const existingGuide = document.getElementById('khan-answer-guide');
    if (existingGuide) existingGuide.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'khan-answer-guide';
    overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(76, 175, 80, 0.95);
        color: white;
        padding: 20px;
        border-radius: 12px;
        font-family: -apple-system, sans-serif;
        font-size: 16px;
        z-index: 999999;
        max-width: 350px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .khan-highlight-correct {
            position: relative !important;
            background-color: rgba(76, 175, 80, 0.2) !important;
            outline: 3px solid #4CAF50 !important;
            outline-offset: 3px !important;
            animation: pulse 1.5s infinite !important;
        }
        
        .khan-highlight-correct::before {
            content: "✅ CORRECT ANSWER" !important;
            position: absolute !important;
            top: -25px !important;
            left: 0 !important;
            background: #4CAF50 !important;
            color: white !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            font-weight: bold !important;
            z-index: 99999 !important;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    // Helper to render math formulas
    function renderMath(text) {
        if (!text) return text;
        
        // Ensure text is a string
        if (typeof text !== 'string') {
            text = String(text);
        }
        
        // First, remove color commands like \greenD{}, \redC{}, \purpleD{}, \goldD{}, etc.
        text = text.replace(/\\[a-zA-Z]+[A-Z]\{([^}]+)\}/g, '$1');
        
        // Remove LaTeX formatting that's hard to read
        text = text.replace(/\\begin\{align\}/g, '')
                   .replace(/\\end\{align\}/g, '')
                   .replace(/\\overset\{[^}]*\}/g, '')
                   .replace(/\\underline\{([^}]+)\}/g, '$1')
                   .replace(/\&/g, '')
                   .replace(/\\\\/g, ' ')
                   .replace(/\\phantom\{[^}]*\}/g, '')
                   .replace(/\{,\}/g, ',');
        
        // Replace LaTeX math expressions with readable format
        return text
            .replace(/\$([^$]+)\$/g, (match, math) => {
                // Simple LaTeX to readable conversion
                return math
                    .replace(/\\dfrac{([^}]+)}{([^}]+)}/g, '($1/$2)')
                    .replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1/$2)')
                    .replace(/\\times/g, '×')
                    .replace(/\\div/g, '÷')
                    .replace(/\\cdot/g, '·')
                    .replace(/\\sqrt{([^}]+)}/g, '√($1)')
                    .replace(/\\pi/g, 'π')
                    .replace(/\s+/g, ' ');
            })
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    // Helper to convert decimal to fraction
    function decimalToFraction(decimal) {
        if (isNaN(decimal)) return decimal;
        
        const num = parseFloat(decimal);
        if (Number.isInteger(num)) return num.toString();
        
        // Common fractions
        const commonFractions = {
            '0.5': '1/2',
            '0.333333': '1/3',
            '0.666666': '2/3',
            '0.25': '1/4',
            '0.75': '3/4',
            '0.2': '1/5',
            '0.4': '2/5',
            '0.6': '3/5',
            '0.8': '4/5',
            '0.166666': '1/6',
            '0.833333': '5/6',
            '0.142857': '1/7',
            '0.125': '1/8',
            '0.375': '3/8',
            '0.625': '5/8',
            '0.875': '7/8'
        };
        
        // Check common fractions
        const decStr = num.toFixed(6);
        for (const [dec, frac] of Object.entries(commonFractions)) {
            if (decStr.includes(dec)) {
                const whole = Math.floor(num);
                if (whole > 0) {
                    return `${whole} ${frac}`;
                }
                return frac;
            }
        }
        
        // Algorithm to find fraction
        let tolerance = 1.0E-6;
        let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
        let b = num;
        
        do {
            let a = Math.floor(b);
            let aux = h1;
            h1 = a * h1 + h2;
            h2 = aux;
            aux = k1;
            k1 = a * k1 + k2;
            k2 = aux;
            b = 1 / (b - a);
        } while (Math.abs(num - h1 / k1) > num * tolerance && k1 < 1000);
        
        if (k1 === 1) return h1.toString();
        return `${h1}/${k1}`;
    }
    
    // Build guidance content
    let content = '<h3 style="margin: 0 0 15px 0;">📚 Khan Academy Answers (Powered by Gemini AI)</h3>';
    
    // Helper to identify which input field
    function getInputLocation(index, type) {
        const inputFields = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
        if (inputFields[index]) {
            const label = inputFields[index].closest('.perseus-renderer')?.querySelector('.paragraph')?.textContent || 
                         inputFields[index].getAttribute('aria-label') || 
                         `Input Field #${index + 1}`;
            return label.substring(0, 50) + (label.length > 50 ? '...' : '');
        }
        return `Field #${index + 1}`;
    }
    
    matchingAnswers.forEach((answer, index) => {
        if (answer.type === 'multiple_choice' && answer.answer.length > 0) {
            content += `<div style="margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px;">`;
            content += `<strong>Multiple Choice Answer:</strong><br>`;
            
            // Check if answer contains images
            let displayContent = '';
            let hasImage = false;
            
            // Handle structured answers with image detection from KhanHack style
            if (Array.isArray(answer.answer)) {
                console.log('🎨 Processing array answer:', answer.answer);
                answer.answer.forEach(item => {
                    if (typeof item === 'object' && item.type === 'image') {
                        hasImage = true;
                        console.log('🖼️ Found image item:', item);
                        displayContent += `<div style="margin: 10px 0;">`;
                        if (item.text) {
                            displayContent += `<div style="margin-bottom: 5px; color: white;">${item.text}</div>`;
                        }
                        displayContent += `<img src="${item.url}" style="max-width: 200px; max-height: 200px; border-radius: 8px; display: block; background: white; padding: 5px;">`;
                        displayContent += `</div>`;
                    } else if (typeof item === 'object' && item.type === 'text') {
                        displayContent += renderMath(item.content);
                    } else {
                        // Simple string answer
                        displayContent += renderMath(String(item));
                    }
                });
            } else {
                // Simple answer format
                displayContent = renderMath(String(answer.answer[0] || answer.answer));
            }
            
            const displayAnswer = hasImage ? 'Image Answer' : displayContent;
            
            // Find which letter option (A, B, C, D) this corresponds to immediately
            let letterOption = '';
            const radioButtons = document.querySelectorAll('input[type="radio"]');
            let matchFound = false;
            
            if (!hasImage) {
                radioButtons.forEach((radio, radioIndex) => {
                    const labelElement = radio.closest('label') || radio.parentElement;
                    const labelText = labelElement?.textContent || '';
                    // Clean up the text for comparison
                    const cleanLabel = labelText.trim().replace(/^[A-Z]\)\s*/, '');
                    const cleanAnswer = String(displayContent).trim();
                    if (cleanLabel && cleanAnswer && (cleanLabel.includes(cleanAnswer) || cleanAnswer.includes(cleanLabel))) {
                        letterOption = String.fromCharCode(65 + radioIndex); // A, B, C, D...
                        matchFound = true;
                    }
                });
            }
            
            // If no match found, this answer doesn't belong to this question
            if (!matchFound && !hasImageQuestion) {
                console.log('⚠️ Answer does not match any option in current question, skipping display');
                return;
            }
            setTimeout(() => {
                const radioButtons = document.querySelectorAll('input[type="radio"]');
                let foundIndex = -1;
                
                // For image questions, try to match based on position
                if (hasImageQuestion) {
                    // Just highlight based on position since we can't match text
                    radioButtons.forEach((radio, radioIndex) => {
                        if (radioIndex === 0) { // Highlight first option for now
                            const labelElement = radio.closest('label') || radio.parentElement;
                            labelElement.classList.add('khan-highlight-correct');
                            letterOption = String.fromCharCode(65 + radioIndex);
                            console.log(`🖼️ Image question - highlighting option ${letterOption}`);
                        }
                    });
                } else {
                    // Regular text matching
                    radioButtons.forEach((radio, radioIndex) => {
                        const label = radio.parentElement?.textContent || '';
                        const labelElement = radio.closest('label') || radio.parentElement;
                        
                        if (label.includes(answer.answer[0]) || answer.answer[0].includes(label.trim())) {
                            foundIndex = radioIndex;
                            letterOption = String.fromCharCode(65 + foundIndex); // Convert to A, B, C, D
                            labelElement.classList.add('khan-highlight-correct');
                            console.log(`✅ Highlighted correct answer: ${label} (Option ${letterOption})`);
                            
                            // Update the display with the letter
                            const displayDiv = document.querySelector(`#mc-answer-${index}`);
                            if (displayDiv && !hasImageQuestion) {
                                displayDiv.innerHTML = `✅ Choose: <span style="color: #FFE082; font-weight: bold; font-size: 24px; font-family: 'Courier New', monospace;">Option ${letterOption}</span><br><span style="font-size: 14px;">${displayAnswer}</span>`;
                            }
                        }
                    });
                }
            }, 500);
            
            // Check if this is an image-based question or answer contains images
            if (hasImageQuestion || hasImage) {
                content += `<div id="mc-answer-${index}">`;
                if (hasImage) {
                    content += `<div style="color: #FFE082; font-weight: bold; margin-bottom: 5px;">📸 Image Answer:</div>`;
                    content += displayContent; // This already contains the formatted image HTML
                } else {
                    content += `<div style="color: #FFE082; font-weight: bold; margin-bottom: 5px;">🖼️ This is an image-based question</div>`;
                    content += `<div style="font-size: 14px; color: #B0BEC5;">Look at each option carefully and select the one that matches:</div>`;
                    content += `<div style="color: #FFE082; font-weight: bold; font-family: 'Courier New', monospace; margin-top: 5px;">${displayAnswer}</div>`;
                }
                content += `</div>`;
            } else {
                // Show letter option (A, B, C, D) if available
                if (letterOption) {
                    content += `<div id="mc-answer-${index}">✅ Choose: <span style="color: #FFE082; font-weight: bold; font-size: 24px; font-family: 'Courier New', monospace;">Option ${letterOption}</span><br><span style="font-size: 14px;">${displayContent}</span></div>`;
                } else {
                    content += `<div id="mc-answer-${index}">✅ Choose: <span style="color: #FFE082; font-weight: bold; font-family: 'Courier New', monospace;">${displayContent}</span></div>`;
                }
            }
            content += `</div>`;
            
        } else if (answer.type === 'numeric' || answer.type === 'numeric-input' || answer.type === 'expression') {
            content += `<div style="margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px;">`;
            const location = getInputLocation(index, answer.type);
            content += `<strong>Numeric Answer #${index + 1}</strong> <span style="font-size: 12px; color: #B0BEC5;">(${location})</span><br>`;
            
            // Convert decimal to fraction if needed
            let displayValue = answer.answer;
            if (typeof displayValue === 'string' && displayValue.match(/^\d*\.\d+$/)) {
                const fractionValue = decimalToFraction(displayValue);
                content += `✅ Enter: <span style="color: #FFE082; font-weight: bold; font-family: 'Courier New', monospace;">${fractionValue}</span>`;
                if (fractionValue !== displayValue) {
                    content += ` <span style="font-size: 12px; color: #B0BEC5;">(${displayValue})</span>`;
                }
            } else {
                content += `✅ Enter: <span style="color: #FFE082; font-weight: bold; font-family: 'Courier New', monospace;">${renderMath(displayValue)}</span>`;
            }
            content += `</div>`;
        } else if (answer.type === 'dropdown') {
            content += `<div style="margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px;">`;
            content += `<strong>Dropdown #${index + 1}:</strong><br>`;
            const displayAnswer = renderMath(answer.answer[0]);
            content += `✅ Select: <span style="color: #FFE082; font-weight: bold; font-family: 'Courier New', monospace;">${displayAnswer}</span>`;
            content += `<div style="font-size: 12px; margin-top: 4px; color: #B0BEC5;">📝 Click the dropdown menu and select this option</div>`;
            content += `</div>`;
        } else if (answer.type === 'expression') {
            content += `<div style="margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px;">`;
            content += `<strong>Expression/Embedded #${index + 1}:</strong><br>`;
            if (answer.answer?.value) {
                content += `✅ Type: <span style="color: #FFE082; font-weight: bold; font-family: 'Courier New', monospace;">${renderMath(answer.answer.value)}</span>`;
                content += `<div style="font-size: 12px; margin-top: 4px; color: #B0BEC5;">📝 Look for an input field within the question area and type this value</div>`;
            } else {
                const answerText = typeof answer.answer === 'string' ? answer.answer : String(answer.answer);
                content += `✅ Answer: <span style="color: #FFE082; font-weight: bold; font-family: 'Courier New', monospace;">${renderMath(answerText)}</span>`;
            }
            content += `</div>`;
        }
    });
    
    content += `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3);">`;
    content += `<button id="khan-auto-fill-btn" style="background: white; color: #4CAF50; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%;">🚀 Auto-Fill Answers</button>`;
    content += `</div>`;
    
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    
    // Add auto-fill button functionality
    document.getElementById('khan-auto-fill-btn')?.addEventListener('click', () => {
        window.KHAN_FILL();
        overlay.style.background = 'rgba(33, 150, 243, 0.95)';
        overlay.innerHTML = '<h3 style="margin: 0;">✅ Answers Filled!</h3><p style="margin: 10px 0 0 0;">Check button will be clicked automatically...</p>';
        setTimeout(() => overlay.remove(), 3000);
    });
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (document.getElementById('khan-answer-guide')) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    }, 30000);
};

// Function to call Gemini for the first question
window.callGeminiForCurrentQuestion = async function() {
    console.log('🤖 Calling Gemini AI for first question...');
    
    // Get the current question content
    const questionElement = document.querySelector('.paragraph');
    if (!questionElement) {
        console.log('❌ No question found');
        return;
    }
    
    const questionText = questionElement.textContent;
    console.log('📝 Question:', questionText);
    
    // Create a loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'khan-answer-guide';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(76, 175, 80, 0.95);
        color: white;
        padding: 20px;
        border-radius: 12px;
        font-family: -apple-system, sans-serif;
        font-size: 16px;
        z-index: 999999;
        max-width: 350px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease-out;
    `;
    
    loadingOverlay.innerHTML = `
        <h3 style="margin: 0 0 15px 0;">🤖 Gemini AI Processing...</h3>
        <div style="color: #FFE082;">Analyzing first question with AI</div>
        <div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">
            This only happens for the first question. Subsequent questions will use intercepted answers.
        </div>
    `;
    
    document.body.appendChild(loadingOverlay);
    
    // Send message to content script to call Gemini
    window.postMessage({
        type: 'CALL_GEMINI_FOR_KHAN',
        question: questionText
    }, '*');
};

console.log('✅ Khan Academy SMART Answer Guide v3.0.3 ready');
console.log('💡 First question uses Gemini AI');
console.log('💡 Subsequent questions show previous answers');
console.log('💡 Manual trigger: window.KHAN_FILL()');
console.log('💡 Show guidance: window.showAnswerGuidance(window.KHAN_ANSWERS)');

// Khan API integration - Remove chrome.runtime dependency
(function() {
    if (window.location.hostname.includes('khanacademy.org')) {
        console.log('📡 Khan Academy detected - Answer system active');
        // Show green overlay immediately
        const welcomeOverlay = document.createElement('div');
        welcomeOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(76, 175, 80, 0.1);
            pointer-events: none;
            z-index: 99999;
            animation: fadeIn 0.5s ease-out;
        `;
        document.body.appendChild(welcomeOverlay);
        
        // Add fade animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Remove overlay after 2 seconds
        setTimeout(() => welcomeOverlay.remove(), 2000);
        
        // Show welcome message
        const welcomeMsg = document.createElement('div');
        welcomeMsg.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.95);
            color: white;
            padding: 15px 30px;
            border-radius: 30px;
            font-family: -apple-system, sans-serif;
            font-size: 16px;
            font-weight: bold;
            z-index: 999999;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            animation: slideDown 0.5s ease-out;
        `;
        welcomeMsg.textContent = '✅ Khan Academy Smart Answer System Active (First Q: Gemini AI)';
        document.body.appendChild(welcomeMsg);
        
        style.textContent += `
            @keyframes slideDown {
                from { transform: translate(-50%, -100%); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }
        `;
        
        setTimeout(() => welcomeMsg.remove(), 3000);
    }
})();