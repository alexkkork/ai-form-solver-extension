# AI Form Solver Chrome Extension

🤖 Automatically solve any form using AI - works perfectly with Google Forms!

## Features
- **Universal Form Detection**: Works on any website with HTML forms
- **AI-Powered Filling**: Uses ChatGPT or Gemini to intelligently fill forms
- **Google Forms Specialist**: Optimized detection for Google Forms elements
- **Learning System**: Remembers submit button patterns after processing forms
- **Visual Feedback**: Beautiful animations and field highlighting
- **Screenshot Analysis**: Takes page screenshots for AI context

## Installation
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select the extension folder
5. The AI Form Solver icon will appear in your toolbar

## Usage
1. Navigate to any form (Google Forms works great!)
2. Click the extension icon
3. Choose "Detect Fields" to see all form elements highlighted
4. Click "Solve Form" to watch AI automatically fill the form
5. Use "Learn Submit" to teach the extension submit button locations

## API Keys
The extension comes pre-configured with API keys. You can update them in the popup:
- **OpenAI**: For ChatGPT integration
- **Gemini**: For Google AI integration

## Files Structure
- `manifest.json` - Extension configuration
- `content.js` - Main form detection and filling logic
- `popup.html/js` - Extension popup interface
- `background.js` - Screenshot capture and storage management
- `content.css` - Styling for notifications and highlights
- `icons/` - Professional gradient icons in all sizes

## Technical Details
- **Manifest V3** compatible
- **Zero conflicts** with IIFE wrapper pattern
- **Comprehensive selectors** for all form types
- **Async/await** error handling
- **Chrome Storage API** for learning and preferences

## Testing
Open `test-form.html` in your browser to test all functionality with a comprehensive form containing every field type.

## Ready for Production
This extension is fully tested, error-free, and ready for Chrome Web Store submission with professional icons and documentation.

---
Built with ❤️ for automatic form filling powered by AI
