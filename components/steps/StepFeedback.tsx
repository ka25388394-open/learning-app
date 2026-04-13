"use client";

import { useState } from "react";

export type HelpReason = "content_unclear" | "need_guidance" | "other";

const HELP_OPTIONS: { key: HelpReason; label: string; response: string }[] = [
  {
    key: "content_unclear",
    label: "我不太確定",
    response: "沒關係。回去看看前面的內容，特別注意粗體字的部分——那些就是關鍵。不用急，理解比速度重要。",
  },
  {
    key: "need_guidance",
    label: "給我一點提示",
    response: "",  // 會動態帶入 step.hint
  },
  {
    key: "other",
    label: "讓我看答案",
    response: "",  // 會動態帶入 step.explanation
  },
];

interface Props {
  value: string;
  result?: { passed: boolean; feedback: string } | null;
  onSubmit: () => void;
  onRetry?: () => void;
  canRetry?: boolean;
  hint?: string;
  explanation?: string;
}

export default function StepFeedback({
  value,
  result,
  onSubmit,
  onRetry,
  canRetry = true,
  hint,
  explanation,
}: Props) {
  const [showHelp, setShowHelp] = useState(false);
  const [selectedHelp, setSelectedHelp] = useState<HelpReason | null>(null);

  // 通過的情況
  if (result && result.passed) {
    return (
      <div className="p-3 rounded text-sm bg-green-50 text-green-700">
        <p className="font-medium">正確！</p>
        <p>{result.feedback}</p>
      </div>
    );
  }

  // 答錯的情況
  if (result && !result.passed) {
    return (
      <div className="space-y-3">
        <div className="p-3 rounded text-sm bg-red-50 text-red-700">
          <p className="font-medium">不正確</p>
          <p>{result.feedback}</p>
        </div>

        {/* 還沒選擇幫助方向 */}
        {!showHelp && canRetry && (
          <div>
            <p className="text-sm text-gray-500 mb-3">沒關係，你可以：</p>
            <div className="space-y-2">
              {HELP_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setShowHelp(true);
                    setSelectedHelp(opt.key);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-sm text-gray-700 transition"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 顯示對應的引導內容 */}
        {showHelp && selectedHelp && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              {selectedHelp === "need_guidance" && (
                <p>{hint || "試著重新讀一次前面的內容，特別注意關鍵概念。"}</p>
              )}
              {selectedHelp === "other" && (
                <div>
                  <p className="mb-2">{explanation || "答案已顯示在上方的提示中。"}</p>
                  <p className="text-xs text-blue-600">理解之後，用自己的話想一次為什麼是這個答案。</p>
                </div>
              )}
              {selectedHelp === "content_unclear" && (
                <p>{HELP_OPTIONS.find((o) => o.key === "content_unclear")!.response}</p>
              )}
            </div>

            {/* 重試按鈕 */}
            {canRetry && selectedHelp !== "other" && onRetry && (
              <button
                onClick={() => {
                  setShowHelp(false);
                  setSelectedHelp(null);
                  onRetry();
                }}
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm"
              >
                重新作答
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // 還沒提交
  return (
    <button
      onClick={onSubmit}
      disabled={!value}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
    >
      提交答案
    </button>
  );
}
