"use client";

// 統一的課程資料載入器
// 優先檢查 localStorage（使用者建立的課程），fallback 到 API（內建課程）

import type { Subject, Module } from "./types";
import { getStoredCourse } from "./courses-store";

export async function loadSubject(
  subjectId: string
): Promise<{ subject: Subject; modules: Module[] } | null> {
  // 1. 檢查使用者建立的課程
  const stored = getStoredCourse(subjectId);
  if (stored) return stored;

  // 2. fallback 到 API
  try {
    const res = await fetch(`/api/subjects/${subjectId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadModule(
  subjectId: string,
  moduleId: string
): Promise<Module | null> {
  // 1. 檢查使用者建立的課程
  const stored = getStoredCourse(subjectId);
  if (stored) {
    return stored.modules.find((m) => m.module_id === moduleId) || null;
  }

  // 2. fallback 到 API
  try {
    const res = await fetch(`/api/modules/${subjectId}/${moduleId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
