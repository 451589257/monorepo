/**
 * claude 通道：Context → Claude 方言 → @anthropic-ai/sdk → AssistantMessage。
 * key/model 由使用方通过 ProviderConfig 传入。
 */
import Anthropic from '@anthropic-ai/sdk';
import type { ToolUnion } from '@anthropic-ai/sdk/resources/messages/messages';
import {
  fromClaude,
  toClaude,
  toClaudeTools,
  type ClaudeBlock,
} from '../adapters';
import type { AssistantMessage, Context, ToolDef } from '../core/context';
import type { ProviderConfig } from './index';

const DEFAULT_MODEL = 'claude-sonnet-4-5';

export async function chatClaude(
  config: ProviderConfig,
  context: Context,
  tools?: ToolDef[],
): Promise<AssistantMessage> {
  if (!config.apiKey) throw new Error('claude 通道缺少 apiKey');
  const client = new Anthropic({ apiKey: config.apiKey });

  const res = await client.messages.create({
    model: config.model ?? DEFAULT_MODEL,
    max_tokens: 1024, // Claude 必填
    ...toClaude(context),
    // SDK 的 InputSchema 要求 type 必填，我们的 JSON Schema 类型上不保证（运行时恒有）—— 断言放行
    ...(tools?.length
      ? { tools: toClaudeTools(tools) as ToolUnion[] }
      : {}),
  });

  // SDK 的 ContentBlock 是超集（thinking、server tool 等），
  // fromClaude 只处理 text / tool_use，其余变体忽略 —— 运行时安全
  return fromClaude(res.content as ClaudeBlock[]);
}
