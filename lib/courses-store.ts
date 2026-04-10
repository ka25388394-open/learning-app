"use client";

// 使用者建立的課程儲存層（localStorage）
// 未來可換成資料庫

import type { Subject, Module } from "./types";

const STORAGE_KEY = "user-courses";

interface StoredCourse {
  subject: Subject;
  modules: Module[];
}

interface CoursesData {
  [subjectId: string]: StoredCourse;
}

function getAll(): CoursesData {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: CoursesData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveCourse(subject: Subject, modules: Module[]) {
  const all = getAll();
  all[subject.subject_id] = { subject, modules };
  saveAll(all);
}

export function getStoredSubjects(): Subject[] {
  const all = getAll();
  return Object.values(all).map((c) => c.subject);
}

export function getStoredCourse(subjectId: string): StoredCourse | null {
  const all = getAll();
  return all[subjectId] || null;
}

export function deleteStoredCourse(subjectId: string) {
  const all = getAll();
  delete all[subjectId];
  saveAll(all);
}
