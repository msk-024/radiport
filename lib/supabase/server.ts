import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

/**
 * Server Component / Route Handler で使うSupabaseクライアント
 * @precondition Next.js Server環境で呼び出されること
 * @postcondition cookieを介した認証が有効な型付きSupabaseクライアントを返す
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Componentから呼ばれた場合は無視（setはできない）
          }
        },
      },
    }
  )
}
