"use client";

import type { TaskStep } from "@/lib/types";
import { markdownToHtml } from "@/lib/utils/markdown";

interface Props {
  label: string;
  step: TaskStep;
  completed: boolean;
  onConfirm: () => void;
}

export default function ReadingStep({ label, step, completed, onConfirm }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 mb-2">
        步驟：{label}
      </h3>
      <div
        className="prose prose-sm max-w-none mb-4 bg-white p-4 rounded border border-gray-200"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(step.content || "") }}
      />
      {completed ? (
        <p className="text-green-600 text-sm font-medium">已確認閱讀</p>
      ) : (
        <button
          onClick={onConfirm}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          我已閱讀完畢
        </button>
      )}
    </div>
  );
}
