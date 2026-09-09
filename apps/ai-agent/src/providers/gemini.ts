/**
 * gemini 通道：Context → Gemini 方言 → @google/genai → AssistantMessage。
 * key/model 由使用方通过 ProviderConfig 传入。
 */
import { GoogleGenAI } from '@google/genai';
import type { Tool as GeminiSdkTool } from '@google/genai';
import {
  fromGemini,
  toGemini,
  toGeminiTools,
  type GeminiPart,
} from '../adapters';
import type { AssistantMessage, Context, ToolDef } from '../core/context';
import type { ProviderConfig } from './index';

const DEFAULT_MODEL = 'gemini-2.5-flash';

export async function chatGemini(
  config: ProviderConfig,
  context: Context,
  tools?: ToolDef[],
): Promise<AssistantMessage> {
  if (!config.apiKey) throw new Error('gemini 通道缺少 apiKey');

  const client = new GoogleGenAI({ apiKey: config.apiKey });
  // toGemini 的返回正好对应 SDK 的两层：contents 顶层，systemInstruction 进 config
  const { contents, systemInstruction } = toGemini(context);
  const res = await client.models.generateContent({
    model: config.model ?? DEFAULT_MODEL,
    contents,
    config: {
      ...(systemInstruction ? { systemInstruction } : {}),
      // SDK 的 Schema 是强类型子集，我们的 JSON Schema 结构兼容但类型不兼容 —— 断言放行
      ...(tools?.length
        ? { tools: toGeminiTools(tools) as GeminiSdkTool[] }
        : {}),
    },
  });

  const parts = res.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error('LLM 返回为空');
  // SDK 的 Part 同样是超集（inlineData、thought 等），fromGemini 只取 text / functionCall
  return fromGemini(parts as GeminiPart[]);
}
