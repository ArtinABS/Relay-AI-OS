# Backend Pipeline

This app has two agent paths:

1. `No-Key Local Agent`
   - Browser sends a message to `POST /api/local-agent/chat`.
   - The route reads the user's Google login session with NextAuth.
   - The route uses simple rules to decide what to do.
   - For calendar questions, it calls Google Calendar with the OAuth token.
   - The route returns a plain assistant message to the chat UI.

2. `CopilotKit AI Agent`
   - Browser sends chat events to `/api/copilotkit`.
   - CopilotKit Runtime turns UI messages into an agent run.
   - The backend agent calls an LLM provider and typed tools.
   - Tool results stream back through CopilotKit to the UI.
   - This path needs an LLM API key, so it is hidden by default.

## OAuth Flow

OAuth is not an API key. It is a permission handshake:

1. You create a Google OAuth client in Google Cloud.
2. The app sends the user to Google's consent screen.
3. The user approves selected scopes, such as Calendar or Drive.
4. Google sends the app an authorization code.
5. NextAuth exchanges that code for access and refresh tokens.
6. Backend routes use those tokens to call Google APIs.

## Current Limited Actions

The no-key local agent can:

- report OAuth/setup status
- detect whether you are signed in
- manage local tasks
- manage local notes
- calculate simple arithmetic
- generate a local briefing/focus summary
- export a JSON workspace snapshot
- list upcoming Google Calendar events after OAuth and Calendar scope are configured

It cannot do true open-ended AI reasoning until an LLM provider is connected.
