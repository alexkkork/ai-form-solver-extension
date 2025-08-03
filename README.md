# 🚀 Enhanced AI Form Solver with KhanHack Integration

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensions/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-green.svg)](https://openai.com/)

**🤖 Automatically solve any form using AI + Advanced Khan Academy Enhancement System**

## ✨ Features Overview

### 🎯 **Core AI Form Solver**
- **Universal Form Detection**: Works on any website with HTML forms
- **AI-Powered Filling**: Uses ChatGPT or Gemini to intelligently fill forms  
- **Google Forms Specialist**: Optimized detection for Google Forms elements
- **Screenshot Analysis**: Takes page screenshots for AI context
- **Learning System**: Remembers submit button patterns after processing forms

### 🎓 **Advanced Khan Academy Integration**
- **🤖 Dual AI System**: Gemini for first 2 questions, Khan API for subsequent ones
- **📊 Comprehensive Widget Support**: Handles all Khan Academy question types
- **🎨 Enhanced UI**: Beautiful KhanHack-style interface with smart answer cycling
- **🔬 BETA Auto-Answer**: Automatically fills and submits answers
- **🌾 BETA Point Farmer**: Automated question cycling for point collection
- **👻 Ghost Mode**: Stealth transparent menu mode
- **🖼️ Image Support**: Full web+graphie and regular image handling
- **📐 LaTeX Rendering**: Perfect mathematical expression display

## 🛠️ Supported Question Types

### Khan Academy Widgets
- ✅ **numeric-input** - Text/number inputs
- ✅ **radio** - Multiple choice questions  
- ✅ **expression** - Mathematical expressions
- ✅ **dropdown** - Selection dropdowns
- ✅ **interactive-graph** - Graph coordinates
- ✅ **grapher** - Graphing widgets
- ✅ **input-number** - Number inputs
- ✅ **matcher** - Matching exercises
- ✅ **categorizer** - Category sorting
- ✅ **label-image** - Image labeling
- ✅ **matrix** - Matrix problems
- ✅ **sorter** - Sorting/ordering questions

## 🚀 Installation

1. **Download** or clone this repository
2. Open **Chrome** and go to `chrome://extensions/`
3. Enable **"Developer mode"** (top right toggle)
4. Click **"Load unpacked"** and select the extension folder
5. The **AI Form Solver** icon will appear in your toolbar

## 💡 Usage

### For General Forms
1. Navigate to any form (Google Forms works great!)
2. Click the extension icon
3. Choose **"Detect Fields"** to see all form elements highlighted
4. Click **"Solve Form"** to watch AI automatically fill the form
5. Use **"Learn Submit"** to teach the extension submit button locations

### For Khan Academy (Enhanced Mode)
1. Navigate to **Khan Academy** exercises
2. **Automatic activation** - both modules load automatically
3. **First 2 questions**: Powered by Gemini AI with smart prompts
4. **Questions 3+**: Uses Khan API interception for instant answers
5. **Access BETA features**: Click gear icon in bottom-left menu

#### 🔬 BETA Features
- **Auto-Answer**: Enable in settings for automatic form filling
- **Point Farmer**: Automated question cycling (use responsibly)
- **Ghost Mode**: Makes UI transparent until hover
- **Smart Answer Cycling**: Manages multiple answers intelligently

## 🔑 API Keys

The extension comes with API keys included. You can update them:

### Via Popup Interface
- **OpenAI**: For ChatGPT integration  
- **Gemini**: For Google AI integration

### Via Console (Khan Academy)
```javascript
// Set Gemini API key
window.setGeminiApiKey('your-api-key-here');

// Reset question count
window.resetKhanQuestionCount();
```

## 📁 File Structure

```
├── manifest.json              # Extension configuration
├── content.js                 # Core form detection & AI integration
├── inject.js                  # Khan Academy API interception
├── khanhack-enhanced.js       # 🆕 Advanced KhanHack features
├── popup.html/js              # Extension popup interface
├── background.js              # Screenshot capture & storage
├── content.css                # Styling for notifications
├── khan-api.js                # Khan Academy API utilities
├── utils.js                   # Utility functions
├── icons/                     # Professional gradient icons
└── README.md                  # This file
```

## 🎮 Console Commands (Khan Academy)

```javascript
// View extension statistics
AIFormSolver.stats()

// Enhanced KhanHack controls
window.EnhancedKhanHack.getStats()
window.EnhancedKhanHack.toggleAutoAnswer()
window.EnhancedKhanHack.togglePointFarmer()

// Reset question count (starts over with Gemini)
localStorage.setItem('khan_question_count', '0'); location.reload();
```

## 🔧 Technical Details

### Core Technologies
- **Manifest V3** compatible
- **Zero conflicts** with IIFE wrapper pattern
- **Comprehensive selectors** for all form types
- **Async/await** error handling throughout
- **Chrome Storage API** for learning and preferences

### Khan Academy Integration
- **JSON.parse override** for real-time answer extraction
- **Fetch interception** for API response capture
- **Dynamic widget processing** with 12+ supported types
- **KaTeX integration** for mathematical rendering
- **Smart answer matching** with LaTeX support

### BETA Features Architecture
- **Auto-Answer System**: Configurable delays and form detection
- **Point Farmer**: Intelligent question cycling with detection avoidance
- **Ghost Mode**: CSS opacity manipulation with event listeners
- **Answer Block Management**: Smart cycling and cleanup algorithms

## 🧪 Development & Testing

### Test the Extension
1. Load the unpacked extension in Chrome
2. Visit Khan Academy math exercises
3. Watch dual-module integration in console
4. Test BETA features via settings menu

### Debug Console Outputs
```
🚀 Khan Academy SIMPLE Answer Guide v4.0 - FIXED VERSION
✅ Enhanced KhanHack v6.1 initialized successfully!
🎯 Khan API detected: [API URL]
📝 Processing Khan Academy question...
🔧 Processing widget: [widget-type]
✅ Auto-filled input: [answer]
```

## 🎯 Advanced Configuration

### Khan Academy Question Flow
```
Question 1-2: 🤖 Gemini AI (Smart prompts)
Question 3+:  📡 Khan API (Instant extraction)
```

### Auto-Answer Settings
- **Delay**: 500ms - 10s (configurable)
- **Types**: Numeric, Multiple Choice, Dropdown
- **Safety**: Visual feedback and confirmation

### Point Farmer Settings
- **Interval**: 5-second checks
- **Navigation**: Automatic subject rotation
- **Detection Avoidance**: Built-in delays and randomization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Original AI Form Solver**: Universal form detection and AI integration
- **KhanHack™**: Khan Academy enhancement framework and UI design
- **OpenAI**: ChatGPT API for intelligent form filling
- **Google**: Gemini AI for mathematical problem solving
- **Khan Academy**: Educational platform and API structure

## ⚠️ Disclaimer

This extension is for educational purposes. Users are responsible for:
- Complying with Khan Academy's Terms of Service
- Using BETA features responsibly
- Respecting rate limits and detection systems
- Following their institution's academic integrity policies

---

**Built with ❤️ for automatic form filling powered by AI**

*Enhanced with advanced Khan Academy integration and BETA automation features*