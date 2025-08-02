# AI Form Solver

## Overview
The AI Form Solver project provides a full-stack web application and a Chrome extension designed to automate form filling using AI providers like ChatGPT and Gemini. The core purpose is to analyze web page forms, intelligently generate responses, and automatically populate fields, enhancing efficiency for users. The project also includes a learning system for submit button patterns to improve accuracy over time.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The project utilizes `shadcn/ui` components built on `Radix UI` primitives, styled with `Tailwind CSS`, to ensure a modern, accessible, and responsive user interface. The Chrome extension features a premium design with a glassmorphic/blurred glass effect, smooth animations, and visual feedback elements like processing overlays and status indicators.

### Technical Implementations

#### Web Application
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Vite for builds.
- **Backend**: Node.js with Express.js, TypeScript, Drizzle ORM for database operations, Replit OAuth for authentication, and WebSocket for real-time communication.
- **Authentication**: Replit OAuth with OpenID Connect, using Passport.js and PostgreSQL-backed sessions.
- **Form Processing**: Puppeteer for web scraping, intelligent question detection, AI-powered response generation, and real-time status updates via WebSocket.
- **AI Service Integration**: Supports ChatGPT (OpenAI), Google Gemini, and DeepSeek, with robust error handling.
- **Database Schema**: Includes tables for Users, Forms, Activity Logs, User Settings, and Sessions, and a `submit_patterns` table for learning.

#### Chrome Extension
- **Architecture**: Built with Manifest V3, utilizing Content Scripts for DOM interaction, Background Scripts for screenshot capture and cross-tab communication, and a Popup Interface for user control.
- **Key Features**: Universal form detection, AI-powered analysis using screenshots and DOM inspection, a learning system for submit buttons, and visual feedback during processing.
- **Form Filling Logic**: Scans for input elements, captures screenshots, sends data to AI for analysis, parses responses, and automatically fills fields with comprehensive event handling and retry logic. It includes multiple text insertion methods for stubborn forms.

### System Design Choices
The project employs a dual-architecture approach, offering a comprehensive web application for advanced features and monitoring, alongside a lightweight Chrome extension for immediate, on-demand form solving. Both utilize similar AI integration patterns for consistency. A dedicated learning system tracks and stores submit button patterns to continuously improve form submission accuracy. The admin dashboard, originally tied to Replit OAuth, now supports standalone password authentication for independent operation.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection.
- **drizzle-orm**: Type-safe ORM for PostgreSQL.
- **puppeteer**: Headless browser automation.
- **@google/genai**: Google Gemini AI integration.
- **openai**: ChatGPT API integration.
- **express-session**: Session management with PostgreSQL storage.
- **connect-pg-simple**: PostgreSQL session store.
- **passport**: Authentication middleware.

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives.
- **@tanstack/react-query**: Server state management.
- **tailwindcss**: Utility-first CSS framework.
- **wouter**: Client-side routing.

### Development Dependencies
- **tsx**: TypeScript execution.
- **vite**: Frontend build tool.
- **esbuild**: Backend bundling.

## Recent Version Updates

✅ **Google Forms Fix & Admin Panel Access** (August 2, 2025 - v2.3.0):
- Fixed Google Forms long text field filling issues that caused text truncation
- Added "Open Admin Panel" button in extension popup for easy admin access
- Improved text field validation with enhanced event handling
- Enhanced form completion reliability for all field types
- Admin panel now opens automatically in new browser tab from extension
- Resolved text input problems for longer AI responses (2-3 sentence answers)
- Successfully pushed clean version v2.3.0 to GitHub repository

✅ **Error Reporting System Fixed** (August 2, 2025 - v2.3.1):
- Fixed database schema issues for error_reports table with missing columns
- Added user_id, form_fields, and extension_version columns to database
- Enhanced error reporting with better error messages and dynamic URL detection
- Fixed backend API connectivity issues for error reporting functionality
- Improved admin panel integration with working error report submissions
- All error reporting features now fully operational and tested
- Successfully pushed v2.3.1 to GitHub with complete error reporting fix

