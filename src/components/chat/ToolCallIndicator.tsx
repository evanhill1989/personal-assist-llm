import { Spinner } from '@/components/ui/Spinner'
import type { ToolCallDisplay } from '@/types/chat'

const TOOL_LABELS: Record<string, string> = {
  create_task: 'Creating task',
  list_tasks: 'Checking tasks',
  update_task: 'Updating task',
  delete_task: 'Deleting task',
  create_note: 'Saving note',
  search_notes: 'Searching notes',
  delete_note: 'Deleting note',
  upsert_contact: 'Updating contact',
  update_context: 'Updating context',
}

export function ToolCallIndicator({ toolCall }: { toolCall: ToolCallDisplay }) {
  const label = TOOL_LABELS[toolCall.name] ?? toolCall.name
  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
      {toolCall.status === 'running' ? (
        <Spinner className="h-3 w-3" />
      ) : (
        <span className="text-green-500">✓</span>
      )}
      <span>{label}</span>
    </div>
  )
}
