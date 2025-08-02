# AI Form Solver

## Overview
The AI Form Solver project delivers a full-stack web application and a Chrome extension to automate form filling using AI. Its primary purpose is to analyze web forms, intelligently generate responses via AI providers (like ChatGPT and Gemini), and automatically populate fields, significantly improving user efficiency. The system incorporates a learning mechanism for submit button patterns to enhance accuracy over time. The project envisions streamlining repetitive data entry tasks, offering a competitive advantage in automation tools, and continuously evolving its AI-driven capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The project leverages `shadcn/ui` components, built on `Radix UI` primitives and styled with `Tailwind CSS`, to provide a modern, accessible, and responsive user interface. The Chrome extension is designed with a premium aesthetic, featuring glassmorphic/blurred glass effects, smooth animations, and clear visual feedback like processing overlays and status indicators.

### Technical Implementations

#### Web Application
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, and Vite for builds.
- **Backend**: Node.js with Express.js, TypeScript, Drizzle ORM for database operations, Replit OAuth for authentication, and WebSockets for real-time communication.
- **Authentication**: Replit OAuth with OpenID Connect, supported by Passport.js and PostgreSQL-backed sessions.
- **Form Processing**: Utilizes Puppeteer for web scraping, intelligent question detection, AI-powered response generation, and real-time status updates via WebSocket.
- **AI Service Integration**: Supports OpenAI (ChatGPT), Google Gemini, and DeepSeek, with robust error handling.
- **Database Schema**: Includes tables for Users, Forms, Activity Logs, User Settings, Sessions, and a `submit_patterns` table for learned behaviors.

#### Chrome Extension
- **Architecture**: Manifest V3 based, employing Content Scripts for DOM interaction, Background Scripts for screenshot capture and inter-tab communication, and a Popup Interface for user control.
- **Key Features**: Universal form detection, AI-powered analysis via screenshots and DOM inspection, a learning system for submit buttons, multi-page form navigation, and visual feedback during processing. It includes specialized support for platforms like Google Forms, Typeform, and Khan Academy, with multiple text insertion methods for challenging fields.
- **Form Filling Logic**: Scans input elements, captures screenshots, dispatches data to AI for analysis, parses AI responses, and automatically fills fields with comprehensive event handling and retry logic.

### System Design Choices
The project adopts a dual-architecture approach, combining a comprehensive web application for advanced features and monitoring with a lightweight Chrome extension for immediate, on-demand form solving. Both components share consistent AI integration patterns. A dedicated learning system tracks and stores submit button and navigation patterns to continuously improve form submission and multi-page navigation accuracy. The admin dashboard supports both Replit OAuth and standalone password authentication.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection.
- **drizzle-orm**: Type-safe ORM for PostgreSQL.
- **puppeteer**: Headless browser automation.
- **@google/genai**: Google Gemini AI integration.
- **openai**: ChatGPT API integration.
- **express-session**: Session management.
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