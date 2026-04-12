import { NextResponse } from "next/server";
import { parseCourseContent } from "@/lib/services/ai-service";
import { normalizeCourse } from "@/lib/services/course-normalizer";

export const maxDuration = 60; // Vercel hobby plan 上限

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { raw_content, desired_module_count } = body;

    if (!raw_content || typeof raw_content !== "string") {
      return NextResponse.json(
        { error: "缺少 raw_content 欄位" },
        { status: 400 }
      );
    }

    if (raw_content.length < 50) {
      return NextResponse.json(
        { error: "內容太短，至少需要 50 字" },
        { status: 400 }
      );
    }

    const jsonText = await parseCourseContent({
      raw_content,
      desired_module_count,
    });

    // 嘗試解析 AI 回傳的 JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: "AI 回傳的內容無法解析", raw: jsonText },
        { status: 500 }
      );
    }

    // 用 normalizer 強制修正格式錯誤
    const normalized = normalizeCourse(parsed);
    return NextResponse.json(normalized);
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知錯誤";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