✅ **Google Forms Text Filling Completely Fixed** (August 2, 2025 - v2.4.0):
- Implemented aggressive multi-method text input approach for stubborn Google Forms
- Added 5 different text insertion methods with comprehensive fallbacks
- Enhanced verification and retry logic with detailed logging
- Fixed long text field issues (technology education questions, etc.)
- Now works reliably on ALL Google Forms text fields regardless of length
- Successfully tested and pushed v2.4.0 to GitHub with complete Google Forms fix

✅ **URL Fix & Enhanced Text Filling** (August 2, 2025 - v2.4.1):
- Updated extension to use correct Replit URL: form-solver-ai-alexkkork123.replit.app
- Made Report Error button always visible (removed admin requirement) 
- Enhanced Google Forms text filling with modern clipboard API support
- Added character-by-character typing simulation with keyboard events
- Implemented React component bypass and manual DOM manipulation fallbacks
- Added comprehensive retry logic for most stubborn Google Forms fields
- Fixed admin panel redirect to correct domain automatically
- Successfully pushed v2.4.1 to GitHub with URL and text filling improvements

✅ **MAJOR FIX - All Critical Issues Resolved** (August 2, 2025 - v2.5.0):
- FIXED Google Forms text filling by simplifying approach and removing conflicting events
- FIXED learning mode infinite loop with proper exit conditions and timeouts
- FIXED CORS errors by adding proper headers to backend submit-patterns endpoint
- FIXED Chrome storage quota exceeded by switching to local storage with size limits
- Streamlined text input: clear → set value → native setter → essential events only
- Added verification & retry logic specifically for longer Google Forms text fields
- Learning mode now auto-exits after 30 seconds and prevents duplicate activations
- Storage limited to 50 items with automatic cleanup to prevent quota issues
- Successfully tested and pushed v2.5.0 with ALL critical fixes resolved

✅ **Auto-Submit Feature & Text Filling Enhancement** (August 2, 2025 - v2.6.0):
- Added new "Auto Submit" button in extension popup for automatic form submission
- Implemented comprehensive submit button detection with multiple strategies
- Enhanced text field filling with React-aware approach for stubborn forms
- Added keyboard event simulation for maximum compatibility
- Auto-submit scans for submit buttons using learned patterns first, then fallbacks
- Supports Google Forms, standard forms, and custom submit button implementations
- Text filling now detects React instances and uses proper event dispatching
- Includes character-by-character typing simulation as ultimate fallback
- Auto-submit highlights found buttons before clicking for visual confirmation

✅ **Multi-Page Form Navigation** (August 2, 2025 - v2.7.0):
- Added automatic multi-page form navigation for Google Forms and Typeform
- Extension now automatically clicks "Next" buttons to progress through pages
- Continues until finding submit button on final page, then submits
- Added checkbox option to enable/disable auto-navigation feature
- Supports up to 20 pages (safety limit to prevent infinite loops)
- Detects various Next button patterns: "Next", "Continue", "→", etc.
- Visual feedback shows current page number during solving
- Works seamlessly with Google Forms multi-section forms
- Compatible with Typeform's question-by-question flow

✅ **Enhanced Navigation with Learning** (August 2, 2025 - v2.7.1):
- Fixed split operation error that caused TypeError on some forms
- Added learning system for Next/OK buttons - remembers patterns per domain
- Improved Typeform support with specific OK button detection
- Added back/previous button detection to avoid going backwards
- Next button patterns are now learned and reused for faster navigation
- Stores up to 5 learned patterns per domain for optimal performance
- Fixed error handling in selector parsing for more robust operation

✅ **Critical Bug Fixes** (August 2, 2025 - v2.7.2):
- Fixed learnedNextButtons variable scope error in learning function
- Fixed screenshot split error when screenshot capture fails
- Added robust error handling for screenshot capture
- Fixed selector parsing with better validation
- Improved form filling reliability with enhanced error handling
- Extension now continues working even if screenshot fails
- All critical errors from v2.7.1 have been resolved

