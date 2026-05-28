import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Station, Program } from '@/lib/types/database'
import { FollowButton } from '@/features/follows/components/FollowButton'

export const metadata = { title: 'ライブラリ' }

type ProgramWithStation = Program & { station: Station }

/**
 * ログインユーザーのフォロー番組を取得する
 * @postcondition 未ログイン・フォローなしの場合は空配列を返す
 */
async function fetchFollowedPrograms(): Promise<ProgramWithStation[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: follows } = await supabase
    .from('follows')
    .select('program_id')
    .eq('user_id', user.id)

  if (!follows || follows.length === 0) return []

  const programIds = (follows as { program_id: string }[]).map((f) => f.program_id)

  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .in('id', programIds)
    .eq('is_active', true)

  if (!programs || programs.length === 0) return []

  const stationIds = [...new Set(programs.map((p: Program) => p.station_id))]
  const { data: stations } = await supabase
    .from('stations')
    .select('*')
    .in('id', stationIds)

  if (!stations) return []

  const stationMap = new Map<string, Station>((stations as Station[]).map((s) => [s.id, s]))

  return (programs as Program[]).flatMap((p) => {
    const station = stationMap.get(p.station_id)
    return station ? [{ ...p, station }] : []
  })
}

export default async function LibraryPage() {
  const followedPrograms = await fetchFollowedPrograms()

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-4">
      {/* ヘッダー */}
      <header>
        <h1 className="text-2xl font-bold text-white">ライブラリ</h1>
      </header>

      {/* フォロー中の番組 */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 mb-3">フォロー中の番組</h2>

        {followedPrograms.length > 0 ? (
          <div className="flex flex-col gap-2">
            {followedPrograms.map((program) => (
              <div
                key={program.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800 border border-zinc-700"
              >
                {/* サムネイル */}
                <div className="w-12 h-12 rounded-lg bg-zinc-700 flex-shrink-0 overflow-hidden">
                  {program.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={program.thumbnail_url}
                      alt={program.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl" aria-hidden>
                      🎵
                    </div>
                  )}
                </div>

                {/* 番組情報 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-orange-400">{program.station.short_name}</p>
                  <p className="text-sm font-semibold text-white truncate">{program.name}</p>
                  {program.personality && (
                    <p className="text-xs text-zinc-500 truncate">{program.personality}</p>
                  )}
                </div>

                {/* フォロー解除ボタン */}
                <div className="flex-shrink-0">
                  <FollowButton programId={program.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-zinc-800 border border-zinc-700 text-center">
            <p className="text-sm text-zinc-400">フォロー中の番組はありません</p>
            <p className="text-xs text-zinc-600 mt-1">
              ホームや検索から番組の ⭐ をタップしてフォローできます
            </p>
          </div>
        )}
      </section>

      {/* 設定リンク */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 mb-3">設定</h2>
        <Link
          href="/settings"
          className="flex items-center justify-between p-4 rounded-xl bg-zinc-800 border border-zinc-700 active:bg-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="text-zinc-400">
              <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 2V4M10 16V18M2 10H4M16 10H18M4.22 4.22L5.64 5.64M14.36 14.36L15.78 15.78M4.22 15.78L5.64 14.36M14.36 5.64L15.78 4.22"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              />
            </svg>
            <span className="text-sm text-white">通知・アプリ設定</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-zinc-600">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </section>
    </div>
  )
}
