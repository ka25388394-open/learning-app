// 承諾與行動空間型別

export interface Commitment {
  what: string;       // 想試什麼
  when: string;       // 大概何時
  measure: string;    // 怎麼知道做到了
}

export interface ActionEntry {
  id: string;
  timestamp: string;
  type: "note" | "blocker" | "milestone";
  content: string;
}

export type ActionStatus = "planning" | "in_progress" | "done" | "stuck";

export interface ActionSpace {
  id: string;
  subject_id: string;
  module_id: string;
  task_id: string;
  module_title: string;
  task_title: string;
  commitment: Commitment;
  entries: ActionEntry[];
  status: ActionStatus;
  created_at: string;
  updated_at: string;
}
