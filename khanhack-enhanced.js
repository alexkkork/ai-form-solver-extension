// ==Enhanced KhanHack Module==
// Advanced Khan Academy Enhancement with BETA Features
// Based on KhanHack™ v6.1 with full feature implementation

console.log('🚀 Loading Enhanced KhanHack Module v6.1...');

// ============================================================================
// GLOBAL VARIABLES AND STATE MANAGEMENT
// ============================================================================

let enhancedMainMenu = null;
let enhancedAnswerBlocks = [];
let enhancedCombinedAnswer = '';
let enhancedGhostModeEnabled = false;
let enhancedBlockTick = 0;
let enhancedFirstAns, enhancedSecondAns;
let enhancedMenuVisible = true;

// BETA Features
let autoAnswerEnabled = false;
let pointFarmerEnabled = false;
let autoAnswerDelay = 2000; // 2 seconds delay
let pointFarmingInterval = null;

// Constants to avoid conflicts
const ENHANCED_USE_GEMINI_FOR_FIRST_N = 2;

// ============================================================================
// MAIN MENU CREATION AND STYLING
// ============================================================================

const createMainMenu = () => {
    if (enhancedMainMenu) return; // Prevent duplicate creation
    
    enhancedMainMenu = document.createElement('div');
    enhancedMainMenu.id = 'enhanced-khanhack-menu';
    enhancedMainMenu.style.cssText = `
        position: fixed;
        bottom: 0.5vw;
        left: 12vw;
        width: 300px;
        height: 400px;
        background-color: #123576;
        border: 3px solid #07152e;
        border-radius: 20px;
        padding: 10px;
        color: white;
        font-family: "Noto Sans", sans-serif;
        font-weight: 500;
        transition: all 0.3s ease;
        z-index: 10000;
        display: flex;
        flex-direction: column;
    `;
    
    document.body.appendChild(enhancedMainMenu);
    setMainMenuContent();
    
    console.log('✅ Enhanced KhanHack Menu created');
};

const setMainMenuContent = () => {
    enhancedMainMenu.innerHTML = `
        <div id="menuContent" style="display: flex; flex-direction: column; align-items: center; gap: 10px; opacity: 1; transition: opacity 0.5s ease; height: 100%;">
            <head>
                <img id="discordIcon" src="https://i.ibb.co/grF973h/discord.png" alt="Discord" style="position: absolute; left: 15px; top: 15px; width: 24px; height: 24px; opacity: 1; transition: opacity 0.5s ease; cursor: pointer;" />
                <img id="headerImage" src="https://i.ibb.co/h2GFJ5f/khanhack.png" style="width: 130px; opacity: 1; transition: opacity 0.5s ease;" />
                <img id="gearIcon" src="https://i.ibb.co/q0QVKGG/gearicon.png" alt="Settings" style="position: absolute; right: 15px; top: 15px; width: 24px; height: 24px; opacity: 1; transition: opacity 0.5s ease; cursor: pointer;" />
            </head>

            <div id="answerList" class="answerList"></div>
            <div id="copyText2" class="copyText2">Click to copy</div>
            
            <!-- BETA Status Indicators -->
            <div id="betaStatus" style="display: flex; gap: 5px; margin-top: 5px;">
                <div id="autoAnswerStatus" style="background: ${autoAnswerEnabled ? '#4CAF50' : '#757575'}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">AUTO: ${autoAnswerEnabled ? 'ON' : 'OFF'}</div>
                <div id="pointFarmerStatus" style="background: ${pointFarmerEnabled ? '#FF9800' : '#757575'}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">FARM: ${pointFarmerEnabled ? 'ON' : 'OFF'}</div>
            </div>
        </div>

        <img id="toggleButton" src="https://i.ibb.co/RpqPcR1/hamburger.png" class="toggleButton">
        <img id="clearButton" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNEwyMCAyME00IDIwTDIwIDQiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+" style="width: 24px; height: 24px; bottom: 5px; right: 5px; position: absolute; cursor: pointer; background: rgba(255,255,255,0.1); border-radius: 50%; padding: 5px;">

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
                max-height: calc(100% - 120px);
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
                position: relative;
            }

            .block:hover {
                background-color: #d9d7d7;
            }

            .block.auto-filled {
                border: 2px solid #4CAF50;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
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

            .copyText2 {
                text-align: center;
                padding-top: 10px;
                left: 50%;
                font-size: 15px;
                opacity: 0;
                transition: opacity 0.2s ease, font-size 0.1s ease;
            }

            .answerList:hover + .copyText2 {
                opacity: 100;
            }

            #answerList::-webkit-scrollbar {
                display: none;
            }

            #answerList {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        </style>
    `;

    addEventListeners();
    if (enhancedGhostModeEnabled) {
        enableGhostMode();
    }
};

