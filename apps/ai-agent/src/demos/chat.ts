import { chat, type ProviderConfig, type ProviderId } from "../core/llm";
import type { Context } from "../core/context";

/**
 * 第一步：最基本的对话。
 * 重点观察：多轮对话没有"记忆"，每轮都要把完整历史重新发给模型。
 */
async function main() {
  // 使用方决定 provider 与 config 的来源：demo 演示从 env 读
  const provider = (process.env.PROVIDER ?? "openai").toLowerCase() as ProviderId;
  // 一套 key / 端点 / 模型，由 provider 决定交给哪个通道
  const config: ProviderConfig = {
    apiKey: process.env.API_KEY ?? "",
    baseUrl: process.env.BASE_URL,
    model: process.env.MODEL,
  };

  const context: Context = {
    system: "你是一个简洁的助手，回答不超过三句话。",
    messages: [
      {
        role: "user",
        content: process.argv[2] ?? "用一句话解释什么是 AI Agent",
      },
    ],
  };

  console.log("第 1 轮发给模型的完整历史:", JSON.stringify(context, null, 2));
  const reply = await chat(provider, config, context);
  context.messages.push(reply);
  console.log("助手:", reply.content);

  // 第二轮：把上一轮的回答也带上，模型才知道上下文
  context.messages.push({
    role: "user",
    content: "那它和普通的聊天机器人有什么区别？",
  });
  console.log("第 2 轮发给模型的完整历史:", JSON.stringify(context, null, 2));
  const reply2 = await chat(provider, config, context);
  console.log("助手:", reply2.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
