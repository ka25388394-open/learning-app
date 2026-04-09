import { NextResponse } from "next/server";
import { getSubject, getModules } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const modules = getModules(subjectId, subject.modules);
  return NextResponse.json({ subject, modules });
}
