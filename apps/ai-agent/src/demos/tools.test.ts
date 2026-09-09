/**
 * 工具层的行为契约：返回值会原样作为 toolResult 交给模型，
 * 所以任何失败都要变成模型能看懂的话，而不是抛异常或返回空结果。
 */
import { describe, expect, it } from "vitest";
import { runTool, toolSchemas } from "./tools";

describe("runTool / get_weather", () => {
  it("命中预设城市时返回天气", () => {
    expect(runTool("get_weather", { city: "北京" })).toBe("晴，28°C");
  });

  it("未收录的城市明确说暂无数据", () => {
    expect(runTool("get_weather", { city: "杭州" })).toBe("杭州：暂无数据");
  });

  it("缺 city 时说明缺哪个参数，而不是拿空串去查", () => {
    expect(runTool("get_weather", {})).toBe("缺少参数 city");
    expect(runTool("get_weather", { city: "" })).toBe("缺少参数 city");
  });
});

describe("runTool / calculate", () => {
  it("计算合法表达式", () => {
    expect(runTool("calculate", { expression: "12 * (3 + 4)" })).toBe("84");
  });

  // 回归：Parser.parse 对残缺表达式会抛异常，抛出去会直接炸掉 agent 循环
  it("表达式残缺时返回错误文案而非抛异常", () => {
    expect(() => runTool("calculate", { expression: "1 +" })).not.toThrow();
    expect(runTool("calculate", { expression: "1 +" })).toContain(
      "表达式无法计算",
    );
  });

  it("缺 expression 时说明缺哪个参数", () => {
    expect(runTool("calculate", {})).toBe("缺少参数 expression");
  });
});

describe("runTool / 兜底", () => {
  it("未知工具返回可识别的提示", () => {
    expect(runTool("no_such_tool", {})).toBe("未知工具: no_such_tool");
  });

  it("每个 schema 声明的工具都有对应实现", () => {
    // 加了 schema 却忘了在 runTool 里加 case 时，这条会挂
    for (const schema of toolSchemas) {
      expect(runTool(schema.name, {})).not.toMatch(/^未知工具/);
    }
  });
});
