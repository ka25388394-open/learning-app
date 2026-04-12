"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { ActionSpace } from "@/lib/types";
import { getActionSpace, addEntry, updateStatus } from "@/lib/action-store";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "剛剛";
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export default function ActionSpacePage() {
  const { actionId } = useParams<{ actionId: string }>();
  const [space, setSpace] = useState<ActionSpace | null>(null);
  const [note, setNote] = useState("");
  const [showStuck, setShowStuck] = useState(false);

  function reload() {
    setSpace(getActionSpace(actionId));
  }

  useEffect(() => {
    reload();
  }, [actionId]);

  if (!space) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">找不到這個行動空間</p>
        <Link href="/" className="text-blue-500 hover:underline text-sm mt-2 block">
          回到首頁
        </Link>
      </div>
    );
  }

  function handleAddNote() {
    if (!note.trim()) return;
    addEntry(actionId, "note", note.trim());
    setNote("");
    reload();
  }

  function handleStuck() {
    addEntry(actionId, "blocker", "遇到了卡住的地方");
    updateStatus(actionId, "stuck");
    setShowStuck(true);
    reload();
  }

  function handleMilestone() {
    addEntry(actionId, "milestone", note.trim() || "完成了一個小里程碑");
    setNote("");
    reload();
  }

  function handleDone() {
    updateStatus(actionId, "done");
    addEntry(actionId, "milestone", "完成了這個行動！");
    reload();
  }

  const statusLabel: Record<string, string> = {
    planning: "規劃中",
    in_progress: "進行中",
    done: "已完成",
    stuck: "需要回顧",
  };

  const statusColor: Record<string, string> = {
    planning: "bg-gray-100 text-gray-600",
    in_progress: "bg-green-100 text-green-700",
    done: "bg-blue-100 text-blue-700",
    stuck: "bg-amber-100 text-amber-700",
  };

  return (
    <div>
      <Link href="/" className="text-sm text-blue-500 hover:underline">
        &larr; 回到首頁
      </Link>

      {/* 標題 */}
      <div className="mt-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold">行動空間</h1>
          <span className={`text-xs px-2 py-0.5 rounded ${statusColor[space.status]}`}>
            {statusLabel[space.status]}
          </span>
        </div>
        <p className="text-sm text-gray-400">
          來自：{space.module_title} / {space.task_title}
        </p>
      </div>

      {/* 承諾（可收合） */}
      <details className="mb-6 bg-green-50 border border-green-100 rounded-lg">
        <summary className="p-4 cursor-pointer text-sm font-medium text-green-700">
          你的承諾
        </summary>
        <div className="px-4 pb-4 space-y-2 text-sm text-green-800">
          <p><span className="text-green-600">想做什麼：</span>{space.commitment.what}</p>
          <p><span className="text-green-600">什麼時候：</span>{space.commitment.when}</p>
          <p><span className="text-green-600">怎麼算做到：</span>{space.commitment.measure}</p>
        </div>
      </details>

      {/* 時間軸 */}
      <div className="mb-6">
        {space.entries.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <p>還沒有任何記錄</p>
            <p className="mt-1">開始寫下你的第一步吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {space.entries.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-lg p-4 text-sm ${
                  entry.type === "milestone"
                    ? "bg-blue-50 border border-blue-100"
                    : entry.type === "blocker"
                    ? "bg-amber-50 border border-amber-100"
                    : "bg-white border border-gray-200"
                }`}
              >
                <p className="text-gray-800">{entry.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {entry.type === "milestone" && "🎯 "}
                  {entry.type === "blocker" && "💭 "}
                  {timeAgo(entry.timestamp)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 卡住引導 */}
      {showStuck && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
          <p className="font-medium text-amber-800 mb-3">沒關係，卡住很正常。</p>
          <p className="text-sm text-amber-700 mb-4">
            也許回去看看之前學的內容，會找到一些線索。不是因為你沒學好，而是有時候「做」的時候會發現不一樣的東西。
          </p>
          <div className="space-y-2">
            <Link
              href={`/subjects/${space.subject_id}/modules/${space.module_id}`}
              className="block bg-white border border-amber-200 rounded p-3 text-sm text-amber-800 hover:bg-amber-50 transition"
            >
              回去看看「{space.module_title}」的內容
            </Link>
            <Link
              href={`/subjects/${space.subject_id}`}
              className="block bg-white border border-amber-200 rounded p-3 text-sm text-amber-800 hover:bg-amber-50 transition"
            >
              瀏覽這個主題的其他模組
            </Link>
          </div>
          <button
            onClick={() => setShowStuck(false)}
            className="mt-3 text-xs text-amber-500 hover:text-amber-700"
          >
            我先繼續試試
          </button>
        </div>
      )}

      {/* 輸入區 */}
      {space.status !== "done" && (
        <div className="border-t border-gray-100 pt-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="今天想記什麼？做了什麼、想到什麼、遇到什麼... 都可以寫"
            className="w-full border border-gray-200 rounded-lg p-4 text-sm min-h-[80px] focus:border-green-400 focus:outline-none"
          />
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={handleStuck}
              className="text-sm text-amber-500 hover:text-amber-700"
            >
              我卡住了
            </button>
            <div className="flex gap-2">
              {note.trim() && (
                <button
                  onClick={handleMilestone}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  標記為里程碑
                </button>
              )}
              <button
                onClick={handleAddNote}
                disabled={!note.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                記錄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 完成按鈕 */}
      {space.status !== "done" && space.entries.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={handleDone}
            className="text-sm text-gray-400 hover:text-green-600 transition"
          >
            我覺得這個行動完成了
          </button>
        </div>
      )}

      {/* 已完成狀態 */}
      {space.status === "done" && (
        <div className="mt-6 text-center bg-blue-50 border border-blue-100 rounded-lg p-6">
          <p className="text-blue-700 font-medium mb-2">你完成了這個行動！</p>
          <p className="text-sm text-blue-600">
            不管結果如何，你踏出了這一步，這就是最重要的。
          </p>
        </div>
      )}
    </div>
  );
}
