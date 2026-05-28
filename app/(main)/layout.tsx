import { AudioPlayer } from '@/features/player/components/AudioPlayer'
import { PlayerBar } from '@/features/player/components/PlayerBar'
import { ExternalLaunchOverlay } from '@/features/player/components/ExternalLaunchOverlay'
import { BottomNav } from './_components/BottomNav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full max-w-md mx-auto">
      {/* メインコンテンツ（スクロール可能） */}
      <main className="flex-1 overflow-y-auto pb-safe">
        {children}
      </main>

      {/* ミニプレイヤー（表示されている場合のみ） */}
      <PlayerBar />

      {/* ボトムナビ */}
      <BottomNav />

      {/* 非表示のオーディオエレメント */}
      <AudioPlayer />

      {/* radiko等の外部アプリ起動バッファ */}
      <ExternalLaunchOverlay />
    </div>
  )
}
