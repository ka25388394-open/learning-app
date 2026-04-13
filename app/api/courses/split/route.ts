import { NextResponse } from "next/server";
import { splitContent } from "@/lib/services/ai-service";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { raw_content, tier } = await request.json();
    if (!raw_content || raw_content.length < 50) {
      return NextResponse.json({ error: "內容至少需要 50 字" }, { status: 400 });
    }
    const result = await splitContent({ raw_content, tier });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "拆分失敗" },
      { status: 500 }
    );
  }
}
