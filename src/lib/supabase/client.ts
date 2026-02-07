import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function createClient() {
  // Return cached client if it exists
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, throw a more helpful error
    if (typeof window === 'undefined') {
      throw new Error(
        'Missing Supabase environment variables. This is expected during build - make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in production.'
      )
    }
    throw new Error(
      'Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}
