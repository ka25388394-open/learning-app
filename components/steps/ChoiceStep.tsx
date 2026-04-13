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

export default function ChoiceStep({ label, step, onSubmit, result, onRetry, retryCount = 0, maxRetries = 2 }: Props) {
  const [value, setValue] = useState("");

  const isTrueFalse = step.type === "true_false";
  const canRetry = !result?.passed && retryCount < maxRetries;

  const options = isTrueFalse
    ? [
        { key: "true", label: "是 (True)" },
        { key: "false", label: "否 (False)" },
      ]
    : (step.options || []).map((opt) => ({
        key: opt.charAt(0),
        label: opt,
      }));

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

      <div className={`${isTrueFalse ? "flex gap-3" : "space-y-2"} mb-4`}>
        {options.map((opt) => {
          const isSelected = value === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => !result && setValue(opt.key)}
              disabled={!!result}
              className={`${isTrueFalse ? "px-6 py-2" : "block w-full text-left p-3"} rounded border text-sm transition ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              } ${result ? "cursor-not-allowed" : ""}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

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
