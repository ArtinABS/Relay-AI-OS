# Daily Work Agent Copilot

This project is a production-oriented personal AI assistant workspace.

## Installed Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- CopilotKit runtime, React provider, sidebar UI, frontend actions, and A2UI
- Provider-abstracted AI runtime with Gemini, OpenRouter, OpenAI, and Anthropic config paths
- Google Workspace OAuth scopes and typed Google API clients
- Drizzle ORM with Postgres schema for users, integrations, tasks, memories, approvals, runs, and audit logs
- Inngest scheduled job route for background automation
- MCP SDK dependency for future external tool expansion

## First Environment Setup

Create `.env.local` from `.env.example` and fill the values you need.

```bash
AI_PROVIDER=openrouter
AI_MODEL=openrouter/free
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DATABASE_URL=
```

OpenRouter is the recommended free starting provider for this project because the `openrouter/free` router avoids Gemini regional availability issues and stays OpenAI-compatible through the provider layer.

To use Gemini instead, switch only environment configuration:

```bash
AI_PROVIDER=gemini
AI_MODEL=google/gemini-2.5-flash
GEMINI_API_KEY=
```

To use OpenAI:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=openai/gpt-4.1-mini
```

The runtime is centralized in `src/lib/ai/provider.ts`, so provider changes should not require rewriting tool code.

## Google Workspace OAuth

Google tools require OAuth credentials and per-user consent before they can call Google APIs.

The OAuth consent flow requests:

```text
openid
email
profile
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/tasks
https://www.googleapis.com/auth/contacts.readonly
```

For local Google OAuth, create a Google Cloud OAuth client with:

```text
Application type: Web application
Authorized JavaScript origin: http://localhost:3000
Authorized redirect URI: http://localhost:3000/api/auth/callback/google
```

Then copy the client ID and client secret into `.env.local`.

## No-Key Mode

You do not need an OpenAI key to test the first working path.

The homepage includes a `No-Key Local Agent` that can:

- chat with fixed backend rules
- report OAuth setup/sign-in status
- create, list, complete, and clear local tasks
- create, list, search, and delete local notes
- calculate simple arithmetic
- generate a deterministic briefing/focus summary
- export the local workspace as JSON

Local tasks and notes are stored in `.relay-data/`, which is ignored by git.

CopilotKit's full AI sidebar is hidden unless this is set:

```bash
NEXT_PUBLIC_ENABLE_COPILOTKIT=true
```

That full CopilotKit path still needs an LLM API key through the provider layer.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npx drizzle-kit generate
```

## Important Files

- `src/app/api/copilotkit/[...slug]/route.ts`: CopilotKit runtime endpoint
- `src/lib/ai/provider.ts`: LLM provider/model abstraction
- `src/app/api/ai/status/route.ts`: safe provider status endpoint
- `src/lib/agent/tools.ts`: backend tool registry
- `src/app/api/local-agent/chat/route.ts`: no-key local agent command router
- `src/app/api/local-tools/*`: task, note, briefing, and export routes
- `src/lib/google/*`: Google scopes, clients, and Workspace wrappers
- `src/lib/db/schema.ts`: durable agent storage schema
- `src/components/copilot/*`: CopilotKit provider and frontend UI actions
- `src/components/workspace/assistant-os.tsx`: auth, onboarding, dashboard, chat, and generated UI shell
- `src/components/dashboard/agent-dashboard.tsx`: entry component for the workspace shell
