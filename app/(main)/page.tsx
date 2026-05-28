import { createClient } from '@/lib/supabase/server'
import type { OnAirProgram, Station, Program, Schedule } from '@/lib/types/database'
import { ProgramCard } from '@/features/programs/components/ProgramCard'
import { UpcomingProgramCard } from '@/features/programs/components/UpcomingProgramCard'
import { StationCard } from '@/features/stations/components/StationCard'
import { FollowedProgramsGrid } from '@/features/follows/components/FollowedProgramsGrid'

export const metadata = {
  title: 'ホーム',
}

/**
 * 現在オンエア中の番組を取得する（ネスト select を避けて型安全に実装）
 * @precondition schedulesテーブルにデータが存在すること
 * @postcondition 現在時刻・曜日に一致する番組リストを返す（最大10件）
 */
async function fetchOnAirPrograms(): Promise<OnAirProgram[]> {
  const supabase = await createClient()

  // JST での現在時刻・曜日・第N週を取得
  const now = new Date()
  const jst = new Date(now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }))
  const dayOfWeek = jst.getDay()
  const currentTime = jst.toTimeString().slice(0, 8) // "HH:MM:SS"
  const weekOfMonth = Math.ceil(jst.getDate() / 7)   // 1〜5

  // 現在放送中のスケジュールを取得（null=毎週 or 今週が該当する週のみ）
  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .lte('start_time', currentTime)
    .gte('end_time', currentTime)
    .or(`week_of_month.is.null,week_of_month.eq.${weekOfMonth}`)
    .limit(10)

  if (scheduleError || !schedules || schedules.length === 0) return []

  const programIds = schedules.map((s: Schedule) => s.program_id)

  // 対応する番組を取得
  const { data: programs, error: programError } = await supabase
    .from('programs')
    .select('*')
    .in('id', programIds)
    .eq('is_active', true)

  if (programError || !programs) return []

  const stationIds = [...new Set(programs.map((p: Program) => p.station_id))]

  // 対応する局を取得
  const { data: stations, error: stationError } = await supabase
    .from('stations')
    .select('*')
    .in('id', stationIds)

  if (stationError || !stations) return []

  // データを結合
  const stationMap = new Map<string, Station>(stations.map((s: Station) => [s.id, s]))
  const programMap = new Map<string, Program>(programs.map((p: Program) => [p.id, p]))

  return schedules.flatMap((schedule: Schedule) => {
    const program = programMap.get(schedule.program_id)
    if (!program) return []
    const station = stationMap.get(program.station_id)
    if (!station) return []
    return [{ ...program, station, schedule }]
  })
}

/**
 * 60分以内に放送開始する番組を取得する
 * @precondition schedulesテーブルにデータが存在すること
 * @postcondition 現在時刻から60分以内に開始する番組リストを返す（start_time昇順）
 * 深夜0時跨ぎのケース（例: 23:30→00:10）はシンプルさのため除外している
 */
async function fetchUpcomingPrograms(): Promise<OnAirProgram[]> {
  const supabase = await createClient()

  const now = new Date()
  const jst = new Date(now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }))
  const dayOfWeek = jst.getDay()
  const currentTime = jst.toTimeString().slice(0, 8)
  const weekOfMonth = Math.ceil(jst.getDate() / 7)

  const in60min = new Date(jst.getTime() + 60 * 60 * 1000)
  const in60minTime = in60min.toTimeString().slice(0, 8)

  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .gt('start_time', currentTime)
    .lte('start_time', in60minTime)
    .or(`week_of_month.is.null,week_of_month.eq.${weekOfMonth}`)
    .order('start_time')
    .limit(10)

  if (scheduleError || !schedules || schedules.length === 0) return []

  const programIds = schedules.map((s: Schedule) => s.program_id)

  const { data: programs, error: programError } = await supabase
    .from('programs')
    .select('*')
    .in('id', programIds)
    .eq('is_active', true)

  if (programError || !programs) return []

  const stationIds = [...new Set(programs.map((p: Program) => p.station_id))]

  const { data: stations, error: stationError } = await supabase
    .from('stations')
    .select('*')
    .in('id', stationIds)

  if (stationError || !stations) return []

  const stationMap = new Map<string, Station>(stations.map((s: Station) => [s.id, s]))
  const programMap = new Map<string, Program>(programs.map((p: Program) => [p.id, p]))

  return schedules.flatMap((schedule: Schedule) => {
    const program = programMap.get(schedule.program_id)
    if (!program) return []
    const station = stationMap.get(program.station_id)
    if (!station) return []
    return [{ ...program, station, schedule }]
  })
}

async function fetchAllStations(): Promise<Station[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stations')
    .select('*')
    .eq('is_active', true)
    .order('name')
  return data ?? []
}

/**
 * ログインユーザーのフォロー番組を取得する（最大6件表示用に上限なし取得）
 * @postcondition 未ログイン・フォローなしの場合は空配列を返す
 */
async function fetchFollowedPrograms(): Promise<(Program & { station: Station })[]> {
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

  const stationIds = [...new Set((programs as Program[]).map((p) => p.station_id))]
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

export default async function HomePage() {
  const [onAirPrograms, upcomingPrograms, stations, followedPrograms] = await Promise.all([
    fetchOnAirPrograms(),
    fetchUpcomingPrograms(),
    fetchAllStations(),
    fetchFollowedPrograms(),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-4">
      {/* ヘッダー */}
      <header>
        <p className="text-xs text-zinc-500 font-medium tracking-widest uppercase">Radiport</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">香川ラジオ</h1>
      </header>

      {/* フォロー中の番組グリッド（1件以上の場合のみ表示） */}
      {followedPrograms.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">フォロー中</h2>
          <FollowedProgramsGrid programs={followedPrograms} />
        </section>
      )}

      {/* 現在配信中 */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden />
          現在配信中
        </h2>
        {onAirPrograms.length > 0 ? (
          <div className="flex flex-col gap-2">
            {onAirPrograms.map((program) => (
              <ProgramCard key={program.id} program={program} showFollowButton />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-800 border border-zinc-700 text-center">
            <p className="text-sm text-zinc-500">現在オンエア中の番組はありません</p>
            <p className="text-xs text-zinc-600 mt-1">局を直接タップして聴けます</p>
          </div>
        )}
      </section>

      {/* もうすぐ放送 */}
      {upcomingPrograms.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">もうすぐ放送</h2>
          <div className="flex flex-col gap-2">
            {upcomingPrograms.map((program) => (
              <UpcomingProgramCard key={`upcoming-${program.id}-${program.schedule.id}`} program={program} />
            ))}
          </div>
        </section>
      )}

      {/* 局一覧 */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 mb-3">局を選ぶ</h2>
        <div className="flex flex-col gap-2">
          {stations.map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      </section>
    </div>
  )
}