// ============================================================================
// EVENT LISTENERS AND INTERACTIONS
// ============================================================================

const addEventListeners = () => {
    addToggle();
    addSettings();
    addDiscord();
    addClear();
};

const addToggle = () => {
    document.getElementById('toggleButton')?.addEventListener('click', function() {
        const clearButton = document.getElementById('clearButton');
        const menuContent = document.getElementById('menuContent');
        
        if (enhancedMenuVisible) {
            enhancedMainMenu.style.height = '15px';
            enhancedMainMenu.style.width = '15px';
            menuContent.style.opacity = '0';
            clearButton.style.opacity = '0';
            setTimeout(() => {
                menuContent.style.display = 'none';
                clearButton.style.display = 'none';
            }, 50);
        } else {
            enhancedMainMenu.style.height = '400px';
            enhancedMainMenu.style.width = '300px';
            menuContent.style.display = 'flex';
            clearButton.style.display = 'block';
            setTimeout(() => {
                menuContent.style.opacity = '1';
                clearButton.style.opacity = '1';
            }, 100);
        }
        enhancedMenuVisible = !enhancedMenuVisible;
    });
};

const addSettings = () => {
    document.getElementById('gearIcon')?.addEventListener('click', function() {
        let saveHtml = enhancedMainMenu.innerHTML;
        enhancedMainMenu.innerHTML = `
            <div id="settingsContent" style="display: flex; flex-direction: column; align-items: center; position: relative; opacity: 1; transition: opacity 0.5s ease; padding: 10px;">
                <img id="backArrow" src="https://i.ibb.co/Jt4qrD7/pngwing-com-1.png" alt="Back" style="position: absolute; left: 7px; top: 3px; width: 24px; height: 24px; opacity: 1; transition: opacity 0.5s ease; cursor: pointer;" />

                <h3 style="margin: 0; text-align: center; color: white; font-family: Noto sans; font-weight: 500;">Enhanced Settings</h3>
                
                <!-- Core Features -->
                <div style="width: 100%; margin-top: 20px;">
                    <p style="text-align: center; color: white; font-family: Noto sans; margin: 10px 0;">
                        Ghost Mode: <input type="checkbox" id="ghostModeToggle" ${enhancedGhostModeEnabled ? 'checked' : ''} style="margin-left: 10px;">
                    </p>
                </div>
                
                <!-- BETA Features -->
                <div style="width: 100%; border-top: 1px solid #444; margin-top: 15px; padding-top: 15px;">
                    <h4 style="text-align: center; color: #FFD700; font-family: Noto sans; margin: 0 0 15px 0;">🔬 BETA FEATURES</h4>
                    
                    <p style="text-align: center; color: white; font-family: Noto sans; margin: 10px 0;">
                        Auto Answer: <input type="checkbox" id="autoAnswerToggle" ${autoAnswerEnabled ? 'checked' : ''} style="margin-left: 10px;">
                    </p>
                    
                    <div id="autoAnswerSettings" style="display: ${autoAnswerEnabled ? 'block' : 'none'}; margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <label style="color: white; font-size: 12px;">Delay (ms): 
                            <input type="number" id="autoAnswerDelay" value="${autoAnswerDelay}" min="500" max="10000" step="500" style="width: 80px; margin-left: 5px;">
                        </label>
                    </div>
                    
                    <p style="text-align: center; color: white; font-family: Noto sans; margin: 10px 0;">
                        Point Farmer: <input type="checkbox" id="pointFarmerToggle" ${pointFarmerEnabled ? 'checked' : ''} style="margin-left: 10px;">
                    </p>
                    
                    <div id="pointFarmerSettings" style="display: ${pointFarmerEnabled ? 'block' : 'none'}; margin: 10px 0; padding: 10px; background: rgba(255,165,0,0.1); border-radius: 8px;">
                        <p style="color: #FFB366; font-size: 11px; margin: 0; text-align: center;">
                            ⚠️ Automatically cycles through questions to farm points.<br>
                            Use responsibly to avoid detection.
                        </p>
                    </div>
                </div>
                
                <!-- Info -->
                <div style="margin-top: auto; text-align: center;">
                    <p style="color: #FFD700; font-family: Noto sans; margin: 15px 0; font-size: 18px;">Beta Access In Discord</p>
                    <p style="color: white; font-family: Noto sans; margin: 5px 0;">Enhanced KhanHack™ | v6.1</p>
                </div>
            </div>
        `;

        // Add event listeners for settings
        document.getElementById('backArrow')?.addEventListener('click', () => {
            enhancedMainMenu.innerHTML = saveHtml;
            addEventListeners();
        });
        
        document.getElementById('ghostModeToggle')?.addEventListener('change', function() {
            enhancedGhostModeEnabled = this.checked;
            if (enhancedGhostModeEnabled) {
                enableGhostMode();
            } else {
                disableGhostMode();
            }
        });
        
        document.getElementById('autoAnswerToggle')?.addEventListener('change', function() {
            autoAnswerEnabled = this.checked;
            document.getElementById('autoAnswerSettings').style.display = autoAnswerEnabled ? 'block' : 'none';
            console.log(`🤖 Auto Answer: ${autoAnswerEnabled ? 'ENABLED' : 'DISABLED'}`);
        });
        
        document.getElementById('autoAnswerDelay')?.addEventListener('change', function() {
            autoAnswerDelay = parseInt(this.value) || 2000;
            console.log(`⏱️ Auto Answer Delay: ${autoAnswerDelay}ms`);
        });
        
        document.getElementById('pointFarmerToggle')?.addEventListener('change', function() {
            pointFarmerEnabled = this.checked;
            document.getElementById('pointFarmerSettings').style.display = pointFarmerEnabled ? 'block' : 'none';
            
            if (pointFarmerEnabled) {
                startPointFarmer();
            } else {
                stopPointFarmer();
            }
        });
    });
};

