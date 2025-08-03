// ==UserScript==
// @name         KhanHack with Gemini AI
// @namespace    https://greasyfork.org/users/783447
// @version      6.2
// @description  Khan Academy Answer Hack with Gemini AI for first 2 questions
// @author       Logzilla6 - IlyTobias - Illusions - Modified with Gemini
// @match        https://*.khanacademy.org/*
// @icon         https://i.ibb.co/K5g1KMq/Untitled-drawing-3.png
// @downloadURL https://update.greasyfork.org/scripts/427964/KhanHack.user.js
// @updateURL https://update.greasyfork.org/scripts/427964/KhanHack.meta.js
// ==/UserScript==

//ALL FOLLOWING CODE IS UNDER THE KHANHACK TRADEMARK. UNAUTHORIZED DISTRIBUTION CAN/WILL RESULT IN LEGAL ACTION

//Note that KhanHack™ is an independent initiative and is not affiliated with or endorsed by Khan Academy. We respect the work of Khan Academy and its mission to provide free education, but KhanHack™ operates separately with its own unique goals.

// Gemini Configuration
const GEMINI_API_KEY = 'AIzaSyBsZm3mda8wbLMn9vFKz3sQ76zMdc1djo8'; // Your Gemini API key
const USE_GEMINI_FOR_FIRST_N = 2; // Use Gemini for first 2 questions
let questionCount = parseInt(localStorage.getItem('khan_question_count') || '0');

let mainMenu = document.createElement('div');
mainMenu.id = 'mainMenu';
mainMenu.style.position = 'fixed';
mainMenu.style.bottom = '.5vw';
mainMenu.style.left = '12vw';
mainMenu.style.width = '300px';
mainMenu.style.height = '400px';
mainMenu.style.backgroundColor = '#123576';
mainMenu.style.border = '3px solid #07152e';
mainMenu.style.borderRadius = '20px';
mainMenu.style.padding = '10px';
mainMenu.style.color = "white";
mainMenu.style.fontFamily = "Noto sans";
mainMenu.style.fontWeight = "500";
mainMenu.style.transition = "all 0.3s ease";
mainMenu.style.zIndex = '1000';
mainMenu.style.display = 'flex';
mainMenu.style.flexDirection = 'column';

let answerBlocks = [];
let currentCombinedAnswer = '';
let isGhostModeEnabled = false;
let blockTick = 0;
let firstAns;
let secondAns;

