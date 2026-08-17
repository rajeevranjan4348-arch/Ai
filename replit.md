# AI Research Assistant (Perplexity Clone)

## Overview
An AI-powered research assistant built with React, Vite, and the Blink SDK. It allows users to perform quick searches and deep research queries with citation-backed answers and integrated web search capabilities.

## Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Package Manager**: npm
- **Styling**: Tailwind CSS + Shadcn/UI components
- **AI Integration**: @blinkdotnew/sdk + @blinkdotnew/react (Google Gemini models)
- **Animations**: Framer Motion + GSAP
- **Routing**: React Router DOM

## Project Structure
- `/src/components` - React components (layout, research, ui)
- `/src/features/research` - Core agent logic (search and research agents)
- `/src/hooks` - Custom React hooks
- `/src/lib` - Utilities and SDK initialization
- `/functions` - Edge functions (e.g., suggestions)
- `/public` - Static assets

## Configuration
- Vite dev server runs on port 5000, host 0.0.0.0
- `allowedHosts: true` for Replit proxy compatibility
- Environment variables in `.env.local`:
  - `VITE_BLINK_PROJECT_ID`
  - `VITE_BLINK_PUBLISHABLE_KEY`

## Running the App
```bash
npm run dev
```

## Deployment
- Target: Static
- Build command: `npm run build`
- Public directory: `dist`
