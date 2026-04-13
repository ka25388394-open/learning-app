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
      <h3 className="text-sm font-semibold text-gray-400 mb-4">
        {label}
      </h3>
      <div
        className="max-w-none mb-6 bg-white rounded-xl border border-gray-100 px-6 py-8 text-gray-700 text-[15px] leading-[1.9]"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(step.content || "") }}
      />
      {completed ? (
        <p className="text-green-600 text-sm font-medium">已確認閱讀</p>
      ) : (
        <button
          onClick={onConfirm}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 text-sm"
        >
          繼續
        </button>
      )}
    </div>
  );
}
