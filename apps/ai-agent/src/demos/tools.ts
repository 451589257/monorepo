import { Parser } from "expr-eval";
import type { ToolDef } from "../core/context";

/**
 * 工具 = JSON Schema 描述（给模型看） + 本地实现（自己执行）。
 * 模型只会"请求调用"，真正干活的是这里的函数。
 */

export const toolSchemas: ToolDef[] = [
  {
    name: "get_weather",
    description: "查询指定城市的天气",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "城市名，如 北京" },
      },
      required: ["city"],
    },
  },
  {
    name: "calculate",
    description: "计算数学表达式，如 12 * (3 + 4)",
    parameters: {
      type: "object",
      properties: {
        expression: { type: "string", description: "数学表达式" },
      },
      required: ["expression"],
    },
  },
];

const FAKE_WEATHER: Record<string, string> = {
  北京: "晴，28°C",
  上海: "多云，31°C",
  深圳: "雷阵雨，29°C",
};

/**
 * 返回值会原样作为 toolResult 交给模型，所以出错时也要说清楚错在哪，
 * 让模型下一轮能自我修正 —— 抛异常则会直接炸掉 agent 循环。
 */
export function runTool(
  name: string,
  args: Record<string, unknown>,
): string {
  switch (name) {
    case "get_weather": {
      const city = args.city;
      if (typeof city !== "string" || !city) return "缺少参数 city";
      return FAKE_WEATHER[city] ?? `${city}：暂无数据`;
    }
    case "calculate": {
      const expression = args.expression;
      if (typeof expression !== "string" || !expression) {
        return "缺少参数 expression";
      }
      try {
        return String(Parser.parse(expression).evaluate());
      } catch (err) {
        // 模型经常吐出残缺表达式（"1 +"），这里回给它看而不是抛出去
        return `表达式无法计算: ${(err as Error).message}`;
      }
    }
    default:
      return `未知工具: ${name}`;
  }
}
