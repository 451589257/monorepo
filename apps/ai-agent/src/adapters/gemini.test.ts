/**
 * Gemini 方言转换的行为契约。
 * 关键点：assistant 叫 "model"、functionCall/functionResponse 靠函数名关联。
 */
import { describe, expect, it } from "vitest";
import { fromGemini, toGemini, toGeminiTools } from "./gemini";
import type { GeminiPart } from "./gemini";
import type { Context, ToolDef } from "../core/context";

const tools: ToolDef[] = [
  {
    name: "get_weather",
    description: "查询指定城市的天气",
    parameters: { type: "object", properties: { city: { type: "string" } } },
  },
  {
    name: "calculate",
    description: "计算数学表达式",
    parameters: {
      type: "object",
      properties: { expression: { type: "string" } },
    },
  },
];

const toolLoop: Context = {
  system: "你是一个助手，需要时使用工具。",
  messages: [
    { role: "user", content: "北京天气怎么样？" },
    {
      role: "assistant",
      toolCalls: [
        { id: "call_1", name: "get_weather", arguments: { city: "北京" } },
      ],
    },
    { role: "toolResult", toolCallId: "call_1", content: "晴，28°C" },
  ],
};

describe("toGemini", () => {
  it("system 进 systemInstruction，不进 contents", () => {
    const req = toGemini(toolLoop);
    expect(req.systemInstruction).toEqual({
      parts: [{ text: "你是一个助手，需要时使用工具。" }],
    });
  });

  it("assistant 的角色名是 model，contents 严格交替", () => {
    const req = toGemini(toolLoop);
    expect(req.contents.map((c) => c.role)).toEqual([
      "user",
      "model",
      "user",
    ]);
    expect(req.contents[1]?.parts).toEqual([
      { functionCall: { name: "get_weather", args: { city: "北京" } } },
    ]);
  });

  it("functionResponse 靠函数名关联，不靠 id", () => {
    const req = toGemini(toolLoop);
    expect(req.contents[2]?.parts).toEqual([
      {
        functionResponse: {
          name: "get_weather",
          response: { result: "晴，28°C" },
        },
      },
    ]);
  });

  it("多轮纯文本保持 user/model 交替", () => {
    const req = toGemini({
      system: "你是一个简洁的助手。",
      messages: [
        { role: "user", content: "什么是 AI Agent" },
        { role: "assistant", content: "能感知环境并行动的系统。" },
        { role: "user", content: "和普通聊天机器人呢？" },
      ],
    });
    expect(req.contents.map((c) => c.role)).toEqual([
      "user",
      "model",
      "user",
    ]);
  });
});

describe("fromGemini", () => {
  it("text 与 functionCall 回收成 AssistantMessage", () => {
    const msg = fromGemini([
      { text: "我先查一下天气。" },
      { functionCall: { name: "get_weather", args: { city: "北京" } } },
    ]);
    expect(msg.content).toBe("我先查一下天气。");
    expect(msg.toolCalls?.[0]).toMatchObject({
      name: "get_weather",
      arguments: { city: "北京" },
    });
  });

  it("老版无原生 id 时自己造一个 call_ 前缀的 id", () => {
    const msg = fromGemini([
      { functionCall: { name: "get_weather", args: {} } },
    ]);
    expect(msg.toolCalls?.[0]?.id).toMatch(/^call_get_weather_\d+$/);
  });

  it("新版返回原生 id 时直接沿用，不自造", () => {
    const parts: GeminiPart[] = [
      { functionCall: { name: "get_weather", args: {}, id: "native_1" } },
    ];
    expect(fromGemini(parts).toolCalls?.[0]?.id).toBe("native_1");
  });

  // P1 回归：seq 若按调用重置，跨轮调用同名工具会撞 id，
  // 而重复的 tool_call_id 在 OpenAI / Claude 协议下会被服务端拒绝。
  it("跨轮调用同名工具时，合成的 id 不重复", () => {
    const first = fromGemini([
      { functionCall: { name: "get_weather", args: {} } },
    ]);
    const second = fromGemini([
      { functionCall: { name: "get_weather", args: {} } },
    ]);
    expect(first.toolCalls?.[0]?.id).toMatch(/^call_get_weather_\d+$/);
    expect(second.toolCalls?.[0]?.id).toMatch(/^call_get_weather_\d+$/);
    expect(first.toolCalls?.[0]?.id).not.toBe(second.toolCalls?.[0]?.id);
  });

  it("多个 text part 拼成一段", () => {
    expect(
      fromGemini([{ text: "前半句，" }, { text: "后半句。" }]).content,
    ).toBe("前半句，后半句。");
  });
});

describe("toGeminiTools", () => {
  it("包成单层 functionDeclarations 数组", () => {
    const converted = toGeminiTools(tools);
    expect(converted).toHaveLength(1);
    expect(
      converted[0]?.functionDeclarations.map((f) => f.name),
    ).toEqual(["get_weather", "calculate"]);
    expect(converted[0]?.functionDeclarations[0]?.parameters).toBe(
      tools[0]?.parameters,
    );
  });
});
