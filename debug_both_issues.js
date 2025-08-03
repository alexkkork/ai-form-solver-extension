// Debug Both Issues: Empty Green Tab + Missing KhanHack UI

console.log('🔍 Debugging Both Issues...');

// Issue 1: Check why green tab is empty
console.log('\n📱 GREEN TAB ANALYSIS:');
const greenTab = document.getElementById('khan-answer-guide');
if (greenTab) {
    console.log('✅ Green tab exists:', greenTab);
    console.log('📄 Green tab content:', greenTab.innerHTML);
    console.log('📄 Green tab text:', greenTab.textContent);
} else {
    console.log('❌ Green tab not found');
}

// Check if our extension is running
console.log('\n🔧 EXTENSION CHECK:');
console.log('- KHAN_ANSWERS:', window.KHAN_ANSWERS);
console.log('- showAnswerGuidance function:', typeof window.showAnswerGuidance);

// Issue 2: Check why KhanHack UI is missing
console.log('\n🎮 KHANHACK UI ANALYSIS:');
const khanHackMenu = document.getElementById('mainMenu');
if (khanHackMenu) {
    console.log('✅ KhanHack menu exists:', khanHackMenu);
    console.log('📊 Menu styles:', {
        display: khanHackMenu.style.display,
        visibility: khanHackMenu.style.visibility,
        opacity: khanHackMenu.style.opacity,
        zIndex: khanHackMenu.style.zIndex
    });
} else {
    console.log('❌ KhanHack menu not found');
    
    // Try to create it manually
    console.log('🔧 Creating KhanHack menu manually...');
    
    const mainMenu = document.createElement('div');
    mainMenu.id = 'mainMenu';
    mainMenu.style.cssText = `
        position: fixed !important;
        bottom: 10px !important;
        left: 10px !important;
        width: 300px !important;
        height: 400px !important;
        background-color: #123576 !important;
        border: 3px solid #07152e !important;
        border-radius: 20px !important;
        padding: 10px !important;
        color: white !important;
        font-family: Arial, sans-serif !important;
        z-index: 999999 !important;
        display: flex !important;
        flex-direction: column !important;
    `;
    
    mainMenu.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h2 style="color: white; margin: 10px 0;">🤖 KhanHack + Gemini</h2>
            <p style="color: white; font-size: 14px;">Debugging Version</p>
            
            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 10px; margin: 10px 0;">
                <div style="font-size: 12px; margin: 5px 0;">Q1-2: 🤖 Gemini AI</div>
                <div style="font-size: 12px; margin: 5px 0;">Q3+: 📚 Khan API</div>
            </div>
            
            <div id="debugAnswerList" style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 10px; margin: 10px 0;">
                <div style="font-size: 12px; color: #FFE082;">🔍 Waiting for answers...</div>
            </div>
            
            <button onclick="localStorage.setItem('khan_question_count', '0'); location.reload();" style="padding: 10px; background: #2967d9; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">Reset Count</button>
            
            <button onclick="this.closest('#mainMenu').remove()" style="padding: 10px; background: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">Close</button>
        </div>
    `;
    
    document.body.appendChild(mainMenu);
    console.log('✅ Manual KhanHack menu created!');
}

// Check userscript environment
console.log('\n🔧 USERSCRIPT ENVIRONMENT:');
console.log('- GM_info:', typeof GM_info !== 'undefined' ? 'Available' : 'Not available');
console.log('- Tampermonkey:', typeof GM_setValue !== 'undefined' ? 'Available' : 'Not available');
console.log('- Question count:', localStorage.getItem('khan_question_count') || '0');

// Check what question is detected
console.log('\n📝 QUESTION DETECTION:');
const questionElement = document.querySelector('.paragraph');
if (questionElement) {
    console.log('✅ Question found:', questionElement.textContent.trim());
} else {
    console.log('❌ No question element found');
}

// Monitor for any API calls or responses
console.log('\n👂 MONITORING API CALLS...');
const originalFetch = window.fetch;
window.fetch = function(...args) {
    if (args[0] && args[0].includes && args[0].includes('generativelanguage.googleapis.com')) {
        console.log('🤖 Gemini API call detected:', args[0]);
    }
    return originalFetch.apply(this, arguments).then(response => {
        if (args[0] && args[0].includes && args[0].includes('generativelanguage.googleapis.com')) {
            console.log('📨 Gemini response received:', response);
        }
        return response;
    });
};

// Monitor for answer display calls
if (window.showAnswerGuidance) {
    const originalShow = window.showAnswerGuidance;
    window.showAnswerGuidance = function(answers) {
        console.log('🎯 showAnswerGuidance called with:', answers);
        return originalShow.apply(this, arguments);
    };
}

// Test manual answer display
setTimeout(() => {
    console.log('\n🧪 TESTING MANUAL ANSWER DISPLAY...');
    if (window.showAnswerGuidance) {
        window.showAnswerGuidance([{
            type: 'numeric',
            answer: 'TEST ANSWER'
        }]);
        console.log('✅ Manual answer display test sent');
    } else {
        console.log('❌ No showAnswerGuidance function available');
    }
}, 2000);

console.log('\n📋 DEBUG SUMMARY:');
console.log('1. Check if KhanHack menu appeared on left side');
console.log('2. Check if green tab now shows content');
console.log('3. Look for any red error messages above');
console.log('4. Check if Gemini API calls are being made');
console.log('\n💡 If still not working, the userscript may not be properly installed');