"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Subject } from "@/lib/types";
import { getSubjectStats, initSubjectProgress } from "@/lib/progress";
import { getStoredSubjects } from "@/lib/courses-store";

export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<Record<string, { completed: number; total: number }>>({});

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
