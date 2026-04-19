'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/Button'

interface ChatInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const value = ref.current?.value.trim()
    if (!value || disabled) return
    onSubmit(value)
    if (ref.current) ref.current.value = ''
  }

  return (
    <div className="flex gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
      <textarea
        ref={ref}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Message your assistant..."
        className="flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <Button onClick={submit} disabled={disabled}>
        Send
      </Button>
    </div>
  )
}
