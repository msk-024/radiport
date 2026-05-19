'use client'

import Link from 'next/link'
import { usePlayerStore } from '@/features/player/store/playerStore'
import type { Station, Program } from '@/lib/types/database'

type ProgramWithStation = Program & { station: Station }

interface FollowedProgramsGridProps {
  programs: ProgramWithStation[]
}

/**
 * フォロー中番組のグリッド表示（最大6件）
 * @precondition programs は空でないこと（空の場合は呼び出し側で非表示にする）
 * @postcondition 再生ボタンタップで playerStore を更新する
 */
export function FollowedProgramsGrid({ programs }: FollowedProgramsGridProps) {
  const { play, setExternalLaunch } = usePlayerStore()

  const handlePlay = (program: ProgramWithStation) => {
    if (program.station.playback_type === 'external') {
      setExternalLaunch({ station: program.station, program })
    } else {
      play(program.station, program)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {programs.slice(0, 6).map((program) => (
          <div key={program.id} className="flex flex-col gap-1.5">
            {/* サムネイル */}
            <div className="relative aspect-square rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden">
              {program.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={program.thumbnail_url}
                  alt={program.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl" aria-hidden>
                  🎵
                </div>
              )}
              {/* 再生ボタン */}
              <button
                onClick={() => handlePlay(program)}
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-orange-500 shadow-lg flex items-center justify-center active:bg-orange-600 transition-colors"
                aria-label={`${program.name}を再生`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="white" aria-hidden>
                  <path d="M2 1.5L10 6L2 10.5V1.5Z" />
                </svg>
              </button>
            </div>
            {/* 番組情報 */}
            <div className="px-0.5">
              <p className="text-xs text-orange-400 font-medium leading-none mb-0.5">
                {program.station.short_name}
              </p>
              <p className="text-xs font-semibold text-white leading-tight line-clamp-2">
                {program.name}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 6件超の場合はライブラリへ誘導 */}
      {programs.length > 6 && (
        <Link
          href="/library"
          className="text-xs text-zinc-500 text-center active:text-zinc-300 transition-colors"
        >
          他 {programs.length - 6} 件をライブラリで見る →
        </Link>
      )}
    </div>
  )
}
