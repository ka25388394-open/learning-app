"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTier, setTier, TIER_INFO, type Tier } from "@/lib/tier-store";

const TIERS: Tier[] = ["free", "basic", "premium"];

export default function PlanPage() {
  const [current, setCurrent] = useState<Tier>("free");

  useEffect(() => {
    setCurrent(getTier());
  }, []);

  function handleSelect(tier: Tier) {
    setTier(tier);
    setCurrent(tier);
  }

  return (
    <div>
      <Link href="/" className="text-sm text-blue-500 hover:underline">
        &larr; 回到首頁
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-2">選擇方案</h1>
      <p className="text-gray-500 mb-8">
        目前方案：
        <span className={`ml-1 px-2 py-0.5 rounded text-sm ${TIER_INFO[current].badge}`}>
          {TIER_INFO[current].name}
        </span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => {
          const info = TIER_INFO[tier];
          const isActive = tier === current;

          return (
            <div
              key={tier}
              className={`rounded-xl border-2 p-6 transition ${
                isActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <h3 className="font-bold text-lg mb-1">{info.name}</h3>
              <p className="text-2xl font-bold text-gray-900 mb-4">{info.price}</p>

              <ul className="space-y-2 mb-6">
                {info.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {isActive ? (
                <div className="text-center text-sm text-blue-600 font-medium py-2">
                  目前使用中
                </div>
              ) : (
                <button
                  onClick={() => handleSelect(tier)}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
                    tier === "premium"
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : tier === "basic"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {tier === "free" ? "切換到免費版" : "升級"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        目前為測試階段，所有方案均可自由切換，不會產生任何費用。
      </p>
    </div>
  );
}
