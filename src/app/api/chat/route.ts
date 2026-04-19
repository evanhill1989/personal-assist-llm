import type Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic/client";
import { tools, dispatchTool } from "@/lib/anthropic/tools";
import { buildSystemPrompt } from "@/lib/context/loader";
import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import type { MessageParam, StreamEvent } from "@/types/chat";

const MAX_LOOP_ITERATIONS = 10;
export const maxDuration = 60;

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: MessageParam[] };

  const supabase = createServerSupabaseClient();
  const systemPrompt = await buildSystemPrompt(supabase, SOLO_USER_ID);

  const encoder = new TextEncoder();

  function emit(
    controller: ReadableStreamDefaultController,
    event: StreamEvent,
  ) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let currentMessages: MessageParam[] = [...messages];
        const newMessages: MessageParam[] = [];
        let iterations = 0;

        while (iterations < MAX_LOOP_ITERATIONS) {
          iterations++;

          const anthropicStream = anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 8096,
            system: [
              {
                type: "text",
                text: systemPrompt,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: currentMessages,
            tools,
          });

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              emit(controller, { type: "text_delta", text: chunk.delta.text });
            }
          }

          const finalMessage = await anthropicStream.finalMessage();
          const assistantTurn: MessageParam = {
            role: "assistant",
            content: finalMessage.content,
          };
          currentMessages = [...currentMessages, assistantTurn];
          newMessages.push(assistantTurn);

          if (finalMessage.stop_reason === "end_turn") {
            emit(controller, { type: "final_messages", messages: newMessages });
            emit(controller, { type: "done" });
            controller.close();
            return;
          }

          if (finalMessage.stop_reason === "tool_use") {
            const toolUseBlocks = finalMessage.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
            );

            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolUse of toolUseBlocks) {
              emit(controller, {
                type: "tool_start",
                name: toolUse.name,
                tool_use_id: toolUse.id,
              });

              const result = await dispatchTool(
                toolUse.name,
                toolUse.input as Record<string, unknown>,
                supabase,
                SOLO_USER_ID,
              );

              emit(controller, {
                type: "tool_end",
                name: toolUse.name,
                tool_use_id: toolUse.id,
                result,
              });

              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: JSON.stringify(result),
              });
            }

            const toolResultTurn: MessageParam = {
              role: "user",
              content: toolResults,
            };
            currentMessages = [...currentMessages, toolResultTurn];
            newMessages.push(toolResultTurn);
          }
        }

        emit(controller, { type: "error", message: "Max iterations reached" });
        controller.close();
      } catch (err) {
        emit(controller, {
          type: "error",
          message: err instanceof Error ? err.message : "Internal error",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
