/**
 * Claude 方言转换的行为契约。
 * 关键点：system 在请求体顶层、没有 tool 角色、user/assistant 必须严格交替。
 */
import { describe, expect, it } from "vitest";
import { fromClaude, toClaude, toClaudeTools } from "./claude";
import type { ClaudeBlock } from "./claude";
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

describe("toClaude", () => {
  it("system 进请求体顶层，不占 messages 的位置", () => {
    const req = toClaude(toolLoop);
    expect(req.system).toBe("你是一个助手，需要时使用工具。");
    // 对照 openai 方言：那边 system 会占 messages[0]，这里只有 3 条
    expect(req.messages).toHaveLength(3);
  });

  it("toolResult 变成 user 的 tool_result block，角色仍严格交替", () => {
    const req = toClaude(toolLoop);
    expect(req.messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
    ]);
    expect(req.messages[1]?.content).toEqual([
      {
        type: "tool_use",
        id: "call_1",
        name: "get_weather",
        input: { city: "北京" },
      },
    ]);
    expect(req.messages[2]?.content).toEqual([
      { type: "tool_result", tool_use_id: "call_1", content: "晴，28°C" },
    ]);
  });

  it("连续多条 toolResult 合并成一条 user，维持交替", () => {
    const req = toClaude({
      messages: [
        { role: "user", content: "北京和上海的天气" },
        {
          role: "assistant",
          toolCalls: [
            { id: "call_1", name: "get_weather", arguments: { city: "北京" } },
            { id: "call_2", name: "get_weather", arguments: { city: "上海" } },
          ],
        },
        { role: "toolResult", toolCallId: "call_1", content: "晴，28°C" },
        { role: "toolResult", toolCallId: "call_2", content: "多云，31°C" },
      ],
    });
    expect(req.messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
    ]);
    expect(req.messages[2]?.content).toEqual([
      { type: "tool_result", tool_use_id: "call_1", content: "晴，28°C" },
      { type: "tool_result", tool_use_id: "call_2", content: "多云，31°C" },
    ]);
  });

  it("多轮纯文本保持 user/assistant 交替", () => {
    const req = toClaude({
      system: "你是一个简洁的助手。",
      messages: [
        { role: "user", content: "什么是 AI Agent" },
        { role: "assistant", content: "能感知环境并行动的系统。" },
        { role: "user", content: "和普通聊天机器人呢？" },
      ],
    });
    expect(req.system).toBe("你是一个简洁的助手。");
    expect(req.messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
    ]);
  });

  it("无内容的 assistant 消息被跳过，两侧 user 因此合并成一条", () => {
    expect(
      toClaude({
        messages: [
          { role: "user", content: "hi" },
          { role: "assistant" },
          { role: "user", content: "在吗" },
        ],
      }).messages,
    ).toEqual([
      {
        role: "user",
        content: [
          { type: "text", text: "hi" },
          { type: "text", text: "在吗" },
        ],
      },
    ]);
  });
});

describe("fromClaude", () => {
  it("text 与 tool_use block 回收成 AssistantMessage", () => {
    const blocks: ClaudeBlock[] = [
      { type: "text", text: "我先查一下天气。" },
      {
        type: "tool_use",
        id: "call_1",
        name: "get_weather",
        input: { city: "北京" },
      },
    ];
    const msg = fromClaude(blocks);
    expect(msg.content).toBe("我先查一下天气。");
    expect(msg.toolCalls?.[0]).toEqual({
      id: "call_1",
      name: "get_weather",
      arguments: { city: "北京" },
    });
  });

  it("多个 text block 拼成一段", () => {
    expect(
      fromClaude([
        { type: "text", text: "前半句，" },
        { type: "text", text: "后半句。" },
      ]).content,
    ).toBe("前半句，后半句。");
  });

  it("忽略不认识的 block 类型，不报错", () => {
    const blocks = [
      { type: "thinking", thinking: "让我想想" },
      { type: "text", text: "答案" },
    ] as unknown as ClaudeBlock[];
    expect(fromClaude(blocks)).toEqual({
      role: "assistant",
      content: "答案",
    });
  });
});

describe("toClaudeTools", () => {
  it("字段改名成 name / description / input_schema", () => {
    const converted = toClaudeTools(tools);
    expect(converted.map((t) => t.name)).toEqual(["get_weather", "calculate"]);
    expect(converted[0]?.input_schema).toBe(tools[0]?.parameters);
    expect(converted[0]?.description).toBe("查询指定城市的天气");
  });
});
