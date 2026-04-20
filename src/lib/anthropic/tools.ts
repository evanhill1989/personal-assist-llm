import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTask,
  listTasks,
  updateTask,
  deleteTask,
} from "@/lib/supabase/queries/tasks";
import {
  createNote,
  searchNotes,
  deleteNote,
} from "@/lib/supabase/queries/notes";
import { upsertContact } from "@/lib/supabase/queries/contacts";
import { updateContext } from "@/lib/supabase/queries/context";
import {
  createGoal,
  listGoals,
  updateGoal,
  deleteGoal,
} from "@/lib/supabase/queries/goals";

export const tools: Anthropic.Tool[] = [
  {
    name: "create_task",
    description:
      "Create a new task. Use when the user expresses intent to do something, sets a goal, or explicitly asks to add a task.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short, action-oriented task title",
        },
        description: {
          type: "string",
          description: "Optional longer description or context",
        },
        due_date: {
          type: "string",
          description: "ISO 8601 date string (YYYY-MM-DD), if mentioned",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Task priority level",
        },
        project: {
          type: "string",
          description: "Project or area this task belongs to, if mentioned",
        },
        contact_name: {
          type: "string",
          description:
            "Name of a person this task is associated with, if mentioned",
        },
        goal_id: {
          type: "string",
          description:
            "UUID of the goal this task contributes to, if applicable",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "list_tasks",
    description:
      "Retrieve tasks. Use when the user asks what they need to do, wants a summary of open work, or asks about tasks in a specific project or priority level.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["open", "completed", "all"],
          description: "Filter by completion status. Defaults to 'open'.",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Filter by priority level",
        },
        project: {
          type: "string",
          description: "Filter by project name (partial match)",
        },
        due_before: {
          type: "string",
          description:
            "ISO 8601 date — return tasks due on or before this date",
        },
        contact_name: {
          type: "string",
          description:
            "Filter tasks associated with this person (partial match)",
        },
        goal_id: {
          type: "string",
          description: "Filter tasks linked to a specific goal UUID",
        },
        limit: {
          type: "number",
          description: "Max number of tasks to return. Defaults to 20.",
        },
      },
      required: [],
    },
  },
  {
    name: "update_task",
    description:
      "Update a task's fields or mark it complete. Use when the user says a task is done, wants to change a due date, reprioritize, or add notes. Call list_tasks first if you don't have the task_id.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "UUID of the task to update" },
        title: { type: "string", description: "Updated task title" },
        description: { type: "string", description: "Updated description" },
        status: {
          type: "string",
          enum: ["open", "completed"],
          description: "New status",
        },
        due_date: { type: "string", description: "Updated ISO 8601 due date" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        goal_id: {
          type: "string",
          description:
            "Link or re-link this task to a goal UUID. Pass null to unlink.",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "delete_task",
    description:
      "Delete a task. Use only when the user explicitly asks to remove or delete a task (not just mark it complete). Call list_tasks first if you don't have the task_id.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "UUID of the task to delete" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "create_note",
    description:
      "Save a note. Use when the user wants to capture something — an idea, a decision, a reference, meeting notes, or anything they want to retrieve later.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short descriptive title for the note",
        },
        body: { type: "string", description: "Full note content" },
        tags: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional tags for organization (e.g. ['meeting', 'project-x'])",
        },
        related_project: {
          type: "string",
          description: "Project this note relates to, if applicable",
        },
        contact_name: {
          type: "string",
          description:
            "Name of a person this note is associated with, if mentioned",
        },
      },
      required: ["title", "body"],
    },
  },
  {
    name: "search_notes",
    description:
      "Search through saved notes. Use when the user asks to recall something, find what they wrote about a topic, or look up past decisions or meeting notes. Always provide at least one filter.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Full-text search query against note title and body",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Filter notes that have any of these tags",
        },
        related_project: {
          type: "string",
          description: "Filter by project name",
        },
        contact_name: {
          type: "string",
          description:
            "Filter notes associated with this person (partial match)",
        },
        limit: {
          type: "number",
          description: "Max results to return. Defaults to 10.",
        },
      },
      required: [],
    },
  },
  {
    name: "delete_note",
    description:
      "Delete a note. Use only when the user explicitly asks to remove or delete a note. Call search_notes first if you don't have the note_id.",
    input_schema: {
      type: "object",
      properties: {
        note_id: { type: "string", description: "UUID of the note to delete" },
      },
      required: ["note_id"],
    },
  },
  {
    name: "upsert_contact",
    description:
      "Add a new contact or update an existing one. Use when the user mentions someone new, updates relationship details, or asks to log something about a specific person.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name of the contact" },
        relationship: {
          type: "string",
          description:
            "How this person relates to the user (e.g. 'client', 'collaborator', 'investor')",
        },
        email: { type: "string", description: "Email address" },
        company: { type: "string", description: "Company or organization" },
        notes: {
          type: "string",
          description:
            "Freeform notes about this person — context, last interaction, anything relevant",
        },
        last_contacted: {
          type: "string",
          description: "ISO 8601 date of last meaningful contact",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "update_context",
    description:
      "Update a field in the user's persistent context — priorities, working preferences, standing instructions, or other profile data. Use when the user explicitly asks to update their context or tells you something that should be remembered across sessions.",
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
            "notes",
          ],
          description: "Which context field to update",
        },
        value: {
          type: "string",
          description:
            "The new value for this field (replaces existing content)",
        },
        append: {
          type: "boolean",
          description:
            "If true, append to existing value instead of replacing. Defaults to false.",
        },
      },
      required: ["field", "value"],
    },
    cache_control: { type: "ephemeral" },
  },
  {
    name: "create_goal",
    description:
      "Create a new goal. Use when the user defines a high-level objective they want to track over time.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short, outcome-oriented goal title",
        },
        status: {
          type: "string",
          enum: ["on_track", "at_risk", "stalled"],
          description: "Initial health status. Defaults to 'on_track'.",
        },
        status_note: {
          type: "string",
          description: "Optional note explaining the current status",
        },
        progress: {
          type: "number",
          description: "Completion percentage 0–100. Defaults to 0.",
        },
        target_date: {
          type: "string",
          description: "ISO 8601 target completion date, if mentioned",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "list_goals",
    description:
      "Retrieve all goals, optionally filtered by status. Use when the user asks for a goal overview or progress update.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["on_track", "at_risk", "stalled"],
          description: "Filter by health status. Omit to return all goals.",
        },
      },
      required: [],
    },
  },
  {
    name: "update_goal",
    description:
      "Update a goal's status, progress, or note. Use when the user reports progress, changes a goal's health, or updates its target date. Call list_goals first if you don't have the goal_id.",
    input_schema: {
      type: "object",
      properties: {
        goal_id: { type: "string", description: "UUID of the goal to update" },
        title: { type: "string", description: "Updated goal title" },
        status: {
          type: "string",
          enum: ["on_track", "at_risk", "stalled"],
          description: "Updated health status",
        },
        status_note: {
          type: "string",
          description: "Updated status note. Pass null to clear.",
        },
        progress: {
          type: "number",
          description: "Updated completion percentage 0–100",
        },
        target_date: {
          type: "string",
          description: "Updated target date. Pass null to clear.",
        },
      },
      required: ["goal_id"],
    },
  },
  {
    name: "delete_goal",
    description:
      "Delete a goal. Use only when the user explicitly asks to remove a goal. Linked tasks will have their goal_id cleared but will not be deleted. Call list_goals first if you don't have the goal_id.",
    input_schema: {
      type: "object",
      properties: {
        goal_id: { type: "string", description: "UUID of the goal to delete" },
      },
      required: ["goal_id"],
    },
  },
];

export async function dispatchTool(
  toolName: string,
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string,
): Promise<object> {
  try {
    switch (toolName) {
      case "create_task":
        return await createTask(supabase, userId, input as never);
      case "list_tasks":
        return { tasks: await listTasks(supabase, userId, input as never) };
      case "update_task":
        return await updateTask(supabase, userId, input as never);
      case "delete_task":
        return await deleteTask(supabase, userId, input.task_id as string);
      case "create_note":
        return await createNote(supabase, userId, input as never);
      case "search_notes":
        return { notes: await searchNotes(supabase, userId, input as never) };
      case "delete_note":
        return await deleteNote(supabase, userId, input.note_id as string);
      case "upsert_contact":
        return await upsertContact(supabase, userId, input as never);
      case "update_context":
        return await updateContext(supabase, userId, input as never);
      case "create_goal":
        return await createGoal(supabase, userId, input as never);
      case "list_goals":
        return { goals: await listGoals(supabase, userId, input as never) };
      case "update_goal":
        return await updateGoal(supabase, userId, input as never);
      case "delete_goal":
        return await deleteGoal(supabase, userId, input.goal_id as string);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Tool execution failed",
    };
  }
}
