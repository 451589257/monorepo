/**
 * 自设计 Context：应用层的统一对话格式（受 pi-ai 启发的极简版）。
 *
 * 为什么不直接用 openai 的 messages 格式当内部格式：
 *   - 那是别家的 API 形状，版本会动（v7 已要求 refusal 必填、tool_calls 变联合类型）
 *   - toolCall.arguments 存对象而非 JSON 字符串；toolResult 是中立命名（openai 叫 "tool"）
 *   - 纯 JSON 可序列化，以后要做会话持久化 / 断点续传直接 stringify
 *
 * 刻意砍掉的（YAGNI，需要时再加）：
 *   thinking 块、多模态、usage/成本、流式事件、isError、schema 校验
 */

export interface Context {
  system?: string;
  messages: ContextMessage[];
}

export type ContextMessage = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

/** 模型的一轮回复：要么纯文本，要么带工具调用请求，至少有其一 */
export interface AssistantMessage {
  role: "assistant";
  content?: string;
  toolCalls?: ToolCall[];
}

/** 工具执行结果，用 toolCallId 关联到请求它的 ToolCall */
export interface ToolResultMessage {
  role: "toolResult";
  toolCallId: string;
  content: string;
}

export interface ToolCall {
  id: string;
  name: string;
  /** 参数直接存对象（openai 协议里才是 JSON 字符串） */
  arguments: Record<string, unknown>;
}

/** 工具 = JSON Schema 描述（给模型看） + 本地实现（自己执行） */
export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}
