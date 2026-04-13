import { NextResponse } from "next/server";
import { companionChat } from "@/lib/services/ai-service";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.user_message) {
      return NextResponse.json({ error: "缺少 user_message" }, { status: 400 });
    }
    const reply = await companionChat(body);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({
      reply: "我現在沒辦法回應，但你可以繼續寫下你的想法，之後再回來看看。",
    });
  }
}
