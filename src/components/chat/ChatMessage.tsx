import { Markdown } from '@/components/ui/Markdown'
import { ToolCallIndicator } from '@/components/chat/ToolCallIndicator'
import type { DisplayMessage } from '@/types/chat'

export function ChatMessage({ message }: { message: DisplayMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
            : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
        }`}
      >
        {message.toolCalls.length > 0 && (
          <div className="mb-2 flex flex-col gap-1">
            {message.toolCalls.map((tc) => (
              <ToolCallIndicator key={tc.tool_use_id} toolCall={tc} />
            ))}
          </div>
        )}
        {message.content &&
          (isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Markdown content={message.content} />
          ))}
      </div>
    </div>
  )
}