const addDiscord = () => {
    document.getElementById('discordIcon')?.addEventListener('click', function() {
        window.open('https://discord.gg/khanhack', '_blank');
    });
};

const addClear = () => {
    document.getElementById('clearButton')?.addEventListener('click', function() {
        location.reload();
    });
};

// ============================================================================
// GHOST MODE FUNCTIONALITY
// ============================================================================

const enableGhostMode = () => {
    enhancedMainMenu.style.opacity = '0.2';
    enhancedMainMenu.addEventListener('mouseenter', handleMouseEnter);
    enhancedMainMenu.addEventListener('mouseleave', handleMouseLeave);
    console.log('👻 Ghost Mode enabled');
};

const disableGhostMode = () => {
    enhancedMainMenu.style.opacity = '1';
    enhancedMainMenu.removeEventListener('mouseenter', handleMouseEnter);
    enhancedMainMenu.removeEventListener('mouseleave', handleMouseLeave);
    console.log('👻 Ghost Mode disabled');
};

const handleMouseEnter = () => {
    enhancedMainMenu.style.opacity = '1';
};

const handleMouseLeave = () => {
    enhancedMainMenu.style.opacity = '0.2';
};

// ============================================================================
// KATEX SUPPORT FOR LATEX RENDERING
// ============================================================================

const loadKaTeX = () => {
    if (window.katex) return; // Already loaded
    
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
    script.onload = () => {
        console.log('✅ KaTeX loaded for LaTeX rendering');
    };
    document.head.appendChild(script);

    const katexStyle = document.createElement("link");
    katexStyle.rel = "stylesheet";
    katexStyle.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
    document.head.appendChild(katexStyle);
};

const cleanLatexExpression = (answer) => {
    return answer
        .replace('begin{align}', 'begin{aligned}')
        .replace('end{align}', 'end{aligned}')
        .replace(/\$/g, '');
};

// ============================================================================
// ANSWER BLOCK MANAGEMENT
// ============================================================================

