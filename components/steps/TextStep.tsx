"use client";

import { useState } from "react";
import type { TaskStep } from "@/lib/types";
import StepFeedback from "./StepFeedback";

interface Props {
  label: string;
  step: TaskStep;
  onSubmit: (response: string) => void;
  result?: { passed: boolean; feedback: string } | null;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

export default function TextStep({ label, step, onSubmit, result, onRetry, retryCount = 0, maxRetries = 2 }: Props) {
  const [value, setValue] = useState("");

  const canRetry = !result?.passed && retryCount < maxRetries;

  function handleRetry() {
    setValue("");
    onRetry?.();
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-4">
        {label}
      </h3>
      <p className="font-medium text-gray-800 text-[15px] leading-relaxed mb-5">{step.prompt}</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!!result}
        placeholder={step.placeholder || "請輸入你的回答..."}
        className="w-full border border-gray-200 rounded p-3 text-sm min-h-[120px] mb-1 disabled:bg-gray-50"
      />
      {step.min_length && (
        <p className="text-xs text-gray-400 mb-3">
          最少 {step.min_length} 字（目前 {value.length} 字）
        </p>
      )}
      <StepFeedback
        value={value}
        result={result}
        onSubmit={() => onSubmit(value)}
        onRetry={handleRetry}
        canRetry={canRetry}
        hint={step.hint}
        explanation={step.explanation}
      />
    </div>
  );
}
