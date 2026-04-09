import fs from "fs";
import path from "path";
import type { Subject, Module } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content", "courses");

export function getSubjects(): Subject[] {
  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });
  const subjects: Subject[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subjectPath = path.join(CONTENT_DIR, entry.name, "subject.json");
      if (fs.existsSync(subjectPath)) {
        const data = JSON.parse(fs.readFileSync(subjectPath, "utf-8"));
        subjects.push(data);
      }
    }
  }
  return subjects;
}

export function getSubject(subjectId: string): Subject | null {
  const subjectPath = path.join(CONTENT_DIR, subjectId, "subject.json");
  if (!fs.existsSync(subjectPath)) return null;
  return JSON.parse(fs.readFileSync(subjectPath, "utf-8"));
}

export function getModule(subjectId: string, moduleId: string): Module | null {
  const modulePath = path.join(CONTENT_DIR, subjectId, `${moduleId}.json`);
  if (!fs.existsSync(modulePath)) return null;
  return JSON.parse(fs.readFileSync(modulePath, "utf-8"));
}

export function getModules(subjectId: string, moduleIds: string[]): Module[] {
  return moduleIds
    .map((id) => getModule(subjectId, id))
    .filter((m): m is Module => m !== null);
}
