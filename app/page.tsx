"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Subject } from "@/lib/types";
import { getSubjectStats, initSubjectProgress } from "@/lib/progress";

export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<Record<string, { completed: number; total: number }>>({});

  useEffect(() => {
    // 用既有 API 取得所有 subject（透過第一個 subject 列表）
    // MVP 先硬編 subject id，未來可加 /api/subjects 列表 API
    fetch("/api/subjects/project-concept")
      .then((r) => r.json())
      .then((data) => {
        if (data.subject) {
          setSubjects([data.subject]);
          initSubjectProgress(data.subject.subject_id, data.subject.modules);
          setStats({
            [data.subject.subject_id]: getSubjectStats(
              data.subject.subject_id,
              data.subject.modules
            ),
          });
        }
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">學習主題</h1>
      <p className="text-gray-500 mb-6">選擇一個主題開始學習</p>

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

              {/* 進度條 */}
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
