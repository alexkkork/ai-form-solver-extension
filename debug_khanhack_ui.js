// Debug KhanHack UI Issues

console.log('🔍 Debugging KhanHack UI...');

// Check if the script is running at all
console.log('✅ Debug script is running');

// Check if mainMenu exists
const existingMenu = document.getElementById('mainMenu');
if (existingMenu) {
    console.log('✅ MainMenu found:', existingMenu);
    console.log('📊 MainMenu styles:', {
        display: existingMenu.style.display,
        position: existingMenu.style.position,
        zIndex: existingMenu.style.zIndex,
        visibility: existingMenu.style.visibility,
        opacity: existingMenu.style.opacity
    });
} else {
    console.log('❌ MainMenu not found - creating it manually...');
    
    // Create the menu manually for testing
    const testMenu = document.createElement('div');
    testMenu.id = 'testMainMenu';
    testMenu.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        width: 300px;
        height: 400px;
        background-color: #123576;
        border: 3px solid #07152e;
        border-radius: 20px;
        padding: 10px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
    `;
    
    testMenu.innerHTML = `
        <h2 style="margin: 10px 0; color: white;">🤖 KhanHack Test Menu</h2>
        <p style="color: white; text-align: center;">If you can see this, the UI system works!</p>
        <button onclick="this.parentElement.remove()" style="margin-top: 20px; padding: 10px; background: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Test Menu</button>
        <div style="margin-top: 20px; font-size: 12px; opacity: 0.8; text-align: center;">
            This is a test version.<br>
            If this appears, the original should work too.
        </div>
    `;
    
    document.body.appendChild(testMenu);
    console.log('✅ Test menu created and added to page');
}

// Check if we're on Khan Academy
const isKhanAcademy = window.location.hostname.includes('khanacademy.org');
console.log('🌐 On Khan Academy:', isKhanAcademy);
console.log('🌐 Current URL:', window.location.href);

// Check if userscript environment is available
console.log('🔧 UserScript environment checks:');
console.log('  - window.GM_info:', typeof window.GM_info !== 'undefined');
console.log('  - Tampermonkey:', typeof window.GM_setValue !== 'undefined');
console.log('  - Greasemonkey:', typeof GM !== 'undefined');

// Check document ready state
console.log('📄 Document ready state:', document.readyState);

// Check for any JavaScript errors
window.addEventListener('error', (e) => {
    console.error('🚨 JavaScript error detected:', e.error);
});

// Try to manually run the KhanHack setup
console.log('\n🚀 Attempting to manually create KhanHack menu...');

function createKhanHackMenuManually() {
    // Remove any existing menu first
    const existing = document.getElementById('mainMenu');
    if (existing) existing.remove();
    
    const mainMenu = document.createElement('div');
    mainMenu.id = 'mainMenu';
    mainMenu.style.cssText = `
        position: fixed !important;
        bottom: 10px !important;
        left: 200px !important;
        width: 300px !important;
        height: 400px !important;
        background-color: #123576 !important;
        border: 3px solid #07152e !important;
        border-radius: 20px !important;
        padding: 10px !important;
        color: white !important;
        font-family: "Noto Sans", Arial, sans-serif !important;
        font-weight: 500 !important;
        z-index: 999999 !important;
        display: flex !important;
        flex-direction: column !important;
    `;
    
    mainMenu.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <img src="https://i.ibb.co/h2GFJ5f/khanhack.png" style="width: 130px; margin-bottom: 20px;" />
            <h3 style="color: white; margin: 10px 0;">🤖 KhanHack + Gemini</h3>
            <p style="color: white; font-size: 14px; margin: 10px 0;">Manual UI Test</p>
            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 10px; margin: 10px 0;">
                <p style="margin: 5px 0; font-size: 12px;">Q1-2: 🤖 Gemini AI</p>
                <p style="margin: 5px 0; font-size: 12px;">Q3+: 📚 Khan API</p>
            </div>
            <button onclick="location.reload()" style="padding: 10px 20px; background: #2967d9; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 10px;">Reload Page</button>
            <button onclick="this.closest('#mainMenu').remove()" style="padding: 10px 20px; background: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 10px;">Close Menu</button>
        </div>
    `;
    
    document.body.appendChild(mainMenu);
    console.log('✅ Manual KhanHack menu created!');
    return mainMenu;
}

// Wait for page to be ready, then create menu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createKhanHackMenuManually);
} else {
    createKhanHackMenuManually();
}

console.log('\n📋 Debug Summary:');
console.log('1. Check if you see a test menu on the left side');
console.log('2. Check if you see a KhanHack menu on the right side');
console.log('3. Check console for any red error messages');
console.log('4. If neither appear, there may be a userscript installation issue');