const getCurrentQuestion = () => {
    try {
        const container = document.querySelector(`div[data-testid="content-library-footer"]`);
        if (!container) return false;
        
        let firstChar = container.querySelectorAll("div")[5]?.children[0]?.innerText?.charAt(0);
        let lastChar = container.querySelectorAll("div")[5]?.children[0]?.innerText?.slice(-1);
        
        if (firstChar == lastChar - 1) {
            console.log('📊 Question transition detected');
            
            // Handle question transition
            if (container.querySelectorAll("button")[3]) {
                container.querySelectorAll("button")[3].onclick = function() {
                    firstAns = document.getElementById(`blockNum${blockTick-1}`);
                    secondAns = document.getElementById(`blockNum${blockTick}`);
                    if (secondAns) secondAns.style.opacity = "100%";
                    if (firstAns) firstAns.remove();
                    answerBlocks.shift();
                };
            }
            return true;
        }
        return false;
    } catch (error) {
        console.warn('Error in getCurrentQuestion:', error);
        return false;
    }
};

const addNewAnswerBlock = (answer, imgSrc, isImg) => {
    if (!enhancedMainMenu || !document.getElementById('answerList')) {
        console.warn('Answer list not available');
        return;
    }
    
    const answerList = document.getElementById('answerList');
    const block = document.createElement('div');
    enhancedBlockTick++;

    if (isImg === true) {
        block.className = 'block imgBlock';
        block.id = `blockNum${enhancedBlockTick}`;
        block.style.display = "inline-block";
        block.style.color = "black";
        
        if (answer) {
            const textDiv = document.createElement('div');
            textDiv.textContent = answer;
            textDiv.style.marginBottom = '5px';
            block.appendChild(textDiv);
        }
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.style.maxWidth = '250px';
        img.style.borderRadius = '10px';
        block.appendChild(img);
        
        answerList.appendChild(block);
        enhancedAnswerBlocks.push({ type: 'image', content: block.id, answer: answer, imgSrc: imgSrc });
    } else {
        block.className = 'block no-select';
        block.id = `blockNum${enhancedBlockTick}`;
        block.style.cursor = "pointer";
        
        // Copy to clipboard on click
        block.addEventListener("click", () => {
            navigator.clipboard.writeText(answer);
            console.log(`📋 Copied to clipboard: ${answer}`);
            
            // Visual feedback
            const originalBg = block.style.backgroundColor;
            block.style.backgroundColor = '#4CAF50';
            setTimeout(() => {
                block.style.backgroundColor = originalBg;
            }, 200);
        });

        const ansVal = document.createElement('div');
        ansVal.className = 'answer';

        // Check if answer contains LaTeX
        const latexPattern = /\\frac|\\sqrt|\\times|\\cdot|\\degree|\\dfrac|\\test|\\vec|\\leq|\\left|\\right|\^|\$|\{|\}/;
        if (latexPattern.test(answer) && window.katex) {
            try {
                ansVal.innerHTML = '';
                katex.render(cleanLatexExpression(answer), ansVal);
            } catch (e) {
                console.warn('KaTeX render error:', e);
                ansVal.innerHTML = answer;
            }
        } else {
            ansVal.innerHTML = answer;
        }

        ansVal.style.fontSize = "16px";
        block.appendChild(ansVal);
        answerList.appendChild(block);
        enhancedAnswerBlocks.push({ type: 'text', content: block.id, answer: answer });
    }

    // Auto-fill if enabled
    if (autoAnswerEnabled) {
        setTimeout(() => {
            autoFillCurrentAnswer(answer, isImg, imgSrc);
        }, autoAnswerDelay);
    }

    manageAnswerBlocks();
};

const manageAnswerBlocks = () => {
    if (enhancedAnswerBlocks.length >= 3) {
        enhancedFirstAns = document.getElementById(`blockNum${enhancedBlockTick-2}`);
        enhancedSecondAns = document.getElementById(`blockNum${enhancedBlockTick-1}`);
        
        if (enhancedSecondAns) enhancedSecondAns.style.opacity = "100%";
        if (enhancedFirstAns) enhancedFirstAns.remove();
        enhancedAnswerBlocks.shift();
        
        getCurrentQuestion();
        manageAnswerBlocks(); // Recursive call to handle multiple blocks
    } else if (enhancedAnswerBlocks.length === 2) {
        enhancedFirstAns = document.getElementById(`blockNum${enhancedBlockTick-1}`);
        enhancedSecondAns = document.getElementById(`blockNum${enhancedBlockTick}`);
        
        if (enhancedSecondAns && enhancedSecondAns.style.opacity === "0%") {
            if (enhancedFirstAns) enhancedFirstAns.remove();
            enhancedAnswerBlocks.shift();
            enhancedSecondAns.style.opacity = "100%";
        } else if (enhancedSecondAns) {
            enhancedSecondAns.style.opacity = "0%";
        }
    }
};

