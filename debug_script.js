// Khan Academy Auto Solver Debug Script
console.log('🔧 Starting Khan Academy Debug...');

// Check if we're on Khan Academy
if (!window.location.hostname.includes('khanacademy.org')) {
    console.log('❌ Not on Khan Academy!');
} else {
    console.log('✅ On Khan Academy');
}

// Check if inject.js loaded
if (window.showAnswerGuidance) {
    console.log('✅ showAnswerGuidance function exists');
} else {
    console.log('❌ showAnswerGuidance function missing - inject.js not loaded properly');
}

// Check question count
const questionCount = localStorage.getItem('khan_question_count') || '0';
console.log('📊 Current question count:', questionCount);

// Check if API key is set
chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
        console.log('✅ Gemini API key configured');
        console.log('🔑 Key starts with:', result.geminiApiKey.substring(0, 10) + '...');
    } else {
        console.log('❌ No Gemini API key found');
    }
});

// Test the display function manually
if (window.showAnswerGuidance) {
    console.log('🧪 Testing answer display with dummy data...');
    setTimeout(() => {
        window.showAnswerGuidance([{
            type: 'numeric',
            answer: '42'
        }]);
        console.log('📋 If you see a green tab with "42", the display works!');
    }, 2000);
} else {
    console.log('❌ Cannot test display - function not available');
}

// Check if Khan API interceptor is active
setTimeout(() => {
    if (window.KHAN_ANSWERS) {
        console.log('📦 KHAN_ANSWERS exists:', window.KHAN_ANSWERS);
    } else {
        console.log('❌ KHAN_ANSWERS not set');
    }
}, 3000);