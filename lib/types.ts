// 向後相容：所有 import { X } from "@/lib/types" 仍然有效
export * from "./types/index";

// 向後相容別名
export type { TaskProgress as TaskResult } from "./types/progress";
export type { StepResult as StepAnswer } from "./types/progress";
