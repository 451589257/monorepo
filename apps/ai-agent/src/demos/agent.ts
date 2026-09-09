import { chat, type ProviderConfig, type ProviderId } from "../core/llm";
import { runTool, toolSchemas } from "./tools";
import type { Context } from "../core/context";

/**
 * 第二步：手写一个最小 Agent = LLM + 工具 + 循环。
 *
 * 循环本质（之后 LangGraph 的状态机就是在工程化这件事）：
 *   1. 把 messages + 工具列表发给模型
 *   2. 模型要么直接回答 → 结束
 *   3. 要么返回 toolCalls → 本地执行 → 结果追加进 messages → 回到 1
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

  const question =
    process.argv[2] ?? "北京天气怎么样？另外帮我算一下 12 * (3 + 4)";

  const context: Context = {
    system: "你是一个助手，需要时使用工具。",
    messages: [{ role: "user", content: question }],
  };

  console.log("用户:", question);

  for (let step = 1; step <= 10; step++) {
    const reply = await chat(provider, config, context, toolSchemas);
    context.messages.push(reply);

    // 没有工具调用 = 最终回答，循环结束
    if (!reply.toolCalls?.length) {
      console.log("助手:", reply.content);
      return;
    }

    // 执行模型请求的所有工具调用，结果作为 toolResult 消息回填
    for (const call of reply.toolCalls) {
      console.log(`  [工具] ${call.name}(${JSON.stringify(call.arguments)})`);
      const result = runTool(call.name, call.arguments);
      console.log(`  [结果] ${result}`);
      context.messages.push({
        role: "toolResult",
        toolCallId: call.id,
        content: result,
      });
    }
  }

  throw new Error("超过最大步数，agent 可能没有收敛");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
