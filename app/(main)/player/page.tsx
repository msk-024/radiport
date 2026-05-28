'use client'

import { useRouter } from 'next/navigation'
import { usePlayerStore } from '@/features/player/store/playerStore'
import { PulseAnimation } from '@/features/player/components/PulseAnimation'
import { EqualizerBars } from '@/features/player/components/EqualizerBars'
import { FollowButton } from '@/features/follows/components/FollowButton'

export default function PlayerPage() {
  const router = useRouter()
  const {
    currentStation,
    currentProgram,
    isPlaying,
    isLoading,
    volume,
    pause,
    resume,
    stop,
    setVolume,
  } = usePlayerStore()

  if (!currentStation) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
        <span className="text-6xl" aria-hidden>📻</span>
        <div>
          <p className="text-lg font-semibold text-white">再生中の局がありません</p>
          <p className="text-sm text-zinc-400 mt-1">ホームから局を選んで聴いてみましょう</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-full bg-orange-500 text-white font-semibold active:bg-orange-600 transition-colors"
        >
          ホームへ
        </button>
      </div>
    )
  }

  const handlePlayPause = () => {
    if (currentStation.playback_type === 'external') return
    if (isPlaying) { pause() } else { resume() }
  }

  const handleStop = () => {
    stop()
    router.push('/')
  }

  return (
    <div className="flex flex-col items-center justify-between h-full px-6 pt-12 pb-8">
      {/* 閉じるボタン */}
      <div className="w-full flex justify-start">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full text-zinc-400 active:text-white transition-colors"
          aria-label="戻る"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* パルスアニメーション + アイコン */}
      <div className="flex flex-col items-center gap-6">
        <PulseAnimation isPlaying={isPlaying} size="lg" />

        {/* 局名 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{currentStation.name}</h1>
          {currentStation.frequency && (
            <p className="text-sm text-zinc-400 mt-0.5">{currentStation.frequency}</p>
          )}
        </div>

        {/* 番組情報 */}
        {currentProgram ? (
          <div className="text-center bg-zinc-800/50 rounded-2xl px-6 py-4 border border-zinc-700 w-full max-w-xs">
            <p className="text-sm text-orange-400 font-medium">ON AIR</p>
            <p className="text-base font-semibold text-white mt-1">{currentProgram.name}</p>
            {currentProgram.personality && (
              <p className="text-sm text-zinc-400 mt-0.5">{currentProgram.personality}</p>
            )}
            <div className="flex justify-center mt-3">
              <FollowButton programId={currentProgram.id} />
            </div>

            {/* メッセージ・ハッシュタグ */}
            {(currentProgram.message_url || currentProgram.hashtag) && (
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-zinc-700">
                {currentProgram.message_url && (
                  <a
                    href={currentProgram.message_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-zinc-700 text-sm text-white active:bg-zinc-600 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    番組へメッセージを送る
                  </a>
                )}
                {currentProgram.hashtag && (
                  <button
                    onClick={() => {
                      const text = encodeURIComponent(
                        `【${currentProgram.name}】 #${currentProgram.hashtag} #Radiport`
                      )
                      window.open(`https://x.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer')
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-zinc-700 text-sm text-white active:bg-zinc-600 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    #{currentProgram.hashtag}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <EqualizerBars isPlaying={isPlaying} barCount={5} />
            <span className="text-sm text-zinc-400">
              {isPlaying ? 'ストリーミング中' : '停止中'}
            </span>
          </div>
        )}
      </div>

      {/* コントロール */}
      <div className="flex flex-col items-center gap-6 w-full max-w-xs">
        {/* ボリュームスライダー */}
        {currentStation.playback_type === 'internal' && (
          <div className="flex items-center gap-3 w-full">
            <VolumeIcon />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-orange-500"
              aria-label="音量"
            />
            <span className="text-xs text-zinc-500 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}

        {/* 再生/停止ボタン */}
        <div className="flex items-center gap-8">
          {/* 停止（ホームへ戻る） */}
          <button
            onClick={handleStop}
            className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center active:bg-zinc-700 transition-colors"
            aria-label="停止してホームへ"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="white" aria-hidden>
              <rect x="3" y="3" width="12" height="12" rx="2" />
            </svg>
          </button>

          {/* 再生/一時停止 */}
          {currentStation.playback_type === 'internal' ? (
            <button
              onClick={handlePlayPause}
              className="w-18 h-18 rounded-full bg-orange-500 flex items-center justify-center active:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
              style={{ width: '72px', height: '72px' }}
              aria-label={isPlaying ? '一時停止' : '再生'}
            >
              {isLoading ? (
                <span className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="white" aria-hidden>
                  <rect x="5" y="4" width="6" height="20" rx="2" />
                  <rect x="17" y="4" width="6" height="20" rx="2" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="white" aria-hidden>
                  <path d="M6 3.5L23 14L6 24.5V3.5Z" />
                </svg>
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                if (currentStation.external_app_url) {
                  window.open(currentStation.external_app_url, '_blank')
                }
              }}
              className="px-6 py-3 rounded-full bg-orange-500 text-white font-semibold active:bg-orange-600 transition-colors"
            >
              外部アプリで聴く ↗
            </button>
          )}
        </div>

        {/* 再生状態テキスト */}
        <p className="text-xs text-zinc-500">
          {currentStation.playback_type === 'external'
            ? 'このラジオ局はradikoなどの外部アプリで視聴できます'
            : isLoading
              ? 'バッファリング中...'
              : isPlaying
                ? 'ライブ配信中'
                : '一時停止中'}
        </p>
      </div>
    </div>
  )
}

function VolumeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M3 6.5H6L10 3V15L6 11.5H3C2.45 11.5 2 11.05 2 10.5V7.5C2 6.95 2.45 6.5 3 6.5Z"
        fill="currentColor"
        className="text-zinc-500"
      />
      <path
        d="M13 5.5C14.66 6.79 14.66 11.21 13 12.5M15.5 3C18.33 5.26 18.33 12.74 15.5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-zinc-500"
      />
    </svg>
  )
}
