"use client";

import type { TaskStep, StepKey } from "@/lib/types";
import { STEP_LABELS } from "@/lib/types";
import ReadingStep from "./steps/ReadingStep";
import ChoiceStep from "./steps/ChoiceStep";
import TextStep from "./steps/TextStep";

interface Props {
  stepKey: StepKey;
  step: TaskStep;
  onSubmit: (response: string) => void;
  result?: { passed: boolean; feedback: string } | null;
  onRetry?: () => void;
  retryCount?: number;
}

export default function StepRenderer({ stepKey, step, onSubmit, result, onRetry, retryCount = 0 }: Props) {
  const label = STEP_LABELS[stepKey];

  if (step.type === "reading") {
    return (
      <ReadingStep
        label={label}
        step={step}
        completed={!!result}
        onConfirm={() => onSubmit("read")}
      />
    );
  }

  if (step.type === "multiple_choice" || step.type === "true_false") {
    return (
      <ChoiceStep
        label={label}
        step={step}
        onSubmit={onSubmit}
        result={result}
        onRetry={onRetry}
        retryCount={retryCount}
      />
    );
  }

  return (
    <TextStep
      label={label}
      step={step}
      onSubmit={onSubmit}
      result={result}
      onRetry={onRetry}
      retryCount={retryCount}
    />
  );
}