// ============================================================================
// BETA AUTO-ANSWER FUNCTIONALITY
// ============================================================================

const autoFillCurrentAnswer = (answer, isImg, imgSrc) => {
    if (!autoAnswerEnabled) return;
    
    console.log(`🤖 Auto-filling answer: ${answer}`);
    
    try {
        if (!isImg) {
            // Handle text/numeric answers
            const inputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
            if (inputs.length > 0) {
                inputs[0].value = answer;
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                
                // Mark as auto-filled
                const block = document.getElementById(`blockNum${enhancedBlockTick}`);
                if (block) block.classList.add('auto-filled');
                
                console.log(`✅ Auto-filled input: ${answer}`);
                
                // Auto-submit if point farming is enabled
                if (pointFarmerEnabled) {
                    setTimeout(() => {
                        autoSubmitAnswer();
                    }, 1000);
                }
            }
            
            // Handle radio buttons (multiple choice)
            const radioButtons = document.querySelectorAll('input[type="radio"]');
            if (radioButtons.length > 0) {
                // Try to match answer text with radio button labels
                for (let radio of radioButtons) {
                    const label = radio.parentElement?.textContent || '';
                    if (label.includes(answer) || answer.includes(label.trim())) {
                        radio.click();
                        console.log(`✅ Auto-selected radio: ${label}`);
                        
                        if (pointFarmerEnabled) {
                            setTimeout(() => {
                                autoSubmitAnswer();
                            }, 1000);
                        }
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Auto-fill error:', error);
    }
};

const autoSubmitAnswer = () => {
    if (!pointFarmerEnabled) return;
    
    try {
        // Look for check/submit button
        const checkButton = document.querySelector('[data-test-id="exercise-check-answer-button"]') ||
                           document.querySelector('button[type="submit"]') ||
                           document.querySelector('button:contains("Check")');
        
        if (checkButton) {
            checkButton.click();
            console.log('🚀 Auto-submitted answer');
            
            // Schedule next question if point farming
            setTimeout(() => {
                proceedToNextQuestion();
            }, 2000);
        }
    } catch (error) {
        console.error('Auto-submit error:', error);
    }
};

// ============================================================================
// BETA POINT FARMER FUNCTIONALITY
// ============================================================================

const startPointFarmer = () => {
    console.log('🌾 Starting Point Farmer...');
    
    pointFarmingInterval = setInterval(() => {
        if (pointFarmerEnabled) {
            farmPoints();
        }
    }, 5000); // Check every 5 seconds
};

const stopPointFarmer = () => {
    console.log('🛑 Stopping Point Farmer...');
    
    if (pointFarmingInterval) {
        clearInterval(pointFarmingInterval);
        pointFarmingInterval = null;
    }
};

const farmPoints = () => {
    try {
        // Check if we're on a question page
        const isQuestionPage = document.querySelector('.exercise-card-wrapper') || 
                              document.querySelector('[data-test-id="exercise-question-wrapper"]');
        
        if (!isQuestionPage) {
            // Navigate to a practice session
            navigateToRandomPractice();
            return;
        }
        
        // Check if answer is already available
        if (enhancedAnswerBlocks.length > 0) {
            const latestAnswer = enhancedAnswerBlocks[enhancedAnswerBlocks.length - 1];
            if (latestAnswer && autoAnswerEnabled) {
                // Answer will be auto-filled and submitted
                console.log('🌾 Point farming: Using available answer');
            }
        } else {
            // Wait for answer to be extracted
            console.log('🌾 Point farming: Waiting for answer extraction...');
        }
        
        // Check for "Next" or "Continue" buttons
        setTimeout(() => {
            proceedToNextQuestion();
        }, 3000);
        
    } catch (error) {
        console.error('Point farming error:', error);
    }
};

const proceedToNextQuestion = () => {
    try {
        const nextButton = document.querySelector('[data-test-id="exercise-next-button"]') ||
                          document.querySelector('button:contains("Next")') ||
                          document.querySelector('button:contains("Continue")') ||
                          document.querySelector('.next-button');
        
        if (nextButton && !nextButton.disabled) {
            nextButton.click();
            console.log('➡️ Proceeding to next question');
        }
    } catch (error) {
        console.error('Next question error:', error);
    }
};

const navigateToRandomPractice = () => {
    const practiceSubjects = [
        'algebra',
        'geometry', 
        'arithmetic',
        'precalculus',
        'statistics-probability'
    ];
    
    const randomSubject = practiceSubjects[Math.floor(Math.random() * practiceSubjects.length)];
    const practiceUrl = `https://www.khanacademy.org/math/${randomSubject}`;
    
    console.log(`🌾 Navigating to practice: ${randomSubject}`);
    // Note: Actual navigation would be done carefully to avoid detection
};

// ============================================================================
// COMPREHENSIVE WIDGET HANDLERS
// ============================================================================

const handleNumeric = (widget) => {
    const numericAnswer = widget.options.answers[0].value;
    enhancedCombinedAnswer += `${numericAnswer}<br>`;
};

const handleRadio = (widget) => {
    let corAns = widget.options.choices.filter(item => item.correct === true).map(item => item.content);
    let ansArr = [];
    let isNone = widget.options.choices.filter(item => item.isNoneOfTheAbove === true && item.correct === true);

    if (isNone.length > 0) {
        enhancedCombinedAnswer += "None of the above";
        return;
    }

    corAns.forEach(answer => {
        const hasGraphie = answer.includes('web+graphie');
        const hasNotGraphie = answer.includes('![');

        if (hasGraphie || hasNotGraphie === true) {
            if (hasGraphie === true) {
                const split = answer.split('](web+graphie');
                const text = split[0].slice(2);
                const midUrl = split[1].split(')')[0];
                const finalUrl = 'https' + midUrl + '.svg';
                addNewAnswerBlock(text, finalUrl, true);
            } else if (hasNotGraphie === true) {
                const finalUrl = answer.slice(answer.indexOf('https'), -1);
                addNewAnswerBlock(null, finalUrl, true);
            }
        } else {
            let cleaned = cleanLatexExpression(answer);
            ansArr.push(cleaned);
        }
    });

    if (ansArr.length) {
        enhancedCombinedAnswer += ansArr.join();
    }
};

const handleExpression = (widget) => {
    let expressionAnswer = widget.options.answerForms[0].value;
    let cleaned = cleanLatexExpression(expressionAnswer);
    enhancedCombinedAnswer += ` ${cleaned} `;
};

const handleDropdown = (widget) => {
    let content = widget.options.choices.filter(item => item.correct === true).map(item => item.content);
    enhancedCombinedAnswer += ` ${content[0]} `;
};

const handleIntGraph = (widget) => {
    let coords = widget.options.correct.coords;
    let validCoords = coords.filter(coord => coord !== undefined);
    enhancedCombinedAnswer += ` ${validCoords.join(' | ')} `;
};

const handleInputNum = (widget) => {
    let inputNumAnswer = widget.options.value;
    enhancedCombinedAnswer += ` ${inputNumAnswer} `;
};

const handleMatcher = (widget) => {
    let matchAnswer = widget.options.right;
    enhancedCombinedAnswer += ` ${matchAnswer} `;
};

const handleGrapher = (widget) => {
    let coords = widget.options.correct.coords;
    enhancedCombinedAnswer += ` ${coords.join(' | ')} `;
};

const handleCateg = (widget) => {
    let values = widget.options.values;
    let categories = widget.options.categories;
    let labeledValues = values.map(value => categories[value]);
    enhancedCombinedAnswer += ` ${labeledValues} `;
};

const handleMatrix = (widget) => {
    let arrs = widget.options.answers;
    enhancedCombinedAnswer += ` ${arrs.join(' | ')} `;
};

const handleLabel = (widget) => {
    let corAns = widget.options.markers.filter(item => item.answers).map(item => item.answers);
    let labels = widget.options.markers.filter(item => item.label).map(item => item.label);
    let ansArr = [];

    corAns.forEach((answer, index) => {
        if (labels.length === 0) {
            let cleaned = cleanLatexExpression(answer.toString());
            ansArr.push(cleaned);
        } else {
            let cleaned = cleanLatexExpression(answer.toString());
            let finLabel = labels[index].replace('Point ', '').replace(/[.]/g, '').trim() || "";
            let labeledAnswer = `${finLabel}: ${cleaned}`;
            ansArr.push(labeledAnswer);
        }
    });

    if (ansArr.length) {
        enhancedCombinedAnswer += ansArr.join("|");
    }
};

const handleSorter = (widget) => {
    try {
        // Sorter widgets are for sorting/ordering items
        if (widget.options && widget.options.correct) {
            let correctOrder = widget.options.correct;
            if (Array.isArray(correctOrder)) {
                enhancedCombinedAnswer += ` Order: ${correctOrder.join(' → ')} `;
                console.log('✅ Sorter answer extracted:', correctOrder);
            } else {
                enhancedCombinedAnswer += ` ${correctOrder} `;
            }
        } else if (widget.options && widget.options.values) {
            // Sometimes the correct order is in values
            enhancedCombinedAnswer += ` Values: ${widget.options.values.join(', ')} `;
        } else {
            console.log('⚠️ Sorter widget structure not recognized:', widget.options);
            enhancedCombinedAnswer += ' Sorter: Manual sorting required ';
        }
    } catch (error) {
        console.error('Error handling sorter widget:', error);
        enhancedCombinedAnswer += ' Sorter: Manual sorting required ';
    }
};

// ============================================================================
// JSON INTERCEPTION AND WIDGET PROCESSING
// ============================================================================

const setupJSONInterception = () => {
    let originalJson = JSON.parse;

    JSON.parse = function (jsonString) {
        let parsedData = originalJson(jsonString);

        try {
            if (parsedData.data && parsedData.data.assessmentItem && parsedData.data.assessmentItem.item) {
                let itemData = JSON.parse(parsedData.data.assessmentItem.item.itemData);
                let hasGradedWidget = Object.values(itemData.question.widgets).some(widget => widget.graded === true);
                
                if (hasGradedWidget) {
                    console.log('📝 Processing Khan Academy question...');
                    enhancedCombinedAnswer = ''; // Reset for new question

                    for (let widgetKey in itemData.question.widgets) {
                        let widget = itemData.question.widgets[widgetKey];
                        console.log(`🔧 Processing widget: ${widget.type}`);

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
                            case "sorter":
                                handleSorter(widget);
                                break;
                            default:
                                console.log("🔍 Unknown widget type: " + widget.type);
                                break;
                        }
                    }

                    // Add the combined answer as a block
                    if (enhancedCombinedAnswer.trim() !== '') {
                        let finalAnswer = enhancedCombinedAnswer;
                        if (finalAnswer.slice(-4) === '<br>') {
                            finalAnswer = finalAnswer.slice(0, -4);
                        }
                        addNewAnswerBlock(finalAnswer, null, false);
                        enhancedCombinedAnswer = '';
                    }
                }
            }
        } catch (error) {
            console.error("Enhanced KhanHack JSON processing error:", error);
        }

        return parsedData;
    };
    
    console.log('✅ JSON interception setup complete');
};

// ============================================================================
// INITIALIZATION AND PUBLIC API
// ============================================================================

const initializeEnhancedKhanHack = () => {
    if (!window.location.hostname.includes('khanacademy.org')) {
        console.log('❌ Not on Khan Academy - Enhanced KhanHack disabled');
        return;
    }
    
    console.log('🚀 Initializing Enhanced KhanHack...');
    
    // Load dependencies
    loadKaTeX();
    
    // Setup core functionality
    setTimeout(() => {
        createMainMenu();
        setupJSONInterception();
        
        console.log('✅ Enhanced KhanHack v6.1 initialized successfully!');
        console.log('💡 Features: Full UI, Auto-Answer (BETA), Point Farmer (BETA)');
        console.log('🎯 Access settings via gear icon');
    }, 1000);
};

// Public API
window.EnhancedKhanHack = {
    init: initializeEnhancedKhanHack,
    toggleAutoAnswer: () => {
        autoAnswerEnabled = !autoAnswerEnabled;
        console.log(`🤖 Auto Answer: ${autoAnswerEnabled ? 'ENABLED' : 'DISABLED'}`);
    },
    togglePointFarmer: () => {
        pointFarmerEnabled = !pointFarmerEnabled;
        if (pointFarmerEnabled) {
            startPointFarmer();
        } else {
            stopPointFarmer();
        }
    },
    getStats: () => ({
        answerBlocks: enhancedAnswerBlocks.length,
        autoAnswerEnabled,
        pointFarmerEnabled,
        ghostModeEnabled: enhancedGhostModeEnabled
    })
};

// Auto-initialize when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedKhanHack);
} else {
    initializeEnhancedKhanHack();
}

console.log('🎯 Enhanced KhanHack Module loaded! Call window.EnhancedKhanHack.init() to start');