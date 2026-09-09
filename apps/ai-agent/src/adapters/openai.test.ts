/**
 * OpenAI 方言转换的行为契约。
 * 断言刻意写成完整字面量 —— 这份文件同时是三家方言的可读对照表。
 */
import { describe, expect, it } from "vitest";
import type {
  ChatCompletionMessage,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";
import { fromOpenAI, toOpenAI, toOpenAITools } from "./openai";
import type { Context, ToolDef } from "../core/context";

const tools: ToolDef[] = [
  {
    name: "get_weather",
    description: "查询指定城市的天气",
    parameters: {
      type: "object",
      properties: { city: { type: "string", description: "城市名" } },
      required: ["city"],
    },
  },
  {
    name: "calculate",
    description: "计算数学表达式",
    parameters: {
      type: "object",
      properties: { expression: { type: "string" } },
      required: ["expression"],
    },
  },
];

/** agent 工具循环的典型形态：user → assistant(toolCalls) → toolResult */
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

describe("toOpenAI", () => {
  it("工具循环 → [system, user, assistant(tool_calls), tool]", () => {
    expect(toOpenAI(toolLoop)).toMatchObject([
      { role: "system", content: "你是一个助手，需要时使用工具。" },
      { role: "user", content: "北京天气怎么样？" },
      {
        role: "assistant",
        tool_calls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "get_weather", arguments: '{"city":"北京"}' },
          },
        ],
      },
      { role: "tool", tool_call_id: "call_1", content: "晴，28°C" },
    ]);
  });

  it("无 system 时不产出 system 消息", () => {
    expect(toOpenAI({ messages: [{ role: "user", content: "hi" }] })).toEqual([
      { role: "user", content: "hi" },
    ]);
  });
});

describe("fromOpenAI", () => {
  it("文本与工具调用回收成 AssistantMessage，arguments 回到对象", () => {
    const reply: ChatCompletionMessage = {
      role: "assistant",
      content: "我先查一下天气。",
      refusal: null,
      tool_calls: [
        {
          id: "call_1",
          type: "function",
          function: { name: "get_weather", arguments: '{"city":"北京"}' },
        },
      ],
    };
    const msg = fromOpenAI(reply);
    expect(msg.content).toBe("我先查一下天气。");
    expect(msg.toolCalls?.[0]).toEqual({
      id: "call_1",
      name: "get_weather",
      arguments: { city: "北京" },
    });
  });

  it("纯文本响应不带 toolCalls 字段", () => {
    expect(
      fromOpenAI({ role: "assistant", content: "好的", refusal: null }),
    ).toEqual({ role: "assistant", content: "好的" });
  });

  // SDK 文档明说模型不保证吐出合法 JSON；转换层只管结构，不能让循环崩掉
  it("arguments 是非法 JSON 时降级为空对象而非抛错", () => {
    const msg = fromOpenAI({
      role: "assistant",
      content: null,
      refusal: null,
      tool_calls: [
        {
          id: "call_1",
          type: "function",
          function: { name: "get_weather", arguments: "{city:北京" },
        },
      ],
    });
    expect(msg.toolCalls?.[0]?.arguments).toEqual({});
  });

  it("过滤掉 custom 类型的 tool_call（我们只支持 function）", () => {
    const calls: ChatCompletionMessageToolCall[] = [
      {
        id: "call_1",
        type: "function",
        function: { name: "get_weather", arguments: "{}" },
      },
      {
        id: "call_2",
        type: "custom",
        custom: { name: "code_exec", input: "1+1" },
      },
    ];
    const msg = fromOpenAI({
      role: "assistant",
      content: null,
      refusal: null,
      tool_calls: calls,
    });
    expect(msg.toolCalls?.map((c) => c.id)).toEqual(["call_1"]);
  });
});

describe("toOpenAITools", () => {
  it("包一层 type: function，schema 原样透传", () => {
    const converted = toOpenAITools(tools);
    expect(converted.map((t) => t.type)).toEqual(["function", "function"]);
    expect(
      converted
        .filter((t) => t.type === "function")
        .map((t) => t.function.name),
    ).toEqual(["get_weather", "calculate"]);
    expect(
      converted.filter((t) => t.type === "function")[0]?.function.parameters,
    ).toBe(tools[0]?.parameters);
  });
});
