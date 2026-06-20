# Relay AI Assistant

Relay is an enterprise-style personal AI assistant workspace built with Next.js 16, React 19, Tailwind CSS, CopilotKit, Google Workspace OAuth, and local no-key tools.

The app includes:

- Auth, sign-up, reset, verification, and Google OAuth entry screens
- Google onboarding for Calendar, Drive, Gmail, Tasks, and Contacts permissions
- Dashboard, chat, calendar, tasks, files, memory, integrations, and settings views
- Generated UI surfaces for scheduling, tasks, email approval, file intelligence, and memory consent
- Local no-key task, note, briefing, calculator, and export routes
- Provider abstraction for Gemini, OpenRouter, OpenAI, and Anthropic

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Configure AI

Start free development with OpenRouter:

```bash
AI_PROVIDER=openrouter
AI_MODEL=openrouter/free
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
NEXT_PUBLIC_ENABLE_COPILOTKIT=true
```

Gemini is still supported when it is available for your region/account:

```bash
AI_PROVIDER=gemini
AI_MODEL=google/gemini-2.5-flash
GEMINI_API_KEY=
NEXT_PUBLIC_ENABLE_COPILOTKIT=true
```

Provider switching lives in `src/lib/ai/provider.ts`.

## Configure Google OAuth

Create a Google Cloud OAuth web client:

```text
Origin: http://localhost:3000
Redirect URI: http://localhost:3000/api/auth/callback/google
```

Then set:

```bash
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

More detail is in `README_AGENT_SETUP.md`.

## Verify

```bash
npm run lint
npm run build
```
