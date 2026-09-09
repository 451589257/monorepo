/**
 * Context ↔ Gemini：直译到 Google 方言（与 openai.ts / claude.ts 完全对称）。
 *
 * 方言要点：
 *   - 消息叫 contents，assistant 的角色名是 "model"
 *   - system 放请求的 systemInstruction，不进 contents
 *   - functionCall/functionResponse 靠函数名关联（新版才有调用 id）
 * 本文件零 openai 依赖。
 */
import type { AssistantMessage, Context, ToolDef, ToolCall } from "../core/context";

// ---------- Gemini 侧最小类型 ----------

export interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
    id?: string;
  };
  functionResponse?: {
    name: string;
    response: { result: string };
  };
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiRequest {
  systemInstruction?: { parts: [{ text: string }] };
  contents: GeminiContent[];
}

interface GeminiFunctionDeclaration {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}

// ---------- 转换 ----------

export function toGemini(context: Context): GeminiRequest {
  const out: GeminiContent[] = [];
  // Gemini 靠函数名关联调用和结果，回填时要从历史里的 toolCalls 查 id → name
  const toolNameById = new Map<string, string>();

  for (const m of context.messages) {
    let converted: GeminiContent | undefined;
    switch (m.role) {
      case "user":
        converted = { role: "user", parts: [{ text: m.content }] };
        break;
      case "assistant": {
        const parts: GeminiPart[] = [];
        if (m.content) parts.push({ text: m.content });
        for (const c of m.toolCalls ?? []) {
          toolNameById.set(c.id, c.name);
          parts.push({ functionCall: { name: c.name, args: c.arguments } });
        }
        if (parts.length) converted = { role: "model", parts };
        break;
      }
      case "toolResult":
        converted = {
          role: "user",
          parts: [
            {
              functionResponse: {
                name: toolNameById.get(m.toolCallId) ?? m.toolCallId,
                response: { result: m.content },
              },
            },
          ],
        };
        break;
    }
    if (!converted) continue;
    // 兜底合并相邻同角色，保证 user/model 交替
    const last = out[out.length - 1];
    if (last?.role === converted.role) {
      last.parts.push(...converted.parts);
    } else {
      out.push(converted);
    }
  }

  return {
    ...(context.system
      ? { systemInstruction: { parts: [{ text: context.system }] } }
      : {}),
    contents: out,
  };
}

/**
 * 老版 Gemini 不返回调用 id，只能自己造。
 * seq 刻意放在模块级：若每次调用重置，跨轮调用同名工具就会撞 id，
 * 而重复的 tool_call_id 在 OpenAI / Claude 协议里会被服务端拒绝。
 */
let seq = 0;

/** Gemini 响应的 parts → AssistantMessage */
export function fromGemini(parts: GeminiPart[]): AssistantMessage {
  let text = "";
  const toolCalls: ToolCall[] = [];
  for (const p of parts) {
    if (p.text) {
      text += p.text;
    } else if (p.functionCall) {
      // 新版 Gemini 会带原生 id，有就用；没有才自己造
      seq += 1;
      toolCalls.push({
        id: p.functionCall.id ?? `call_${p.functionCall.name}_${seq}`,
        name: p.functionCall.name,
        arguments: p.functionCall.args ?? {},
      });
    }
  }
  return {
    role: "assistant",
    ...(text ? { content: text } : {}),
    ...(toolCalls.length ? { toolCalls } : {}),
  };
}

export function toGeminiTools(
  tools: ToolDef[],
): { functionDeclarations: GeminiFunctionDeclaration[] }[] {
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    },
  ];
}
