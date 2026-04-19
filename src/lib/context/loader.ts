import type { SupabaseClient } from '@supabase/supabase-js'
import { loadContext } from '@/lib/supabase/queries/context'
import type { ContextField } from '@/types/tools'

const FIELD_LABELS: Record<ContextField, string> = {
  professional_background: 'Professional Background',
  current_priorities: 'Current Priorities',
  working_preferences: 'Working Preferences',
  standing_instructions: 'Standing Instructions',
  notes: 'Notes',
}

export async function buildSystemPrompt(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const ctx = await loadContext(supabase, userId)

  const sections = (Object.entries(FIELD_LABELS) as [ContextField, string][])
    .filter(([field]) => ctx[field])
    .map(([field, label]) => `## ${label}\n${ctx[field]}`)
    .join('\n\n')

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `You are a personal assistant. Use the context below to personalize every response.

Today is ${today}.

${sections}

---

You have tools to manage tasks, notes, and contacts. Use them proactively when the user's message implies intent. Before creating a new contact, check if they already exist. Before suggesting new tasks, check what's already open. Surface anything unactioned for 14+ days.

Respond directly and briefly. No preamble. Lead with the answer. No filler phrases.`
}
