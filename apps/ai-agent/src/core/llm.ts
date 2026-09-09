/**
 * LLM 调用门面：
 *   chat(provider, config, context, tools?) —— 通道与配置（key/端点/模型）都显式传入。
 *   它们从哪来（写死 / env / 用户输入）由使用方决定，核心层不读任何环境变量。
 * 通道实现在 providers/ 下，统一签名 (config, context, tools?) => AssistantMessage；
 * 每个通道自带默认模型和 key 运行时检查，互不依赖。
 */
import { providers, type ProviderConfig, type ProviderId } from '../providers';
import type { AssistantMessage, Context, ToolDef } from './context';

export type { ProviderId, ProviderConfig };

export async function chat(
  provider: ProviderId,
  config: ProviderConfig,
  context: Context,
  tools?: ToolDef[],
): Promise<AssistantMessage> {
  // 运行时守卫：provider 可能来自 env 等绕过类型系统的外部输入
  const fn = providers[provider];
  if (!fn) {
    throw new Error(
      `未知 provider: ${provider}（可选 ${Object.keys(providers).join(' | ')}）`,
    );
  }
  return fn(config, context, tools);
}
