/**
 * Context ↔ OpenAI：直译到 OpenAI 方言（与 claude.ts / gemini.ts 完全对称）。
 * OpenAI 只是我们支持的协议之一，不再是中间跳板。
 *
 * 方言要点：system 进 messages 首条；工具结果是独立 role: "tool" 消息，
 * 靠 tool_call_id 关联；toolCall.arguments 在这个方言里是 JSON 字符串。
 */
import type {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import type { AssistantMessage, Context, ToolDef } from "../core/context";

export function toOpenAI(
  context: Context,
): ChatCompletionMessageParam[] {
  const out: ChatCompletionMessageParam[] = [];
  if (context.system) out.push({ role: "system", content: context.system });

  for (const m of context.messages) {
    switch (m.role) {
      case "user":
        out.push({ role: "user", content: m.content });
        break;
      case "assistant":
        out.push({
          role: "assistant",
          content: m.content ?? null,
          ...(m.toolCalls?.length
            ? {
                tool_calls: m.toolCalls.map((c) => ({
                  type: "function" as const,
                  id: c.id,
                  function: {
                    name: c.name,
                    arguments: JSON.stringify(c.arguments),
                  },
                })),
              }
            : {}),
        });
        break;
      case "toolResult":
        out.push({
          role: "tool",
          tool_call_id: m.toolCallId,
          content: m.content,
        });
        break;
    }
  }
  return out;
}

/**
 * 模型返回的 arguments 是 JSON 字符串，小模型和第三方网关偶发吐出非法 JSON。
 * 这里降级成空对象而不是抛错：转换层只负责结构，参数合不合法该由工具层判断，
 * 一次格式错误不该让整个 agent 循环崩掉。
 */
function parseArgs(raw: string | undefined): Record<string, unknown> {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function fromOpenAI(
  msg: ChatCompletionMessage,
): AssistantMessage {
  return {
    role: "assistant",
    ...(msg.content ? { content: msg.content } : {}),
    ...(msg.tool_calls?.length
      ? {
          toolCalls: msg.tool_calls
            .filter((c) => c.type === "function")
            .map((c) => ({
              id: c.id,
              name: c.function.name,
              arguments: parseArgs(c.function.arguments),
            })),
        }
      : {}),
  };
}

export function toOpenAITools(tools: ToolDef[]): ChatCompletionTool[] {
  // ToolDef 的字段正好是 openai function 定义的子集，直接包一层 type
  return tools.map((t) => ({ type: "function" as const, function: t }));
}