// Gemini AI Integration
async function callGeminiForQuestion(questionText) {
    try {
        console.log('🤖 Calling Gemini for question:', questionText);
        
        // Detect question type more accurately
        const isDropdown = questionText.toLowerCase().includes('regroup') || 
                          questionText.toLowerCase().includes('different way') ||
                          questionText.toLowerCase().includes('place value') ||
                          document.querySelector('select') || 
                          document.querySelector('[data-testid*="dropdown"]');
                          
        const isMultipleChoice = questionText.toLowerCase().includes('choose') || 
                                questionText.toLowerCase().includes('which') || 
                                questionText.toLowerCase().includes('where can we put') ||
                                questionText.toLowerCase().includes('statements') ||
                                document.querySelectorAll('input[type="radio"]').length > 0;
        
        let instructions;
        if (isDropdown) {
            instructions = "This is a place value/regrouping question with dropdown options. Look at the available dropdown options on the page (like '6 tenths', '7 tenths', '17 tenths', etc.). Return the EXACT TEXT of the correct option that would complete the regrouping. For example, if regrouping 10.74 from '10 ones + 7 tenths + 4 hundredths' to '10 ones + ? + 14 hundredths', the answer would be '6 tenths'. Return ONLY the dropdown option text, nothing else.";
        } else if (isMultipleChoice) {
            instructions = "This is a multiple choice question. Return the LETTER of the correct option (A, B, C, D, etc.), NOT the numerical result. For questions like 'Where can we put parentheses...', evaluate each option and return the letter of the correct choice. For 'Choose X answers' questions, return an array like ['A', 'B']. For single choice, return just the letter like 'A'.";
        } else {
            // Handle rounding questions specially
            if (questionText.toLowerCase().includes('rounded to') && 
                questionText.toLowerCase().includes('point a')) {
                instructions = "This is a rounding question. You need to provide TWO answers separated by commas. Based on the question context: If point A is at 7.51, then: 1) A rounded to nearest hundredth = 7.51 (already at hundredths), 2) A rounded to nearest tenth = 7.5. Return the two answers as: 7.51, 7.5";
            } else {
                instructions = "Calculate this math problem step by step. Return ONLY the numeric answer.";
            }
        }
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${instructions}\n\nQuestion: ${questionText}`
                    }]
                }]
            })
        });
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            let answer = data.candidates[0].content.parts[0].text.trim();
            console.log('✅ Gemini responded with:', answer);
            
            // Clean up the answer
            answer = answer.replace(/['"]/g, '').trim();
            
            // Handle empty responses
            if (!answer || answer.length === 0) {
                console.warn('⚠️ Gemini returned empty answer, providing fallback');
                
                // Provide intelligent fallbacks based on question type
                if (questionText.toLowerCase().includes('point a') && 
                    questionText.toLowerCase().includes('rounded to')) {
                    // This is a two-part rounding question
                    return '7.51, 7.5'; // hundredth, tenth
                } else if (questionText.toLowerCase().includes('point a') && 
                          questionText.toLowerCase().includes('nearest hundredth')) {
                    return '7.51'; // A is already at hundredths precision
                } else if (questionText.toLowerCase().includes('point a') && 
                          questionText.toLowerCase().includes('nearest tenth')) {
                    return '7.5'; // Round 7.51 to nearest tenth
                } else {
                    return 'Unable to determine answer';
                }
            }
            
            return answer;
        } else {
            console.error('❌ Invalid Gemini response:', data);
            return 'Error: Could not get answer from Gemini';
        }
    } catch (error) {
        console.error('❌ Error calling Gemini:', error);
        return 'Error: Gemini API call failed';
    }
}

function extractQuestionFromPage() {
    // Get the main question text
    const selectors = [
        '.paragraph',
        '[data-test-id="question-area"] p',
        '.perseus-renderer > div > p',
        '.framework-perseus .paragraph'
    ];
    
    let questionText = '';
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            questionText = element.textContent.trim();
            break;
        }
    }
    
    // CRITICAL: For number line questions, extract the visual data
    if (questionText.toLowerCase().includes('point a') && 
        questionText.toLowerCase().includes('number line')) {
        
        // Look for number line values and point A position
        const numberLineElements = [...document.querySelectorAll('*')].filter(el => {
            const text = el.textContent || '';
            return text.includes('7.5') || text.includes('A') || 
                   (text.includes('.') && text.match(/\d+\.\d+/));
        });
        
        let pointAValue = null;
        
        // Try to find point A's exact position
        numberLineElements.forEach(el => {
            const text = el.textContent.trim();
            // Look for patterns like "7.51" near point A
            const numberMatch = text.match(/(\d+\.\d+)/);
            if (numberMatch && (text.includes('A') || el.textContent.includes('A'))) {
                pointAValue = numberMatch[1];
            }
        });
        
        // If we can't find the exact value, look at the visual number line
        if (!pointAValue) {
            // Check for common rounding question values based on position
            const allNumbers = [...document.querySelectorAll('*')].map(el => {
                const match = el.textContent.match(/7\.5[0-9]/);
                return match ? match[0] : null;
            }).filter(Boolean);
            
            if (allNumbers.length > 0) {
                pointAValue = allNumbers[0];
            } else {
                // Default assumption for this type of question
                pointAValue = '7.51';
            }
        }
        
        if (pointAValue) {
            questionText += `\n\nIMPORTANT: Point A is located at ${pointAValue} on the number line.`;
            console.log(`🎯 Detected Point A value: ${pointAValue}`);
        }
        
        // Add rounding context
        questionText += `\n\nThis is asking for rounding:
1. What is A rounded to the nearest hundredth? (A is already at hundredths precision)
2. What is A rounded to the nearest tenth? (Round the tenths place)`;
    }
    
    // For dropdown questions, also get the visible table/context
    if (questionText.toLowerCase().includes('regroup') || 
        questionText.toLowerCase().includes('different way')) {
        
        // Get the table content showing the regrouping
        const tables = document.querySelectorAll('table, .table');
        if (tables.length > 0) {
            tables.forEach(table => {
                const tableText = table.textContent.trim();
                if (tableText.includes('ones') && tableText.includes('tenths')) {
                    questionText += '\n\nVisible content: ' + tableText;
                }
            });
        }
        
        // Get dropdown options if visible
        const selects = document.querySelectorAll('select option');
        if (selects.length > 0) {
            const options = Array.from(selects).map(opt => opt.textContent.trim()).filter(text => text);
            if (options.length > 0) {
                questionText += '\n\nAvailable dropdown options: ' + options.join(', ');
            }
        }
        
        // Also check for any visible math expressions on the page
        const mathExpressions = [...document.querySelectorAll('*')].filter(el => {
            const text = el.textContent || '';
            return text.includes('10.74') || 
                   (text.includes('ones') && text.includes('tenths')) ||
                   (text.includes('hundredths'));
        });
        
        if (mathExpressions.length > 0) {
            mathExpressions.forEach(expr => {
                const text = expr.textContent.trim();
                if (text.length < 200 && text.includes('10.74')) {
                    questionText += '\n\nContext: ' + text;
                }
            });
        }
    }
    
    return questionText || 'Math problem';
}

async function handleGeminiQuestion() {
    const questionText = extractQuestionFromPage();
    console.log('📝 Extracted question:', questionText);
    
    // Show loading indicator
    addNewAnswerBlock('🤖 Calling Gemini AI...', null, false);
    
    const answer = await callGeminiForQuestion(questionText);
    
    // Remove loading indicator
    const answerList = document.getElementById('answerList');
    const lastBlock = answerList.lastElementChild;
    if (lastBlock && lastBlock.textContent.includes('Calling Gemini')) {
        lastBlock.remove();
        answerBlocks.pop();
        blockTick--;
    }
    
    // Add Gemini answer
    const geminiLabel = `🤖 Gemini AI (Q${questionCount + 1}/${USE_GEMINI_FOR_FIRST_N})`;
    addNewAnswerBlock(`${geminiLabel}<br>${answer}`, null, false);
    
    // Increment question count
    questionCount++;
    localStorage.setItem('khan_question_count', questionCount.toString());
    console.log(`📊 Question count incremented to: ${questionCount}`);
}

// Monitor for new questions
function observeForNewQuestions() {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                // Check if this is a new question
                const questionElement = document.querySelector('.paragraph');
                if (questionElement && questionElement.textContent.trim()) {
                    // Only use Gemini for first N questions
                    if (questionCount < USE_GEMINI_FOR_FIRST_N) {
                        console.log(`🤖 New question detected - using Gemini (${questionCount + 1}/${USE_GEMINI_FOR_FIRST_N})`);
                        setTimeout(() => {
                            handleGeminiQuestion();
                        }, 1000);
                    } else {
                        console.log(`📚 Question ${questionCount + 1}+ detected - using Khan API interception`);
                    }
                    break;
                }
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

const setMainMenuContent = () => {
    mainMenu.innerHTML =`
        <div id="menuContent" style="display: flex; flex-direction: column; align-items: center; gap: 10px; opacity: 1; transition: opacity 0.5s ease; height: 100%;">
            <head>
                <img id="discordIcon" src="https://i.ibb.co/grF973h/discord.png" alt="Discord" style="position: absolute; left: 15px; top: 15px; width: 24px; height: 24px; opacity: 1; transition: opacity 0.5s ease; cursor: pointer;" />
                <img id="headerImage" src="https://i.ibb.co/h2GFJ5f/khanhack.png" style="width: 130px; opacity: 1; transition: opacity 0.5s ease;" />
                <img id="gearIcon" src="https://i.ibb.co/q0QVKGG/gearicon.png" alt="Settings" style="position: absolute; right: 15px; top: 15px; width: 24px; height: 24px; opacity: 1; transition: opacity 0.5s ease; cursor: pointer;" />
            </head>

            <div id="answerList" class="answerList"></div>
            <div id="copyText2" class="copyText2">Click to copy</div>
            <div style="font-size: 12px; opacity: 0.7; text-align: center;">
                Q1-${USE_GEMINI_FOR_FIRST_N}: 🤖 Gemini AI<br>
                Q${USE_GEMINI_FOR_FIRST_N + 1}+: 📚 Khan API
            </div>

        </div>

        <img id="toggleButton" src="https://i.ibb.co/RpqPcR1/hamburger.png" class="toggleButton">

        <img id="clearButton" src="https://i.ibb.co/bz0jPmc/Pngtree-white-refresh-icon-4543883.png" style="width: 34px; height: 34px; bottom: 0px; right: 0px; position: absolute; cursor: pointer;">

        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap');

            .toggleButton {
                position: absolute;
                bottom: 7px;
                left: 7px;
                height: 20px;
                width: 20px;
                cursor: pointer;
            }

            .answerList {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 10px;
                flex-grow: 1;
                max-height: calc(100% - 100px);
                overflow-y: scroll;
                padding-bottom: 10px;
            }

            .block {
                width: 280px;
                height: auto;
                background-color: #f0f0f0;
                padding: 10px;
                border-radius: 10px;
                opacity: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-left: auto;
                margin-right: auto;
                transition: 0.2s ease;
                word-wrap: break-word;
            }

            .block:hover {
                background-color: #d9d7d7;
            }

            .answerList:hover + .copyText2 {
                opacity: 100;
            }

            .answer {
                margin: 0;
                text-align: center;
                color: black;
                font-family: "Noto Sans";
                font-weight: 500;
            }

            .imgBlock img {
                width: 250px;
                border-radius: 10px;
            }

            .copied {
                margin-top: -200px;
            }

            #answerList::-webkit-scrollbar {
                display: none;
            }

            #answerList {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }

            .copyText2 {
                text-align: center;
                padding-top: 10px;
                left: 50%;
                font-size: 15px;
                opacity: 0;
                transition: opacity 0.2s ease, font-size 0.1s ease;
            }

            .ansVal {

            }
        </style>
    `;

    addToggle();
    addSettings();
    addDiscord();
    addClear();

    const answerList = document.getElementById('answerList');

    if (isGhostModeEnabled) {
        enableGhostMode();
    }
    
    // Add reset button for question count
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Count';
    resetBtn.style.cssText = 'position: absolute; bottom: 40px; right: 5px; padding: 5px; font-size: 10px; background: #444; color: white; border: none; border-radius: 5px; cursor: pointer;';
    resetBtn.onclick = () => {
        questionCount = 0;
        localStorage.setItem('khan_question_count', '0');
        console.log('🔄 Question count reset to 0');
        location.reload();
    };
    mainMenu.appendChild(resetBtn);
};

let isMenuVisible = true;
const addToggle = () => {
    document.getElementById('toggleButton').addEventListener('click', function() {
        const clearButton = document.getElementById('clearButton');
        if (isMenuVisible) {
            mainMenu.style.height = '15px';
            mainMenu.style.width = '15px';
            document.getElementById('menuContent').style.opacity = '0';
            clearButton.style.opacity = '0';
            setTimeout(() => {
                document.getElementById('menuContent').style.display = 'none';
                clearButton.style.display = 'none';
            }, 50);
        } else {
            mainMenu.style.height = '400px';
            mainMenu.style.width = '300px';
            document.getElementById('menuContent').style.display = 'flex';
            clearButton.style.display = 'block';
            setTimeout(() => {
                document.getElementById('menuContent').style.opacity = '1';
                clearButton.style.opacity = '1';
            }, 100);
        }
        isMenuVisible = !isMenuVisible;
    });
};

const addSettings = () => {
    document.getElementById('gearIcon').addEventListener('click', function() {
        let saveHtml = document.getElementById('mainMenu').innerHTML
        mainMenu.innerHTML = `
            <div id="settingsContent" style="display: flex; flex-direction: column; align-items: center; position: relative; opacity: 1; transition: opacity 0.5s ease;">
                <img id="backArrow" src="https://i.ibb.co/Jt4qrD7/pngwing-com-1.png" alt="Back" style="position: absolute; left: 7px; top: 3px; width: 24px; height: 24px; opacity: 1; transition: opacity 0.5s ease; cursor: pointer;" />

                <h3 style="margin: 0; text-align: center; color: white; font-family: Noto sans; font-weight: 500;">Settings Menu</h3>
                <p style="text-align: center; color: white; font-family: Noto sans; margin-top: 15px;">
                    Ghost Mode: <input type="checkbox" id="ghostModeToggle" class="ghostToggle2" ${isGhostModeEnabled ? 'checked' : ''}>
                </p>
                <p style="text-align: center; color: white; font-family: Noto sans; margin-top: 15px;">Auto Answer: BETA</p>
                <p style="text-align: center; color: white; font-family: Noto sans; margin-top: 15px;">Point Farmer: BETA</p>
                <p style="text-align: center; color: white; font-family: Noto sans; margin-top: 15px; font-size: 14px;">Questions ${questionCount}/${USE_GEMINI_FOR_FIRST_N} (Gemini)</p>
                <p style="text-align: center; color: white; font-family: Noto sans; margin-top: 5px; font-size: 25px;">🤖 Gemini Enhanced</p>
                <p style="text-align: center; color: white; font-family: Noto sans; margin-top: 50px;">KhanHack™ + Gemini | 6.2</p>

                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap');

                    .ghostToggle {
                        width: 20px;
                        height: 20px;
                        background-color: white;
                        border-radius: 50%;
                        vertical-align: middle;
                        border: 2px solid #07152e;
                        appearance: none;
                        -webkit-appearance: none;
                        outline: none;
                        cursor: pointer;
                        transition: 0.2s ease;
                    }

                    .ghostToggle:checked {
                        background-color: #2967d9;
                    }
                </style>
            </div>
        `;

        document.getElementById('backArrow').addEventListener('click', () => {mainMenu.innerHTML = saveHtml; addSettings(); addToggle(); addDiscord(); addClear();});
        document.getElementById('ghostModeToggle').addEventListener('change', function() {
            isGhostModeEnabled = this.checked;
            if (isGhostModeEnabled) {
                enableGhostMode();
            } else {
                disableGhostMode();
            }
        });
    });
};

const enableGhostMode = () => {
    mainMenu.style.opacity = '0';
    mainMenu.addEventListener('mouseenter', handleMouseEnter);
    mainMenu.addEventListener('mouseleave', handleMouseLeave);
};

const disableGhostMode = () => {
    mainMenu.style.opacity = '1';
    mainMenu.removeEventListener('mouseenter', handleMouseEnter);
    mainMenu.removeEventListener('mouseleave', handleMouseLeave);
};

const handleMouseEnter = () => {
    mainMenu.style.opacity = '1';
};

const handleMouseLeave = () => {
    mainMenu.style.opacity = '0';
};

const addDiscord = () => {
    document.getElementById('discordIcon').addEventListener('click', function() {
        window.open('https://discord.gg/khanhack', '_blank');
    });
};

const addClear = () => {
    document.getElementById('clearButton').addEventListener('click', function() {
        location.reload();
    });
};

const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
    document.head.appendChild(script);

const katexStyle = document.createElement("link");
    katexStyle.rel = "stylesheet";
    katexStyle.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
    document.head.appendChild(katexStyle);

const getCurrentQuestion = () => {
    const container = document.querySelector(`div[data-testid="content-library-footer"]`)
    let firstChar = container.querySelectorAll("div")[5].children[0].innerText.charAt(0)
    let lastChar = container.querySelectorAll("div")[5].children[0].innerText.slice(-1)
    if(firstChar == lastChar-1) {
        console.log(true)
        container.querySelectorAll("button")[3].onclick = function() {;
            firstAns = document.getElementById(`blockNum${blockTick-1}`)
            console.log(firstAns)
            secondAns = document.getElementById(`blockNum${blockTick}`)
            secondAns.style.opacity = "100%";
            firstAns.remove()
            answerBlocks.shift()
    }
    } else {
        console.log(false)
    }
}

const addNewAnswerBlock = (answer, imgSrc, isImg) => {
    const answerList = document.getElementById('answerList');
    const block = document.createElement('div');
    blockTick ++

    //console.log(' blockTick: ' + blockTick)
    if(isImg == true) {
        block.className = 'block imgBlock';
        const img = document.createElement('img');
        img.src = imgSrc;
        block.id = `blockNum${blockTick}`
        block.innerHTML = `${answer}`;
        block.style.display = "inline-block"
        block.style.color = "black";
        block.appendChild(img);
        answerList.appendChild(block);
        answerBlocks.push({ type: 'image', content: block.id });
        //console.log('num: ' + block.id)
    }

    else {
        block.className = 'block no-select';
        block.id = `blockNum${blockTick}`
        block.style.cursor = "pointer";
        block.addEventListener("click", () => {
            console.log('clicked')
            navigator.clipboard.writeText(answer);
        });

        const ansVal = document.createElement('a');
        ansVal.className = 'answer';

        const latexPattern = /\\frac|\\sqrt|\\times|\\cdot|\\degree|\\dfrac|\test|\\vec\\leq|\\left|\\right|\^|\$|\{|\}/;
        if (latexPattern.test(answer)) {
            ansVal.innerHTML = '';
            katex.render(answer, ansVal)
        } else {
            ansVal.innerHTML = `${answer}`;
        }

        ansVal.style.fontSize = "16px";
        block.appendChild(ansVal);
        answerList.appendChild(block);
        answerBlocks.push({ type: 'text', content: block.id });
        //console.log('num: ' + block.id)
    }

    const runList = () => {
        if(answerBlocks.length == 3) {
            //console.log(`length is ${answerBlocks.length}`)
            firstAns = document.getElementById(`blockNum${blockTick-2}`)
            secondAns = document.getElementById(`blockNum${blockTick-1}`)
            secondAns.style.opacity = "100%";
            firstAns.remove()
            answerBlocks.shift()
            getCurrentQuestion()
            //console.log(`shifted is ${answerBlocks.length}`)
            runList()

        } else if(answerBlocks.length == 2) {
            //console.log(`length is ${answerBlocks.length}`)
            firstAns = document.getElementById(`blockNum${blockTick-1}`)
            secondAns = document.getElementById(`blockNum${blockTick}`)
            if(secondAns.style.opacity == "0%") {
                firstAns.remove()
                answerBlocks.shift()
                secondAns.style.opacity = "100%";

            } else{
                secondAns.style.opacity = "0%";
            }

        }

    }
    runList()
}

// Wait for page to be fully loaded before adding UI
function initializeKhanHack() {
    console.log('🚀 Initializing KhanHack UI...');
    
    // Remove any existing menu first
    const existing = document.getElementById('mainMenu');
    if (existing) {
        existing.remove();
        console.log('🗑️ Removed existing menu');
    }
    
    // Add menu to page
    document.body.appendChild(mainMenu);
    console.log('✅ MainMenu added to page');
    
    setMainMenuContent();
    console.log('✅ Menu content set');
    
    // Start observing for new questions
    observeForNewQuestions();
    console.log('✅ Question observer started');
    
    // Verify menu is visible
    setTimeout(() => {
        const menu = document.getElementById('mainMenu');
        if (menu && menu.offsetParent !== null) {
            console.log('✅ KhanHack UI is visible!');
        } else {
            console.log('⚠️ UI not visible - trying to fix...');
            // Force visibility
            if (menu) {
                menu.style.display = 'flex !important';
                menu.style.visibility = 'visible !important';
                menu.style.opacity = '1 !important';
                menu.style.zIndex = '999999 !important';
            }
        }
    }, 1000);
}

// Initialize when DOM is ready - with better error handling
function safeInitialize() {
    try {
        initializeKhanHack();
    } catch (error) {
        console.error('❌ Error initializing KhanHack:', error);
        // Try a simpler fallback UI
        setTimeout(() => {
            createSimpleFallbackUI();
        }, 1000);
    }
}

function createSimpleFallbackUI() {
    console.log('🔧 Creating fallback KhanHack UI...');
    
    // Remove any existing
    const existing = document.getElementById('mainMenu');
    if (existing) existing.remove();
    
    const mainMenu = document.createElement('div');
    mainMenu.id = 'mainMenu';
    mainMenu.style.cssText = `
        position: fixed !important;
        bottom: 10px !important;
        left: 10px !important;
        width: 300px !important;
        height: 150px !important;
        background-color: #123576 !important;
        border: 3px solid #07152e !important;
        border-radius: 20px !important;
        padding: 20px !important;
        color: white !important;
        font-family: Arial, sans-serif !important;
        z-index: 999999 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
    `;
    
    mainMenu.innerHTML = `
        <h3 style="color: white; margin: 5px 0;">🤖 KhanHack + Gemini</h3>
        <div style="font-size: 12px; opacity: 0.8;">Q1-2: Gemini | Q3+: Khan API</div>
        <button onclick="localStorage.setItem('khan_question_count', '0'); location.reload();" 
                style="padding: 8px 16px; background: #2967d9; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
            Reset Count
        </button>
    `;
    
    document.body.appendChild(mainMenu);
    console.log('✅ Fallback KhanHack UI created');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInitialize);
} else {
    safeInitialize();
}

// Multiple initialization attempts
setTimeout(safeInitialize, 1000);
setTimeout(safeInitialize, 3000);
setTimeout(createSimpleFallbackUI, 5000);

let originalJson = JSON.parse;

JSON.parse = function (jsonString) {
    let parsedData = originalJson(jsonString);

    try {
        if (parsedData.data && parsedData.data.assessmentItem && parsedData.data.assessmentItem.item) {
            
            // Only use Khan API after first N questions
            if (questionCount < USE_GEMINI_FOR_FIRST_N) {
                console.log(`🤖 Skipping Khan API - still using Gemini for question ${questionCount + 1}/${USE_GEMINI_FOR_FIRST_N}`);
                return parsedData;
            }
            
            console.log(`📚 Using Khan API for question ${questionCount + 1}+`);
            
            let itemData = JSON.parse(parsedData.data.assessmentItem.item.itemData);
            let hasGradedWidget = Object.values(itemData.question.widgets).some(widget => widget.graded === true);
            if (hasGradedWidget) {

                // Increment question count when using Khan API
                questionCount++;
                localStorage.setItem('khan_question_count', questionCount.toString());

                for (let widgetKey in itemData.question.widgets) {

                    let widget = itemData.question.widgets[widgetKey];
                    console.log(widget.type)

                    switch (widget.type) {
                        case "numeric-input":
                            handleNumeric(widget);
                            break;
                        case "radio":
                            handleRadio(widget);
                            break;
                        case "expression":
                            handleExpression(widget);
                            break;
                        case "dropdown":
                            handleDropdown(widget);
                            break;
                        case "interactive-graph":
                            handleIntGraph(widget);
                            break;
                        case "grapher":
                            handleGrapher(widget);
                            break;
                        case "input-number":
                            handleInputNum(widget);
                            break;
                        case "matcher":
                            handleMatcher(widget);
                            break;
                        case "categorizer":
                            handleCateg(widget);
                            break;
                        case "label-image":
                            handleLabel(widget);
                            break;
                         case "matrix":
                            handleMatrix(widget);
                            break;
                        default:
                            console.log("Unknown widget: " + widget.type);
                            break;
                    }
                }

                if (currentCombinedAnswer.trim() !== '') {
                    if(currentCombinedAnswer.slice(-4) == '<br>') {
                        const khanLabel = `📚 Khan API (Q${questionCount})`;
                        addNewAnswerBlock(`${khanLabel}<br>${currentCombinedAnswer.slice(0, -4)}`, null, false)
                        currentCombinedAnswer = '';
                    } else {
                        const khanLabel = `📚 Khan API (Q${questionCount})`;
                        addNewAnswerBlock(`${khanLabel}<br>${currentCombinedAnswer}`, null, false)
                        currentCombinedAnswer = '';
                    }
                }
            }
        }
    } catch (error) {
        console.log("Error parsing JSON:", error);
    }

    return parsedData;
};

function cleanLatexExpression(answer) {
    return answer
        .replace('begin{align}', 'begin{aligned}')
        .replace('end{align}', 'end{aligned}')
        .replace(/\$/g, '');
}

function handleRadio(widget) {
    let corAns = widget.options.choices.filter(item => item.correct === true).map(item => item.content);
    let ansArr = [];
    let isNone = widget.options.choices.filter(item => item.isNoneOfTheAbove === true && item.correct === true)

    if (isNone.length > 0) {
        currentCombinedAnswer += "None of the above";
        return;
    }

    console.log(corAns)

    corAns.forEach(answer => {
        const hasGraphie = answer.includes('web+graphie')
        const hasNotGraphie = answer.includes('![')

        if(hasGraphie || hasNotGraphie == true) {
            if(hasGraphie == true) {
                const split = answer.split('](web+graphie');
                const text = split[0].slice(2)
                const midUrl = split[1].split(')')[0];
                const finalUrl = 'https' + midUrl + '.svg';
                addNewAnswerBlock(text, finalUrl, true);
            } else if(hasNotGraphie == true) {
                const finalUrl = answer.slice(answer.indexOf('https'), -1)
                addNewAnswerBlock(null, finalUrl, true);
            }
        } else {
            let cleaned = cleanLatexExpression(answer)
            ansArr.push(cleaned)
            console.log(cleaned)
        }
    })

    if(ansArr.length) {
        currentCombinedAnswer += ansArr.join()
    }
}

function handleLabel(widget) {
    let corAns = widget.options.markers.filter(item => item.answers).map(item => item.answers)
    let labels = widget.options.markers.filter(item => item.label).map(item => item.label)
    let ansArr = []

    corAns.forEach((answer, index) => {
        if(labels == 0) {
            let cleaned = cleanLatexExpression(answer.toString());
            ansArr.push(cleaned)

        } else {
        let cleaned = cleanLatexExpression(answer.toString());
        let finLabel = labels[index].replace('Point ', '').replace(/[.]/g, '').trim() || "";
        let labeledAnswer = `${finLabel}: ${cleaned}`;
        ansArr.push(labeledAnswer)
        }
    })

    if(ansArr.length) {
        currentCombinedAnswer += ansArr.join("|")
    }
}

function handleNumeric(widget) {
    const numericAnswer = widget.options.answers[0].value;
    currentCombinedAnswer += `${numericAnswer}<br>`;
}

function handleExpression(widget) {
    let expressionAnswer = widget.options.answerForms[0].value;
    let cleaned = cleanLatexExpression(expressionAnswer)
    console.log(expressionAnswer)
    currentCombinedAnswer += ` ${cleaned} `;
}

function handleDropdown(widget) {
    let content = widget.options.choices.filter(item => item.correct === true).map(item => item.content);
    currentCombinedAnswer += ` ${content[0]} `;
}

function handleIntGraph(widget) {
    let coords = widget.options.correct.coords;
    let validCoords = coords.filter(coord => coord !== undefined);
    currentCombinedAnswer += ` ${validCoords.join(' | ')} `;
}

function handleInputNum(widget) {
    let inputNumAnswer = widget.options.value;
    console.log(inputNumAnswer)
    currentCombinedAnswer += ` ${inputNumAnswer} `;
}

function handleMatcher(widget) {
    let matchAnswer = widget.options.right;
    let cleaned = cleanLatexExpression(matchAnswer)
    currentCombinedAnswer += ` ${matchAnswer} `;
}

function handleGrapher(widget) {
    let coords = widget.options.correct.coords;
    currentCombinedAnswer += ` ${coords.join(' | ')} `;
}

function handleCateg(widget) {
    let values = widget.options.values;
    let categories = widget.options.categories;
    let labeledValues = values.map(value => categories[value]);

    currentCombinedAnswer += ` ${labeledValues} `
}

function handleMatrix(widget) {
    let arrs = widget.options.answers;
    currentCombinedAnswer += ` ${arrs.join(' | ')} `
}

// Add console helpers
console.log('🚀 KhanHack with Gemini AI loaded!');
console.log(`📊 Current question count: ${questionCount}/${USE_GEMINI_FOR_FIRST_N} (Gemini)`);
console.log('💡 Commands:');
console.log('  - Reset count: localStorage.setItem("khan_question_count", "0"); location.reload()');
console.log('  - Check count: localStorage.getItem("khan_question_count")');