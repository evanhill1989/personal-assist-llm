# TOOLS.md — Tool Use Function Signatures

These are the proposed tool definitions for the assistant's tool use layer.
They live in `src/lib/anthropic/tools.ts` and are passed to the Anthropic API
as the `tools` array on every chat request.

Edit this list down to what you actually need before implementation begins.
Add, remove, or rename tools here first — the Route Handler and Supabase schema
will be built to match whatever you approve.

---

## Tool Definitions

---

### 1. `create_task`

Create a new task or to-do item.

```typescript
{
  name: "create_task",
  description: "Create a new task. Use when the user expresses intent to do something, sets a goal, or explicitly asks to add a task.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Short, action-oriented task title"
      },
      description: {
        type: "string",
        description: "Optional longer description or context"
      },
      due_date: {
        type: "string",
        description: "ISO 8601 date string (YYYY-MM-DD), if mentioned"
      },
      priority: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Task priority level"
      },
      project: {
        type: "string",
        description: "Project or area this task belongs to, if mentioned"
      },
      contact_name: {
        type: "string",
        description: "Name of a person this task is associated with, if mentioned"
      }
    },
    required: ["title"]
  }
}
```

**Supabase table:** `tasks`
**Returns:** Created task row including generated `id`

---

### 2. `list_tasks`

Query tasks with optional filters.

```typescript
{
  name: "list_tasks",
  description: "Retrieve tasks. Use when the user asks what they need to do, wants a summary of open work, or asks about tasks in a specific project or priority level.",
  input_schema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["open", "completed", "all"],
        description: "Filter by completion status. Defaults to 'open'."
      },
      priority: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Filter by priority level"
      },
      project: {
        type: "string",
        description: "Filter by project name (partial match)"
      },
      due_before: {
        type: "string",
        description: "ISO 8601 date — return tasks due on or before this date"
      },
           contact_name: {
        type: "string",
        description: "Filter tasks associated with this person (partial match)"
      },
      limit: {
        type: "number",
        description: "Max number of tasks to return. Defaults to 20."
      }
    },
    required: []
  }
}
```

**Supabase table:** `tasks`
**Returns:** Array of task rows matching filters

---

### 3. `update_task`

Update or complete an existing task.

```typescript
{
  name: "update_task",
  description: "Call list_tasks first if you don't have the task_id.Update a task's fields or mark it complete. Use when the user says a task is done, wants to change a due date, reprioritize, or add notes.",
  input_schema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "UUID of the task to update"
      },
      title: {
        type: "string",
        description: "Updated task title"
      },
      description: {
        type: "string",
        description: "Updated description"
      },
      status: {
        type: "string",
        enum: ["open", "completed"],
        description: "New status"
      },
      due_date: {
        type: "string",
        description: "Updated ISO 8601 due date"
      },
      priority: {
        type: "string",
        enum: ["low", "medium", "high"]
      }
    },
    required: ["task_id"]
  }
}
```

**Supabase table:** `tasks`
**Returns:** Updated task row

---

### 4. `create_note`

Save a note, thought, or piece of information.

```typescript
{
  name: "create_note",
  description: "Save a note. Use when the user wants to capture something — an idea, a decision, a reference, meeting notes, or anything they want to be able to retrieve later.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Short descriptive title for the note"
      },
      body: {
        type: "string",
        description: "Full note content"
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags for organization (e.g. ['meeting', 'project-x'])"
      },
      related_project: {
        type: "string",
        description: "Project this note relates to, if applicable"
      },
      contact_name: {
        type: "string",
        description: "Name of a person this note is associated with, if mentioned"
      }
    },
    required: ["title", "body"]
  }
}
```

**Supabase table:** `notes`
**Returns:** Created note row including generated `id`

---

### 5. `search_notes`

Search saved notes by keyword or tag.

```typescript
{
  name: "search_notes",
  description: "Search through saved notes. Use when the user asks to recall something, find what they wrote about a topic, or look up past decisions or meeting notes.Always provide at least one filter.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Full-text search query against note title and body"
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Filter notes that have all of these tags"
      },
      related_project: {
        type: "string",
        description: "Filter by project name"
      },
            contact_name: {
        type: "string",
        description: "Filter notes associated with this person (partial match)"
      },
      limit: {
        type: "number",
        description: "Max results to return. Defaults to 10."
      }
    },
    required: []
  }
}
```

**Supabase table:** `notes`
**Returns:** Array of matching note rows, ordered by relevance or recency

---

### 6. `upsert_contact`

Add or update a person in the contacts list.

