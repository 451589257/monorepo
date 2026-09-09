/**
 * 翻译层汇总出口。llm.ts 与 demo 只从这里导入，
 * 内部按协议拆文件（openai / claude / gemini），各自独立演化。
 */
export * from "./openai";
export * from "./claude";
export * from "./gemini";
