"use client";

import type { ActionSpace, ActionEntry, Commitment, ActionStatus } from "./types";

const STORAGE_KEY = "action-spaces";

function getAll(): ActionSpace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(data: ActionSpace[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ---- 建立 ----

export function createActionSpace(
  subjectId: string,
  moduleId: string,
  taskId: string,
  moduleTitle: string,
  taskTitle: string,
  commitment: Commitment
): ActionSpace {
  const all = getAll();
  const space: ActionSpace = {
    id: generateId(),
    subject_id: subjectId,
    module_id: moduleId,
    task_id: taskId,
    module_title: moduleTitle,
    task_title: taskTitle,
    commitment,
    entries: [],
    status: "planning",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  all.push(space);
  saveAll(all);
  return space;
}

// ---- 讀取 ----

export function getActionSpaces(): ActionSpace[] {
  return getAll();
}

export function getActiveActions(): ActionSpace[] {
  return getAll().filter((a) => a.status !== "done");
}

export function getActionSpace(id: string): ActionSpace | null {
  return getAll().find((a) => a.id === id) || null;
}

// ---- 新增記錄 ----

export function addEntry(
  actionId: string,
  type: ActionEntry["type"],
  content: string
) {
  const all = getAll();
  const space = all.find((a) => a.id === actionId);
  if (!space) return;

  space.entries.push({
    id: `entry_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    content,
  });
  space.updated_at = new Date().toISOString();

  // 第一次寫記錄自動變成 in_progress
  if (space.status === "planning") {
    space.status = "in_progress";
  }

  saveAll(all);
}

// ---- 更新狀態 ----

export function updateStatus(actionId: string, status: ActionStatus) {
  const all = getAll();
  const space = all.find((a) => a.id === actionId);
  if (!space) return;
  space.status = status;
  space.updated_at = new Date().toISOString();
  saveAll(all);
}
