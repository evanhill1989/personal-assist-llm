# CLAUDE.md — Personal Assistant App

## Project Overview

A solo-use personal assistant with a chat UI. Next.js (App Router) → Anthropic API with tool use → Supabase. The LLM's primary function is translating natural language into structured read/write operations against Supabase via defined tool functions.

---

## Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js Route Handlers — no separate server
- **Database:** Supabase (Postgres) via `@supabase/supabase-js`
- **LLM:** Anthropic API (`@anthropic-ai/sdk`) with tool use
- **Hosting:** Vercel

---

## App Router Folder Structure

```
src/
  app/
    layout.tsx              # Root layout, global providers
    page.tsx                # Chat UI entry point
    api/
      chat/
        route.ts            # Primary Route Handler: Anthropic calls + tool orchestration
      tools/
        route.ts            # Optional: tool execution endpoint if split from chat
  components/
    chat/                   # Chat UI components (client)
    ui/                     # Shared UI primitives
  lib/
    anthropic/
      client.ts             # Anthropic SDK instance (server-only)
      tools.ts              # Tool definitions (schemas + handler dispatch)
    supabase/
      client.ts             # Supabase browser client (client-side, safe ops only)
      server.ts             # Supabase server client (Route Handlers, server components)
      queries/              # Named query functions by domain
    context/
      loader.ts             # Loads CONTEXT.md or DB context at session start
  types/
    tools.ts                # TypeScript types for all tool inputs/outputs
    supabase.ts             # DB row types (can be generated via Supabase CLI)
```

---

## Architecture: Tool Use in Route Handlers

All Anthropic API calls live in `src/app/api/chat/route.ts`. The pattern is:

1. Receive user message from the client
2. Load assistant context (from `CONTEXT.md` or Supabase)
3. Call `anthropic.messages.create` with the full tool definitions array
4. If `stop_reason === 'tool_use'`, extract tool calls from the response
5. Dispatch each tool call to the appropriate handler in `src/lib/anthropic/tools.ts`
6. Each tool handler reads/writes Supabase and returns a structured result
7. Append `tool_result` blocks to the message array and loop back to step 3
8. When `stop_reason === 'end_turn'`, return the final text response to the client

Tool definitions (schemas) live in `src/lib/anthropic/tools.ts` and are imported into the Route Handler. Tool handler logic (the actual Supabase calls) lives in the same file or in `src/lib/supabase/queries/`.

---

## Supabase Patterns

- Use the **server client** (`src/lib/supabase/server.ts`) in all Route Handlers and Server Components
- Use the **browser client** (`src/lib/supabase/client.ts`) only in Client Components for real-time subscriptions or auth state — never for sensitive writes
- Schema changes must be tracked in a `supabase/migrations/` folder using timestamped SQL files
- **Never change the Supabase schema without explicitly flagging it to the user before doing so**
- Row types in `src/types/supabase.ts` should reflect the current schema — regenerate with `supabase gen types typescript` after migrations

---

## Environment Variables

Required in `.env.local` (never committed) and Vercel project settings:

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server-only, never exposed to client
```

---

## Workflow Conventions

1. **Never use diff formatting in code output.** All code blocks must be clean, complete, and immediately valid as file content — no markers, annotations, or truncation.

2. **Always present code in chat. Never write to files by default.** Output all new files and edits as clean, complete code blocks in the chat response. After presenting, stop and wait. The user will either copy-paste the code manually or explicitly instruct Claude to write it. Do not write to files unless asked.

3. **Never put API keys or Anthropic API calls in client components.** All LLM interaction is server-side in Route Handlers.

4. **Never change the Supabase schema without flagging it explicitly first.** State the proposed change, what it affects, and wait for approval before writing any migration or modifying types.

5. **Always define tool use function signatures before implementing any UI that depends on them.** Tools are the contract between the LLM and the database — UI is downstream of that contract.

6. **No separate backend server.** Route Handlers are the API layer. Do not introduce Express, Fastify, or any standalone server process.

7. **Design for Vercel from day one.** No filesystem writes at runtime, no long-lived server processes, no assumptions about persistent local state.

8. **Mobile browser is a first-class target.** UI must be responsive. Test layouts at 375px width.

---

## Code Style

- TypeScript strict mode
- No `any` types except where genuinely unavoidable (document why)
- Prefer `async/await` over `.then()` chains
- Named exports for components, default exports only for Next.js page/layout files
- Keep Route Handlers focused: extract business logic into `src/lib/` modules
