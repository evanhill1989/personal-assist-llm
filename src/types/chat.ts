import type Anthropic from '@anthropic-ai/sdk'

export type MessageParam = Anthropic.MessageParam

export type ToolCallDisplay = {
  tool_use_id: string
  name: string
  status: 'running' | 'done'
}

export type DisplayMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls: ToolCallDisplay[]
}

export type StreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'tool_start'; name: string; tool_use_id: string }
  | { type: 'tool_end'; name: string; tool_use_id: string; result: Record<string, unknown> }
  | { type: 'final_messages'; messages: MessageParam[] }
  | { type: 'done' }
  | { type: 'error'; message: string }
