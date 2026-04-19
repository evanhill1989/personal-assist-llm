import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateNoteInput, SearchNotesInput } from '@/types/tools'
import type { NoteRow } from '@/types/supabase'

export async function createNote(
  supabase: SupabaseClient,
  userId: string,
  input: CreateNoteInput
): Promise<NoteRow> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ ...input, user_id: userId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function searchNotes(
  supabase: SupabaseClient,
  userId: string,
  input: SearchNotesInput
): Promise<NoteRow[]> {
  let query = supabase.from('notes').select('*').eq('user_id', userId)

  if (input.query) {
    query = query.or(`title.ilike.%${input.query}%,body.ilike.%${input.query}%`)
  }
  if (input.tags?.length) {
    query = query.overlaps('tags', input.tags)
  }
  if (input.related_project) {
    query = query.ilike('related_project', `%${input.related_project}%`)
  }
  if (input.contact_name) {
    query = query.ilike('contact_name', `%${input.contact_name}%`)
  }

  query = query.order('created_at', { ascending: false }).limit(input.limit ?? 10)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function deleteNote(
  supabase: SupabaseClient,
  userId: string,
  noteId: string
): Promise<{ id: string; title: string }> {
  const { data, error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId)
    .select('id, title')
    .single()
  if (error) throw new Error(error.message)
  if (!data) throw new Error(`Note ${noteId} not found`)
  return data
}