```typescript
{
  name: "upsert_contact",
  description: "Add a new contact or update an existing one. Use when the user mentions someone new, updates relationship details, or asks to log something about a specific person.",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Full name of the contact"
      },
      relationship: {
        type: "string",
        description: "How this person relates to the user (e.g. 'client', 'collaborator', 'investor')"
      },
      email: {
        type: "string",
        description: "Email address"
      },
      company: {
        type: "string",
        description: "Company or organization"
      },
      notes: {
        type: "string",
        description: "Freeform notes about this person — context, last interaction, anything relevant"
      },
      last_contacted: {
        type: "string",
        description: "ISO 8601 date of last meaningful contact"
      }
    },
    required: ["name"]
  }
}
```

**Supabase table:** `contacts`
**Returns:** Upserted contact row (match on `name`, or `email` if provided)

---

### 7. `update_context`

Update the user's stored personal context (priorities, standing instructions, etc.).

```typescript
{
  name: "update_context",
  description: "Update a field in the user's persistent context — priorities, working preferences, standing instructions, or other profile data. Use when the user explicitly asks to update their context or tells you something that should be remembered across sessions.",
  input_schema: {
    type: "object",
    properties: {
      field: {
        type: "string",
        enum: [
          "current_priorities",
          "working_preferences",
          "standing_instructions",
          "professional_background",
          "notes"
        ],
        description: "Which context field to update"
      },
      value: {
        type: "string",
        description: "The new value for this field (replaces existing content)"
      },
      append: {
        type: "boolean",
        description: "If true, append to existing value instead of replacing. Defaults to false."
      }
    },
    required: ["field", "value"]
  }
}
```

**Supabase table:** `user_context`
**Returns:** Updated context row

---

## Proposed Supabase Tables (Summary)

| Table          | Primary Key | Key Columns                                                                                       |
| -------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `tasks`        | `id` (uuid) | `title`, `description`, `status`, `priority`, `due_date`, `project`, `contact_name`, `created_at` |
| `notes`        | `id` (uuid) | `title`, `body`, `tags` (text[]), `related_project`, `contact_name`, `created_at`                 |
| `contacts`     | `id` (uuid) | `name`, `email`, `relationship`, `company`, `notes`, `last_contacted`                             |
| `user_context` | `id` (uuid) | `field` (unique), `value`, `updated_at`                                                           |

All tables include a `user_id` (uuid) column. For solo use, hardcode a single UUID (generate it once with `gen_random_uuid()`) as a server-side constant — never pass it through tool inputs. This makes adding RLS or multi-user auth later a schema change, not a rewrite.

---

### 8. `delete_task`

Permanently delete a task by ID.

```typescript
{
  name: "delete_task",
  description: "Delete a task. Use only when the user explicitly asks to remove or delete a task (not just mark it complete). Call list_tasks first if you don't have the task_id.",
  input_schema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "UUID of the task to delete"
      }
    },
    required: ["task_id"]
  }
}
```

**Supabase table:** `tasks`
**Returns:** Confirmation with deleted task title, or structured error if not found

---

### 9. `delete_note`

Permanently delete a note by ID.

```typescript
{
  name: "delete_note",
  description: "Delete a note. Use only when the user explicitly asks to remove or delete a note. Call search_notes first if you don't have the note_id.",
  input_schema: {
    type: "object",
    properties: {
      note_id: {
        type: "string",
        description: "UUID of the note to delete"
      }
    },
    required: ["note_id"]
  }
}
```

**Supabase table:** `notes`
**Returns:** Confirmation with deleted note title, or structured error if not found

---

## Proposed Supabase Tables (Summary)

| Table          | Primary Key | Key Columns                                                                                       |
| -------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `tasks`        | `id` (uuid) | `user_id`, `title`, `description`, `status`, `priority`, `due_date`, `project`, `contact_name`, `created_at` |
| `notes`        | `id` (uuid) | `user_id`, `title`, `body`, `tags` (text[]), `related_project`, `contact_name`, `created_at`                 |
| `contacts`     | `id` (uuid) | `user_id`, `name`, `email`, `relationship`, `company`, `notes`, `last_contacted`                             |
| `user_context` | `id` (uuid) | `user_id`, `field` (unique), `value`, `updated_at`                                                           |

All tables include a `user_id` (uuid) column. For solo use, hardcode a single UUID (generate once with `gen_random_uuid()`) as a server-side constant — never pass through tool inputs. Enables RLS and multi-user auth later without a rewrite.

---

## Notes for Implementation

- Tool definitions are passed as-is to `anthropic.messages.create({ tools: [...] })`
- Handler dispatch lives in `src/lib/anthropic/tools.ts` — a `switch` on `tool_name`
- Each handler receives `input` (the validated tool input) and the Supabase server client
- Handlers return a plain object; the Route Handler wraps it in a `tool_result` content block
- Tools should be defensive: if a required record isn't found, return a structured error message rather than throwing
- **Context source of truth:** `CONTEXT.md` is a one-time seed document. On first run, seed Supabase's `user_context` table from it. After that, all reads and writes go through Supabase only — `update_context` writes there, and `lib/context/loader.ts` reads from there. Do not read `CONTEXT.md` at runtime.
