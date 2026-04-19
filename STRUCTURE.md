# Proposed Folder Structure

```
personal-assist/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout — global font, metadata, providers
│   │   ├── page.tsx                      # Chat UI entry point (root route)
│   │   ├── globals.css                   # Tailwind base styles
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts              # Route Handler: Anthropic API + tool use orchestration loop
│   │
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx            # Scrollable message list container
│   │   │   ├── ChatMessage.tsx           # Individual message bubble (user / assistant)
│   │   │   ├── ChatInput.tsx             # Text input + submit button
│   │   │   └── ToolCallIndicator.tsx     # Optional: shows when a tool is executing
│   │   └── ui/
│   │       ├── Button.tsx                # Shared button primitive
│   │       ├── Spinner.tsx               # Loading state
│   │       └── Markdown.tsx              # Renders assistant markdown responses
│   │
│   ├── lib/
│   │   ├── anthropic/
│   │   │   ├── client.ts                 # Anthropic SDK instance (server-only import)
│   │   │   └── tools.ts                 # Tool definitions array + handler dispatch function
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Supabase browser client (anon key, safe for client components)
│   │   │   ├── server.ts                 # Supabase server client (service role, Route Handlers only)
│   │   │   └── queries/
│   │   │       ├── tasks.ts              # Task read/write functions
│   │   │       ├── notes.ts              # Note read/write functions
│   │   │       ├── contacts.ts           # Contact upsert/query functions
│   │   │       └── context.ts            # User context read/write functions
│   │   └── context/
│   │       └── loader.ts                 # Loads user context from Supabase for system prompt injection
│   │
│   └── types/
│       ├── tools.ts                      # TypeScript types for all tool inputs and return values
│       ├── supabase.ts                   # DB row types (mirrors Supabase schema, can be generated)
│       └── chat.ts                       # Message types for client-side chat state
│
├── supabase/
│   └── migrations/
│       └── 00001_initial_schema.sql      # Initial table definitions (tasks, notes, contacts, etc.)
│
├── public/
│   └── favicon.ico
│
├── .env.local                            # Local secrets — never committed
├── .env.example                          # Template showing required env var names (no values)
├── .gitignore
├── next.config.ts                        # Next.js config
├── tailwind.config.ts                    # Tailwind config
├── tsconfig.json
├── package.json
├── CLAUDE.md                             # Agent instructions (this project's conventions)
├── CONTEXT.md                            # Personal context template for LLM system prompt
├── TOOLS.md                              # Tool function signatures and schema decisions
└── STRUCTURE.md                          # This file
```

---

## Streaming Architecture

The route handler returns a **Server-Sent Events (SSE) stream** (`Content-Type: text/event-stream`) using the Web Streams API. No third-party streaming library — just `new ReadableStream` → `new Response(stream)`.

### Agentic loop with streaming

The Anthropic SDK's `.stream()` call emits events as tokens arrive. The challenge is that tool use breaks the stream: Claude stops generating text, calls a tool, waits for the result, then continues. The loop looks like this:

```
1. Open SSE stream to client
2. Call anthropic.messages.stream() — forward text_delta events to client as they arrive
3. Stream ends with stop_reason: "tool_use"
4. Emit a tool_start event to client (triggers ToolCallIndicator)
5. Execute tool(s) against Supabase
6. Emit tool_end event to client
7. Call anthropic.messages.stream() again with tool_result appended — repeat from step 2
8. Stream ends with stop_reason: "end_turn" — emit done event, close stream
```

### SSE event format (NDJSON lines)

Each event is a JSON object on a single line, prefixed with `data: `:

| Event type | Shape | When |
|---|---|---|
| `text_delta` | `{ type: "text_delta", text: "..." }` | Each token |
| `tool_start` | `{ type: "tool_start", name: "create_task" }` | Tool call begins |
| `tool_end` | `{ type: "tool_end", name: "create_task", result: {...} }` | Tool call completes |
| `done` | `{ type: "done" }` | Stream complete |
| `error` | `{ type: "error", message: "..." }` | Unrecoverable error |

### Client-side consumption

`ChatWindow.tsx` reads the stream with `response.body.getReader()`, parsing each `data: ...` line. Text deltas are appended to the in-progress assistant message. `tool_start` / `tool_end` events drive `ToolCallIndicator` visibility. On `done`, the message is finalized.

---

## Key Boundaries

| Layer                        | What lives here                                              | What must NOT be here                        |
| ---------------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| `src/app/api/`               | Anthropic calls, tool dispatch, Supabase server reads/writes | Client state, UI logic                       |
| `src/components/`            | React UI, client state, fetch calls to Route Handlers        | Direct Anthropic or Supabase calls           |
| `src/lib/anthropic/`         | Tool definitions, SDK instance                               | Any client-side import                       |
| `src/lib/supabase/server.ts` | Service role client                                          | Client components (would expose service key) |
| `src/lib/supabase/client.ts` | Anon key browser client                                      | Sensitive writes, tool execution             |
| `supabase/migrations/`       | SQL migration files                                          | Application logic                            |
