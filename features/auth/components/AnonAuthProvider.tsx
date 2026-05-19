'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * 初回アクセス時に匿名認証を自動実行するプロバイダー
 * @precondition Supabase Dashboard > Authentication > Providers で Anonymous sign-ins が有効になっていること
 * @postcondition auth.users に匿名ユーザーが作成され、Cookie経由でセッションが確立される
 * @postcondition profilesテーブルのトリガーにより profiles レコードが自動生成される
 */
export function AnonAuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initAnonAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) return

      await supabase.auth.signInAnonymously()
    }

    initAnonAuth()
  }, [])

  return <>{children}</>
}
