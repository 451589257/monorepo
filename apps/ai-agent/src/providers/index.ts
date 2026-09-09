/**
 * 通道注册表：每个 provider 一个文件，统一签名 ChatFn，互不依赖。
 * llm.ts 只从这里取注册表做路由。
 */
import type { AssistantMessage, Context, ToolDef } from '../core/context';
import { chatOpenai } from './openai';
import { chatClaude } from './claude';
import { chatGemini } from './gemini';

export type ProviderId = 'openai' | 'claude' | 'gemini';

/** 通道配置：key/端点/模型全部由使用方传入，通道不读任何环境变量。 */
export type ProviderConfig = {
  apiKey: string;
  /** 自定义端点，如 OpenAI 协议兼容服务 */
  baseUrl?: string;
  /** 缺省用各通道自己的默认模型 */
  model?: string;
};

export type ChatFn = (
  config: ProviderConfig,
  context: Context,
  tools?: ToolDef[],
) => Promise<AssistantMessage>;

export const providers: Record<ProviderId, ChatFn> = {
  openai: chatOpenai,
  claude: chatClaude,
  gemini: chatGemini,
};
