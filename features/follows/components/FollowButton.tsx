'use client'

import { useState, useTransition } from 'react'
import { followProgram, unfollowProgram } from '@/features/follows/actions'

interface FollowButtonProps {
  programId: string
  initialFollowed?: boolean
}

export function FollowButton({ programId, initialFollowed = false }: FollowButtonProps) {
  const [isFollowed, setIsFollowed] = useState(initialFollowed)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      if (isFollowed) {
        const result = await unfollowProgram(programId)
        if (!result.error) setIsFollowed(false)
      } else {
        const result = await followProgram(programId)
        if (!result.error) setIsFollowed(true)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`
        flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all
        ${isFollowed
          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          : 'bg-zinc-700 text-zinc-300 border border-zinc-600 active:bg-zinc-600'
        }
        disabled:opacity-50
      `}
      aria-label={isFollowed ? 'フォロー解除' : 'フォローする'}
      aria-pressed={isFollowed}
    >
      {isPending ? (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span aria-hidden>{isFollowed ? '♥' : '♡'}</span>
      )}
      {isFollowed ? 'フォロー中' : 'フォロー'}
    </button>
  )
}
