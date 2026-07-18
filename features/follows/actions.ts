'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const followSchema = z.object({
  programId: z.string().uuid(),
})

/**
 * 番組をフォローする
 * @precondition ログイン済みユーザーのみ（RLSで強制）
 * @postcondition follows テーブルに (user_id, program_id) が追加される
 * @throws Supabase RLSエラー（未認証時）
 */
export async function followProgram(programId: string) {
  const parsed = followSchema.safeParse({ programId })
  if (!parsed.success) return { error: '無効なprogram IDです' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証が必要です' }

  const { error } = await supabase
    .from('follows')
    .insert({ user_id: user.id, program_id: programId })

  if (error) {
    // unique制約違反（すでにフォロー済み）は無視
    if (error.code === '23505') return { success: true }
    return { error: error.message }
  }

  return { success: true }
}

/**
 * 番組のフォローを解除する
 * @precondition ログイン済みユーザーのみ（RLSで強制）
 * @postcondition follows テーブルから対象レコードが削除される
 */
export async function unfollowProgram(programId: string) {
  const parsed = followSchema.safeParse({ programId })
  if (!parsed.success) return { error: '無効なprogram IDです' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証が必要です' }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('user_id', user.id)
    .eq('program_id', programId)

  if (error) return { error: error.message }
  return { success: true }
}

/**
 * フォロー済み番組IDの一覧を取得する
 * @postcondition ログイン済みなら自分のフォロー一覧、未ログインなら空配列
 */
export async function fetchFollowedProgramIds(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('follows')
    .select('program_id')
    .eq('user_id', user.id)

  if (error || !data) return []
  return (data as { program_id: string }[]).map((f) => f.program_id)
}
