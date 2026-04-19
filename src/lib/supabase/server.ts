import { createClient } from '@supabase/supabase-js'

export const SOLO_USER_ID = process.env.SOLO_USER_ID!

export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
