"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Module } from "@/lib/types";
import { loadModule } from "@/lib/course-loader";
import { createActionSpace } from "@/lib/action-store";

const QUESTIONS = [
  {
    key: "what",
    question: "學完這些之後，你想在生活中試試看什麼？",
    placeholder: "不用想得太大，小小的一步就好...",
    nudges: [
      "試著觀察一下，你周圍有沒有什麼事正在用到剛才學的概念？",
      "想想看最近有沒有讓你覺得「早知道就好了」的事？",
      "今天或明天可以做的一件小事就行。",
    ],
  },
  {
    key: "when",
    question: "大概什麼時候可以做？",
    placeholder: "今天、這週、這個月... 都可以",
    nudges: [
      "不需要精準的時間表，只要有個大概。",
      "如果現在沒有答案，可以寫「等遇到適合的時機」。",
      "越快試越有感覺，但不急。",
    ],
  },
  {
    key: "measure",
    question: "怎麼知道你做到了？",
    placeholder: "完成了某件事、感覺不一樣了... 都算",
    nudges: [
      "不一定要有什麼了不起的成果，「有去做」本身就是了。",
      "你可以想：做完之後，我會發現什麼變了？",
      "有時候「開始做了」就是最好的衡量標準。",
    ],
  },
] as const;

export default function CommitmentPage() {
  const { subjectId, moduleId, taskId } = useParams<{
    subjectId: string;
    moduleId: string;
    taskId: string;
  }>();
  const router = useRouter();

  const [mod, setMod] = useState<Module | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ what: "", when: "", measure: "" });
  const [showNudge, setShowNudge] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    loadModule(subjectId, moduleId).then(setMod);
  }, [subjectId, moduleId]);

  if (!mod) return <p className="text-gray-400">載入中...</p>;

  const task = mod.tasks.find((t) => t.task_id === taskId);
  const currentQ = QUESTIONS[step];

  function handleNext() {
    const newAnswers = { ...answers, [currentQ.key]: value };
    setAnswers(newAnswers);
    setValue("");
    setShowNudge(false);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // 全部回答完，建立行動空間
      const space = createActionSpace(
        subjectId,
        moduleId,
        taskId,
        mod!.title,
        task?.title || "",
        newAnswers
      );
      router.push(`/actions/${space.id}`);
    }
  }

  function handleSkip() {
    const newAnswers = { ...answers, [currentQ.key]: "（之後再想）" };
    setAnswers(newAnswers);
    setValue("");
    setShowNudge(false);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      const space = createActionSpace(
        subjectId,
        moduleId,
        taskId,
        mod!.title,
        task?.title || "",
        newAnswers
      );
      router.push(`/actions/${space.id}`);
    }
  }

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* 進度 */}
      <div className="flex gap-1.5 mb-8">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition ${
              step >= i ? "bg-green-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <p className="text-sm text-green-600 font-medium mb-2">
        任務完成，接下來是你的
      </p>

      {/* 主要問題 */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold leading-relaxed mb-8">
          {currentQ.question}
        </h1>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={currentQ.placeholder}
          className="w-full border border-gray-200 rounded-lg p-4 text-sm min-h-[100px] focus:border-green-400 focus:outline-none"
        />

        {/* 引導提示 */}
        {!showNudge && (
          <button
            onClick={() => setShowNudge(true)}
            className="mt-3 text-sm text-gray-400 hover:text-gray-600"
          >
            我還想不到...
          </button>
        )}

        {showNudge && (
          <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-4 space-y-2">
            {currentQ.nudges.map((nudge, i) => (
              <p key={i} className="text-sm text-green-700">
                {nudge}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 底部導航 */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        <button
          onClick={handleSkip}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          先跳過
        </button>
        <button
          onClick={handleNext}
          disabled={!value.trim()}
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {step < QUESTIONS.length - 1 ? "繼續" : "開啟行動空間"}
        </button>
      </div>
    </div>
  );
}
