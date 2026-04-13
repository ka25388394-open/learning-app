"use client";

import { useState } from "react";
import Link from "next/link";
import { getTier } from "@/lib/tier-store";

interface TestResult {
  status: "idle" | "testing" | "pass" | "fail";
  message: string;
  duration?: number;
}

interface AiAgent {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  trigger: string;
  input_desc: string;
  output_desc: string;
  tests: {
    name: string;
    run: () => Promise<{ ok: boolean; message: string }>;
  }[];
}

const AGENTS: AiAgent[] = [
  {
    id: "split",
    name: "#1 拆分 AI",
    description: "把大內容切成不同主題和模組",
    endpoint: "/api/courses/split",
    trigger: "建立課程 → 第一步",
    input_desc: "長文本（50+ 字）",
    output_desc: "主題標題 + 模組清單 + 摘要",
    tests: [
      {
        name: "基本拆分功能",
        run: async () => {
          const res = await fetch("/api/courses/split", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              raw_content: "時間管理是一門重要的技能。首先要學會區分緊急和重要的事情。其次要學會規劃每天的工作。最後要養成定期回顧的習慣。好的時間管理可以讓你事半功倍。",
              tier: getTier(),
            }),
          });
          const data = await res.json();
          if (!res.ok) return { ok: false, message: data.error };
          if (!data.title || !data.modules) return { ok: false, message: "缺少 title 或 modules" };
          return { ok: true, message: `拆成 ${data.modules.length} 個模組：${data.modules.map((m: { title: string }) => m.title).join("、")}` };
        },
      },
    ],
  },
  {
    id: "design",
    name: "#2 設計 AI",
    description: "把模組設計成六步驟學習任務",
    endpoint: "/api/courses/parse",
    trigger: "建立課程 → 第二步",
    input_desc: "模組摘要 + 模組數量",
    output_desc: "Subject + Modules（含六步驟任務）",
    tests: [
      {
        name: "基本設計功能",
        run: async () => {
          const res = await fetch("/api/courses/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              raw_content: "時間管理的第一步是區分緊急和重要。很多人把緊急的事當成重要的事，結果每天都在救火。真正重要的事往往不緊急，但如果一直不做，最後就變成緊急的了。",
              desired_module_count: 1,
              tier: getTier(),
            }),
          });
          const data = await res.json();
          if (!res.ok) return { ok: false, message: data.error };
          if (!data.subject || !data.modules) return { ok: false, message: "缺少 subject 或 modules" };
          const taskCount = data.modules.reduce((sum: number, m: { tasks?: unknown[] }) => sum + (m.tasks?.length || 0), 0);
          return { ok: true, message: `產生 ${data.modules.length} 模組，${taskCount} 任務` };
        },
      },
    ],
  },
  {
    id: "evaluate",
    name: "#3 答題 AI",
    description: "評估簡答題的回答品質",
    endpoint: "/api/courses/evaluate",
    trigger: "學習中 → apply 步驟提交答案",
    input_desc: "題目 + 學生回答",
    output_desc: "通過/未通過 + 個人化回饋",
    tests: [
      {
        name: "正確回答應通過",
        run: async () => {
          const res = await fetch("/api/courses/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: "什麼是專案？請用自己的話說明。",
              answer: "專案就是有明確開始和結束的工作，而且每次的情況都不太一樣，不像日常工作那樣重複。",
              tier: getTier(),
            }),
          });
          const data = await res.json();
          return { ok: data.passed === true, message: `passed=${data.passed}, feedback: ${data.feedback?.slice(0, 50)}...` };
        },
      },
      {
        name: "離題回答應不通過",
        run: async () => {
          const res = await fetch("/api/courses/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: "什麼是專案？請用自己的話說明。",
              answer: "今天天氣真好，適合出去玩。",
              tier: getTier(),
            }),
          });
          const data = await res.json();
          return { ok: data.passed === false, message: `passed=${data.passed}, feedback: ${data.feedback?.slice(0, 50)}...` };
        },
      },
    ],
  },
  {
    id: "suggest",
    name: "#4 串接 AI",
    description: "模組完成後建議下一步學習方向",
    endpoint: "/api/courses/suggest",
    trigger: "模組過渡頁 → 點「聽聽學習夥伴怎麼說」",
    input_desc: "已完成模組 + 可用模組",
    output_desc: "個人化的學習建議文字",
    tests: [
      {
        name: "產生學習建議",
        run: async () => {
          const res = await fetch("/api/courses/suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              completed_modules: ["什麼是專案"],
              available_modules: ["專案的生命週期"],
              subject_title: "專案概念",
              tier: getTier(),
            }),
          });
          const data = await res.json();
          if (!data.suggestion) return { ok: false, message: "沒有回傳建議" };
          return { ok: true, message: data.suggestion.slice(0, 80) + "..." };
        },
      },
    ],
  },
  {
    id: "companion",
    name: "#5 陪伴 AI",
    description: "行動空間裡的溫暖對話夥伴",
    endpoint: "/api/actions/companion",
    trigger: "行動空間 → 寫記錄後按「聊聊看」",
    input_desc: "承諾 + 記錄 + 使用者訊息",
    output_desc: "溫暖的回應（不批判、不建議優化）",
    tests: [
      {
        name: "基本對話",
        run: async () => {
          const res = await fetch("/api/actions/companion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              commitment: { what: "試著用專案思維規劃週末", when: "這週六", measure: "列出一份計畫" },
              recent_entries: [],
              user_message: "我不太確定要從哪裡開始",
              status: "planning",
              module_title: "什麼是專案",
              tier: getTier(),
            }),
          });
          const data = await res.json();
          if (!data.reply) return { ok: false, message: "沒有回覆" };
          return { ok: true, message: data.reply.slice(0, 80) + "..." };
        },
      },
    ],
  },
  {
    id: "quality",
    name: "#6 品質 AI",
    description: "驗證課程內容的正確性",
    endpoint: "/api/courses/quality",
    trigger: "建立課程完成後自動檢查",
    input_desc: "模組 + 任務 + 步驟內容",
    output_desc: "品質報告（問題清單 + 修正建議）",
    tests: [
      {
        name: "檢測正常課程",
        run: async () => {
          const res = await fetch("/api/courses/quality", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              modules: [{
                module_id: "test_mod",
                title: "測試模組",
                tasks: [{
                  task_id: "test_task",
                  title: "測試任務",
                  steps: {
                    comprehend: {
                      type: "multiple_choice",
                      prompt: "1+1=?",
                      options: ["A. 1", "B. 2", "C. 3", "D. 4"],
                      correct_answer: "B",
                    },
                  },
                }],
              }],
              tier: getTier(),
            }),
          });
          const data = await res.json();
          return { ok: true, message: `passed=${data.passed}, issues=${data.issues?.length || 0}, ${data.summary}` };
        },
      },
    ],
  },
  {
    id: "remediate",
    name: "#7 補救 AI",
    description: "答錯時用不同方式重新解釋",
    endpoint: "/api/courses/remediate",
    trigger: "同一步驟答錯 2+ 次",
    input_desc: "題目 + 正確答案 + 學生答案 + 嘗試次數",
    output_desc: "用新比喻/案例重新解釋（不給答案）",
    tests: [
      {
        name: "產生補救說明",
        run: async () => {
          const res = await fetch("/api/courses/remediate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step_prompt: "以下哪一項是專案？",
              correct_answer: "B",
              user_answer: "A",
              attempt_count: 2,
              module_title: "什麼是專案",
              tier: getTier(),
            }),
          });
          const data = await res.json();
          if (!data.explanation) return { ok: false, message: "沒有回傳說明" };
          return { ok: true, message: data.explanation.slice(0, 80) + "..." };
        },
      },
    ],
  },
  {
    id: "adapt",
    name: "#8 適性 AI",
    description: "根據表現調整後續題目難度",
    endpoint: "/api/courses/adapt",
    trigger: "模組完成時分析整體表現",
    input_desc: "各任務通過率 + 嘗試次數",
    output_desc: "easier/same/harder + 具體調整建議",
    tests: [
      {
        name: "高正確率應建議 harder",
        run: async () => {
          const res = await fetch("/api/courses/adapt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              module_title: "什麼是專案",
              task_results: [
                { task_id: "t1", passed: true, score: 1.0, attempt_count: 1 },
                { task_id: "t2", passed: true, score: 1.0, attempt_count: 1 },
              ],
              overall_accuracy: 1.0,
              tier: getTier(),
            }),
          });
          const data = await res.json();
          return { ok: data.difficulty_change === "harder", message: `${data.difficulty_change}: ${data.reasoning}` };
        },
      },
      {
        name: "低正確率應建議 easier",
        run: async () => {
          const res = await fetch("/api/courses/adapt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              module_title: "什麼是專案",
              task_results: [
                { task_id: "t1", passed: false, score: 0.3, attempt_count: 3 },
                { task_id: "t2", passed: false, score: 0.2, attempt_count: 3 },
              ],
              overall_accuracy: 0.25,
              tier: getTier(),
            }),
          });
          const data = await res.json();
          return { ok: data.difficulty_change === "easier", message: `${data.difficulty_change}: ${data.reasoning}` };
        },
      },
    ],
  },
];

