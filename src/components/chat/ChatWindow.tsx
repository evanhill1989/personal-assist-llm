'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import type { DisplayMessage, MessageParam, StreamEvent } from '@/types/chat'

export function ChatWindow() {
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([])
  const [apiMessages, setApiMessages] = useState<MessageParam[]>([])
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const idCounter = useRef(0)

  function nextId() {
    return String(++idCounter.current)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages])

  async function handleSubmit(text: string) {
    const userMsg: DisplayMessage = { id: nextId(), role: 'user', content: text, toolCalls: [] }
    const assistantId = nextId()
    const assistantMsg: DisplayMessage = { id: assistantId, role: 'assistant', content: '', toolCalls: [] }

    setDisplayMessages((prev) => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    const outgoingMessages: MessageParam[] = [...apiMessages, { role: 'user', content: text }]

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: outgoingMessages }),
      })

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6)) as StreamEvent

          if (event.type === 'text_delta') {
            setDisplayMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + event.text } : m
              )
            )
          } else if (event.type === 'tool_start') {
            setDisplayMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, toolCalls: [...m.toolCalls, { tool_use_id: event.tool_use_id, name: event.name, status: 'running' }] }
                  : m
              )
            )
          } else if (event.type === 'tool_end') {
            setDisplayMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      toolCalls: m.toolCalls.map((tc) =>
                        tc.tool_use_id === event.tool_use_id ? { ...tc, status: 'done' } : tc
                      ),
                    }
                  : m
              )
            )
          } else if (event.type === 'final_messages') {
            setApiMessages([...outgoingMessages, ...event.messages])
          } else if (event.type === 'error') {
            setDisplayMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: `Error: ${event.message}` } : m
              )
            )
          }
        }
      }
    } catch {
      setDisplayMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: 'Something went wrong. Please try again.' } : m
        )
      )
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {displayMessages.length === 0 && (
            <p className="text-center text-sm text-zinc-400">How can I help you today?</p>
          )}
          {displayMessages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-2xl">
        <ChatInput onSubmit={handleSubmit} disabled={streaming} />
      </div>
    </div>
  )
}
