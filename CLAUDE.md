# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Japanese Sentence Analyzer (日本語文章解析器)** - An AI-powered Japanese sentence analysis tool for Chinese learners using the Gemini 2.5 Flash model to analyze, break down sentence structures, annotate parts of speech, and provide pronunciation and translations.

## Technology Stack

- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4 with Material Design Web Components
- **UI Components**: @material/web v2.3, react-icons, react-markdown
- **Runtime**: Node.js (deployed on Vercel)
- **AI Integration**: Google Gemini 2.5 Flash API
- **Development**: ESLint 9 with Next.js TypeScript rules

## Development Commands

```bash
# Development server with Turbopack (fastest)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Run tests
npm run test
```

## Architecture Overview

### Core Application Structure
- **App Router**: Next.js 13+ app directory structure
- **API Routes**: Server-side API handlers in `app/api/`
- **Client Components**: React components in `app/components/`
- **Services Layer**: API communication in `app/services/api.ts`
- **Context**: Theme management via React Context

### Key Features Architecture

1. **Japanese Text Analysis**
   - Stream-based AI analysis using Gemini API
   - Token-based morphological analysis (word, pos, furigana, romaji)
   - JSON parsing with error handling for streaming responses

2. **Multi-Modal Capabilities**
   - OCR text extraction from images
   - Text-to-Speech (TTS) with Edge and Gemini providers
   - Real-time translation

3. **Authentication System**
   - Optional password protection via environment variables
   - API key management (user-provided or server-configured)

4. **Streaming Architecture**
   - Real-time AI responses using Server-Sent Events
   - Debounced UI updates for performance
   - Progressive content parsing

### API Endpoints

- `/api/analyze` - Japanese sentence morphological analysis
- `/api/translate` - Japanese to Chinese translation
- `/api/word-detail` - Individual word detailed explanations
- `/api/image-to-text` - OCR text extraction
- `/api/tts` - Text-to-speech synthesis
- `/api/chat` - AI chat assistant
- `/api/auth` - Authentication verification

### Environment Configuration

Required environment variables:
- `API_KEY` - Gemini API key (required)
- `API_URL` - Custom API endpoint (optional, defaults to Google's)
- `CODE` - Access password for authentication (optional)

### Component Architecture

**Main Page (`app/page.tsx`)**
- State management for analysis, authentication, settings
- Orchestrates all major features and components

**Core Components:**
- `InputSection` - Text input with OCR support
- `AnalysisResult` - Displays tokenized analysis with interactive elements
- `TranslationSection` - Shows translation results
- `AIChat` - Floating chat assistant
- `SettingsModal` - API configuration and preferences
- `TopToolbar` - Theme toggle and settings access

**Services (`app/services/api.ts`)**
- Centralized API communication layer
- Both streaming and non-streaming variants for all endpoints
- Error handling and response parsing

### Data Models

```typescript
interface TokenData {
  word: string;
  pos: string;        // Part of speech
  furigana?: string;  // Hiragana reading
  romaji?: string;    // Romanized reading
}

interface WordDetail {
  originalWord: string;
  chineseTranslation: string;
  pos: string;
  furigana?: string;
  romaji?: string;
  dictionaryForm?: string;
  explanation: string;
}
```

### Development Guidelines

1. **API Integration**: All AI features should support both streaming and non-streaming modes
2. **Error Handling**: Implement graceful degradation for API failures
3. **Performance**: Use debounced updates for streaming responses
4. **Accessibility**: Maintain Material Design accessibility standards
5. **Internationalization**: Interface supports Chinese (Simplified) primary language
6. **Design**: Use Interface-archtects to design wireframe, user-flow, Desgin Guide Lines and put it in Desgin Folder

### Testing

- Simple assertion-based tests in `tests/api.test.ts`
- Manual testing recommended for AI integration features
- Test command: `npm run test` (runs with tsx)

### Deployment

- **Platform**: Vercel (configured via `vercel.json`)
- **Build**: Next.js static optimization
- **Environment**: Production variables required for API_KEY

## Important Notes

- The application integrates with Google Gemini API for all AI features
- Supports both server-side API keys and user-provided API keys
- Material Design Web Components require specific styling considerations
- Theme switching includes system preference detection with local storage persistence