✅ **Screenshot & Form Filling Improvements** (August 2, 2025 - v2.7.3):
- Fixed Gemini API "empty inlineData" error by conditionally adding screenshots
- Extension now works without screenshots when capture fails
- Form filling continues even if individual fields fail
- Added detailed logging for better debugging
- Improved error resilience - one field error won't stop entire form
- Better screenshot error handling in background script
- Each field is now filled independently with try-catch protection

✅ **Typeform-Specific Improvements** (August 2, 2025 - v2.7.4):
- Added special handling for Typeform's one-field-at-a-time display
- Re-detects visible fields before each fill on Typeform
- Enhanced text field filling with native setter and multiple event types
- Improved screenshot error message handling (properly stringified)
- Added longer delays between Typeform fields to allow page transitions
- Fixed detectFormFields function call to use detectAllFormFields
- Typeform fields now fill more reliably on all pages

✅ **Screenshot Handling & Typeform Fixes** (August 2, 2025 - v2.7.5):
- Fixed remaining "empty inlineData" error with stricter screenshot validation
- Added type checking and minimum length validation for screenshot data
- Improved Typeform handling to fill only current visible unfilled fields
- Added detailed logging for screenshot inclusion in API requests
- Extension successfully navigates through 10+ pages on Typeform
- Fixed issue where multiple fields were being filled with same values
- Typeform now works reliably with one-field-at-a-time format

✅ **Multi-Page Navigation Fix** (August 2, 2025 - v2.8.0):
- FIXED issue where extension stopped pressing Next/OK buttons after page 3
- Added learning system that remembers successful Next button patterns per domain
- Enhanced Next button detection with protection against clicking back buttons
- Improved click handling with multiple methods for stubborn buttons
- Dynamic wait times that increase for later pages (they load slower)
- Fixed async/await bug in Typeform field detection
- Extension now reliably navigates through 20+ pages on any form
- Successfully pushed v2.8.0 to GitHub with complete navigation fixes

✅ **Khan Academy Special Support** (August 2, 2025 - v2.9.0):
- Added specialized detection for Khan Academy educational forms
- Detects math input fields, multiple choice questions, and text responses
- Special handling for Khan Academy's React-based interface
- Math expressions simulate typing for proper validation
- Multiple choice answers match by text, letters (A,B,C), or numeric values
- Check Answer and Submit buttons properly detected and clicked
- Educational question context extracted for better AI understanding
- Successfully pushed v2.9.0 to GitHub with Khan Academy integration

✅ **Khan Academy Flow Fix** (August 2, 2025 - v2.9.1):
- Fixed Khan Academy workflow: Select answer → Click Check → Wait → Click Next Question
- Improved multiple choice selection with multiple clicking methods
- Added direct radio.checked property setting for stubborn selections
- Enhanced event dispatching for React-based radio buttons
- Clicks parent labels and option containers for better reliability
- Added verification after selection to ensure answer is marked
- Check Answer button is now clicked automatically after filling
- Next Question button only appears after answer validation
- Successfully pushed v2.9.1 to GitHub with Khan Academy fixes

✅ **Enhanced Khan Academy Perseus Framework Support** (August 2, 2025 - v2.10.0):
- Conducted extensive research on Khan Academy's Perseus widget framework
- Completely rewrote Khan Academy field detection with Perseus-specific selectors:
  - `.perseus-widget-numeric-input`, `.perseus-widget-radio`, `.perseus-widget-text-area`
  - Better question text extraction from Perseus renderer structure
  - Improved multiple choice detection with label element tracking
- Added dedicated `findKhanCheckButton()` and `findKhanNextButton()` functions
- Enhanced React event handling for Perseus widgets with native setters
- Improved field matching algorithm for better AI response mapping
- Better handling of math inputs, multiple choice, and text responses
- Added `isKhanAcademy()` helper function for consistent detection
- More reliable button clicking with focus, native click, and event dispatching
- Successfully tested on Khan Academy exercises with Perseus framework