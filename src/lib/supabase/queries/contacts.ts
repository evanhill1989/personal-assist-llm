import type { SupabaseClient } from '@supabase/supabase-js'
import type { UpsertContactInput } from '@/types/tools'
import type { ContactRow } from '@/types/supabase'

export async function upsertContact(
  supabase: SupabaseClient,
  userId: string,
  input: UpsertContactInput
): Promise<ContactRow> {
  const matchColumn = input.email ? 'email' : 'name'
  const matchValue = input.email ?? input.name

  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', userId)
    .eq(matchColumn, matchValue)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...input, user_id: userId })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({ ...input, user_id: userId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
