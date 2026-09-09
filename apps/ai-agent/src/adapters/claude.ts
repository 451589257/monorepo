/**
 * Context ↔ Claude：直译到 Anthropic 方言（与 openai.ts / gemini.ts 完全对称）。
 *
 * 方言要点：
 *   - system 是请求体顶层参数，不进 messages
 *   - messages 只剩 user/assistant 且必须严格交替
 *   - 工具结果是 user 消息里的 tool_result block（不是独立的 tool 角色）
 * 本文件零 openai 依赖。
 */
import type { AssistantMessage, Context, ToolCall, ToolDef } from "../core/context";

// ---------- Claude 侧最小类型（只声明用到的字段，完整结构看官方文档） ----------

export type ClaudeBlock =
  | { type: "text"; text: string }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    }
  | { type: "tool_result"; tool_use_id: string; content: string };

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | ClaudeBlock[];
}

export interface ClaudeTool {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
}

export interface ClaudeRequest {
  system?: string;
  messages: ClaudeMessage[];
}

// ---------- 转换 ----------

export function toClaude(context: Context): ClaudeRequest {
  const out: ClaudeMessage[] = [];

  for (const m of context.messages) {
    let converted: ClaudeMessage | undefined;
    switch (m.role) {
      case "user":
        converted = { role: "user", content: m.content };
        break;
      case "assistant": {
        const blocks: ClaudeBlock[] = [];
        if (m.content) blocks.push({ type: "text", text: m.content });
        for (const c of m.toolCalls ?? []) {
          blocks.push({
            type: "tool_use",
            id: c.id,
            name: c.name,
            input: c.arguments,
          });
        }
        if (blocks.length) converted = { role: "assistant", content: blocks };
        break;
      }
      case "toolResult":
        // Claude 没有 tool 角色：结果放进 user 消息的 tool_result block
        converted = {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: m.toolCallId,
              content: m.content,
            },
          ],
        };
        break;
    }
    if (!converted) continue;
    // 兜底合并相邻同角色，保证 user/assistant 严格交替
    // （连续多条 toolResult、连续 user 都靠这里合成一条）
    const last = out[out.length - 1];
    if (last?.role === converted.role) {
      out[out.length - 1] = mergeClaude(last, converted);
    } else {
      out.push(converted);
    }
  }

  return {
    ...(context.system ? { system: context.system } : {}),
    messages: out,
  };
}

function mergeClaude(a: ClaudeMessage, b: ClaudeMessage): ClaudeMessage {
  const blocks = (m: ClaudeMessage): ClaudeBlock[] =>
    typeof m.content === "string" ? [{ type: "text", text: m.content }] : m.content;
  return { role: a.role, content: [...blocks(a), ...blocks(b)] };
}

/** Claude 响应的 content blocks → AssistantMessage */
export function fromClaude(blocks: ClaudeBlock[]): AssistantMessage {
  let text = "";
  const toolCalls: ToolCall[] = [];
  for (const b of blocks) {
    if (b.type === "text") {
      text += b.text;
    } else if (b.type === "tool_use") {
      toolCalls.push({ id: b.id, name: b.name, arguments: b.input });
    }
    // tool_result 只会出现在请求里，响应不会带
  }
  return {
    role: "assistant",
    ...(text ? { content: text } : {}),
    ...(toolCalls.length ? { toolCalls } : {}),
  };
}

export function toClaudeTools(tools: ToolDef[]): ClaudeTool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }));
}
