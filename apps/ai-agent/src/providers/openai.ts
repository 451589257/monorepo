/**
 * openai 通道：Context → OpenAI 方言 → 官方 SDK → AssistantMessage。
 * key/baseUrl/model 由使用方通过 ProviderConfig 传入；baseUrl 可指向任何
 * OpenAI 协议兼容服务。client 每次创建（SDK 构造无 IO，配置可能变）。
 */
import OpenAI from 'openai';
import { fromOpenAI, toOpenAI, toOpenAITools } from '../adapters';
import type { AssistantMessage, Context, ToolDef } from '../core/context';
import type { ProviderConfig } from './index';

const DEFAULT_MODEL = 'gpt-4o-mini';

export async function chatOpenai(
  config: ProviderConfig,
  context: Context,
  tools?: ToolDef[],
): Promise<AssistantMessage> {
  if (!config.apiKey) {
    throw new Error('openai 通道缺少 apiKey');
  }
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  const completion = await client.chat.completions.create({
    model: config.model ?? DEFAULT_MODEL,
    messages: toOpenAI(context),
    ...(tools?.length ? { tools: toOpenAITools(tools) } : {}),
  });

  const message = completion.choices[0]?.message;
  if (!message) throw new Error('LLM 返回为空');
  return fromOpenAI(message);
}
