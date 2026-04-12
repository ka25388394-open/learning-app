"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Subject } from "@/lib/types";
import { getSubjectStats, initSubjectProgress } from "@/lib/progress";
import { getStoredSubjects } from "@/lib/courses-store";
import { getActiveActions } from "@/lib/action-store";
import type { ActionSpace } from "@/lib/types";

export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<Record<string, { completed: number; total: number }>>({});
  const [actions, setActions] = useState<ActionSpace[]>([]);

  useEffect(() => {
    // 1. 載入內建課程
    fetch("/api/subjects/project-concept")
      .then((r) => r.json())
      .then((data) => {
        const builtIn = data?.subject ? [data.subject] : [];
        // 2. 載入使用者建立的課程
        const userSubjects = getStoredSubjects();
        // 合併並去重
        const allSubjects = [...builtIn];
        userSubjects.forEach((us) => {
          if (!allSubjects.find((s) => s.subject_id === us.subject_id)) {
            allSubjects.push(us);
          }
        });
        setSubjects(allSubjects);

        // 初始化進度 & 統計
        const newStats: Record<string, { completed: number; total: number }> = {};
        allSubjects.forEach((s) => {
          initSubjectProgress(s.subject_id, s.modules);
          newStats[s.subject_id] = getSubjectStats(s.subject_id, s.modules);
        });
        setStats(newStats);
        setActions(getActiveActions());
      });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">學習主題</h1>
          <p className="text-gray-500">選擇一個主題開始學習</p>
        </div>
        <Link
          href="/admin/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + 建立課程
        </Link>
      </div>

      {/* 進行中的行動 */}
      {actions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">進行中的行動</h2>
          <div className="space-y-2">
            {actions.map((action) => {
              const statusLabel: Record<string, string> = {
                planning: "規劃中",
                in_progress: "進行中",
                stuck: "需要回顧",
              };
              const statusColor: Record<string, string> = {
                planning: "bg-gray-100 text-gray-600",
                in_progress: "bg-green-100 text-green-700",
                stuck: "bg-amber-100 text-amber-700",
              };
              const daysSince = Math.floor(
                (Date.now() - new Date(action.updated_at).getTime()) / 86400000
              );
              return (
                <Link
                  key={action.id}
                  href={`/actions/${action.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-green-400 hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-800">
                      {action.commitment.what}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        statusColor[action.status] || ""
                      }`}
                    >
                      {statusLabel[action.status] || action.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {action.module_title} ・{" "}
                    {daysSince === 0
                      ? "今天更新"
                      : `${daysSince} 天前更新`}
                    ・{action.entries.length} 筆記錄
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {subjects.map((subject) => {
          const s = stats[subject.subject_id];
          const progress = s ? Math.round((s.completed / s.total) * 100) : 0;

          return (
            <Link
              key={subject.subject_id}
              href={`/subjects/${subject.subject_id}`}
              className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-400 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold">{subject.title}</h2>
                {s && (
                  <span className="text-xs text-gray-500">
                    {s.completed}/{s.total} 模組完成
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-3">{subject.description}</p>

              {s && (
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {subject.tags && (
                <div className="flex gap-2">
                  {subject.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
