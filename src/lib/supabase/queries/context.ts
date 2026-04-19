import type { SupabaseClient } from '@supabase/supabase-js'
import type { UpdateContextInput, ContextField } from '@/types/tools'
import type { UserContextRow } from '@/types/supabase'

export async function loadContext(
  supabase: SupabaseClient,
  userId: string
): Promise<Partial<Record<ContextField, string>>> {
  const { data, error } = await supabase
    .from('user_context')
    .select('field, value')
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  return Object.fromEntries((data ?? []).map((r) => [r.field, r.value]))
}

export async function updateContext(
  supabase: SupabaseClient,
  userId: string,
  input: UpdateContextInput
): Promise<UserContextRow> {
  let value = input.value

  if (input.append) {
    const { data: existing } = await supabase
      .from('user_context')
      .select('value')
      .eq('user_id', userId)
      .eq('field', input.field)
      .maybeSingle()
    if (existing) value = existing.value + '\n' + input.value
  }

  const { data, error } = await supabase
    .from('user_context')
    .upsert(
      { user_id: userId, field: input.field, value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,field' }
    )
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
