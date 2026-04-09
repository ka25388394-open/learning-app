"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Subject, Module, ModuleProgress } from "@/lib/types";
import {
  getModuleProgress,
  initSubjectProgress,
  getAllProgress,
} from "@/lib/progress";

export default function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ModuleProgress>>({});

  useEffect(() => {
    fetch(`/api/subjects/${subjectId}`)
      .then((r) => r.json())
      .then((data: { subject: Subject; modules: Module[] }) => {
        setSubject(data.subject);
        setModules(data.modules);
        initSubjectProgress(subjectId, data.subject.modules);
        // reload progress after init
        const map: Record<string, ModuleProgress> = {};
        data.subject.modules.forEach((id) => {
          map[id] = getModuleProgress(subjectId, id);
        });
        setProgressMap(map);
      });
  }, [subjectId]);

  if (!subject) {
    return <p className="text-gray-400">載入中...</p>;
  }

  const statusLabel: Record<string, string> = {
    locked: "未解鎖",
    available: "可開始",
    in_progress: "進行中",
    completed: "已完成",
    failed: "未通過",
  };

  const statusColor: Record<string, string> = {
    locked: "bg-gray-100 text-gray-400",
    available: "bg-green-50 text-green-600 border-green-200",
    in_progress: "bg-yellow-50 text-yellow-700 border-yellow-200",
    completed: "bg-blue-50 text-blue-600 border-blue-200",
    failed: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div>
      <Link href="/" className="text-sm text-blue-500 hover:underline">
        &larr; 回到首頁
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-1">{subject.title}</h1>
      <p className="text-gray-500 mb-6">{subject.description}</p>

      <div className="space-y-3">
        {modules.map((mod) => {
          const progress = progressMap[mod.module_id];
          const status = progress?.status ?? "locked";
          const isAccessible = status !== "locked";

          const card = (
            <div
              className={`rounded-lg border p-5 transition ${
                isAccessible
                  ? "bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm cursor-pointer"
                  : "bg-gray-50 border-gray-100 cursor-not-allowed opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">
                  {mod.order}. {mod.title}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${statusColor[status]}`}
                >
                  {statusLabel[status]}
                </span>
              </div>
              <p className="text-sm text-gray-600">{mod.description}</p>
              {/* 任務完成進度 */}
              {progress && status !== "locked" && (() => {
                const taskValues = Object.values(progress.task_results || {});
                const passedCount = taskValues.filter(
                  (t) => t && typeof t === "object" && "passed" in t && t.passed
                ).length;
                return (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${
                            mod.tasks.length > 0
                              ? Math.round((passedCount / mod.tasks.length) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {passedCount}/{mod.tasks.length}
                    </span>
                  </div>
                );
              })()}
            </div>
          );

          if (!isAccessible) return <div key={mod.module_id}>{card}</div>;

          return (
            <Link
              key={mod.module_id}
              href={`/subjects/${subjectId}/modules/${mod.module_id}`}
            >
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