export default function DevDashboard() {
  const [results, setResults] = useState<Record<string, Record<string, TestResult>>>({});
  const [runningAll, setRunningAll] = useState(false);

  async function runTest(agentId: string, testIndex: number) {
    const agent = AGENTS.find((a) => a.id === agentId)!;
    const test = agent.tests[testIndex];
    const key = `${agentId}_${testIndex}`;

    setResults((prev) => ({
      ...prev,
      [agentId]: { ...prev[agentId], [key]: { status: "testing", message: "測試中..." } },
    }));

    const start = Date.now();
    try {
      const result = await test.run();
      const duration = Date.now() - start;
      setResults((prev) => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          [key]: {
            status: result.ok ? "pass" : "fail",
            message: result.message,
            duration,
          },
        },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          [key]: {
            status: "fail",
            message: err instanceof Error ? err.message : "未知錯誤",
            duration: Date.now() - start,
          },
        },
      }));
    }
  }

  async function runAllTests() {
    setRunningAll(true);
    for (const agent of AGENTS) {
      for (let i = 0; i < agent.tests.length; i++) {
        await runTest(agent.id, i);
      }
    }
    setRunningAll(false);
  }

  const statusIcon: Record<string, string> = {
    idle: "○",
    testing: "◌",
    pass: "●",
    fail: "✗",
  };
  const statusColor: Record<string, string> = {
    idle: "text-gray-300",
    testing: "text-blue-400 animate-pulse",
    pass: "text-green-500",
    fail: "text-red-500",
  };

  return (
    <div>
      <Link href="/" className="text-sm text-blue-500 hover:underline">
        &larr; 回到首頁
      </Link>

      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">開發者儀表板</h1>
          <p className="text-sm text-gray-400">8 個 AI 的分工 + 測試</p>
        </div>
        <button
          onClick={runAllTests}
          disabled={runningAll}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-40"
        >
          {runningAll ? "測試中..." : "全部測試"}
        </button>
      </div>

      <div className="space-y-4">
        {AGENTS.map((agent) => (
          <div key={agent.id} className="bg-white border border-gray-200 rounded-xl p-5">
            {/* 標題列 */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{agent.name}</h3>
                <p className="text-sm text-gray-500">{agent.description}</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">
                {agent.endpoint}
              </span>
            </div>

            {/* 分工細節 */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400">觸發時機：</span>
                <span className="text-gray-700">{agent.trigger}</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-400">輸入：</span>
                <span className="text-gray-700">{agent.input_desc}</span>
              </div>
              <div className="bg-gray-50 rounded p-2 col-span-2">
                <span className="text-gray-400">輸出：</span>
                <span className="text-gray-700">{agent.output_desc}</span>
              </div>
            </div>

            {/* 測試項目 */}
            <div className="space-y-2">
              {agent.tests.map((test, i) => {
                const key = `${agent.id}_${i}`;
                const r = results[agent.id]?.[key] || { status: "idle", message: "" };
                return (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className={`mt-0.5 ${statusColor[r.status]}`}>
                      {statusIcon[r.status]}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{test.name}</span>
                        {r.duration && (
                          <span className="text-xs text-gray-400">{r.duration}ms</span>
                        )}
                      </div>
                      {r.message && (
                        <p className={`text-xs mt-0.5 ${r.status === "fail" ? "text-red-500" : "text-gray-500"}`}>
                          {r.message}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => runTest(agent.id, i)}
                      className="text-xs text-blue-500 hover:text-blue-700 whitespace-nowrap"
                    >
                      測試
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
