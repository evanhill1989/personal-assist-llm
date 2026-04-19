export type TaskStatus = 'open' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'
export type ContextField =
  | 'current_priorities'
  | 'working_preferences'
  | 'standing_instructions'
  | 'professional_background'
  | 'notes'

export interface CreateTaskInput {
  title: string
  description?: string
  due_date?: string
  priority?: TaskPriority
  project?: string
  contact_name?: string
}

export interface ListTasksInput {
  status?: TaskStatus | 'all'
  priority?: TaskPriority
  project?: string
  due_before?: string
  contact_name?: string
  limit?: number
}

export interface UpdateTaskInput {
  task_id: string
  title?: string
  description?: string
  status?: TaskStatus
  due_date?: string
  priority?: TaskPriority
}

export interface DeleteTaskInput {
  task_id: string
}

export interface CreateNoteInput {
  title: string
  body: string
  tags?: string[]
  related_project?: string
  contact_name?: string
}

export interface SearchNotesInput {
  query?: string
  tags?: string[]
  related_project?: string
  contact_name?: string
  limit?: number
}

export interface DeleteNoteInput {
  note_id: string
}

export interface UpsertContactInput {
  name: string
  relationship?: string
  email?: string
  company?: string
  notes?: string
  last_contacted?: string
}

export interface UpdateContextInput {
  field: ContextField
  value: string
  append?: boolean
}
