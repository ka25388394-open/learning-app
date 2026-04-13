"use client";

export type Tier = "free" | "basic" | "premium";

const STORAGE_KEY = "user-tier";

export const TIER_INFO: Record<Tier, {
  name: string;
  price: string;
  features: string[];
  color: string;
  badge: string;
}> = {
  free: {
    name: "免費版",
    price: "免費",
    features: [
      "基礎課程拆解",
      "規則型題目判斷",
      "固定文字引導",
    ],
    color: "gray",
    badge: "bg-gray-100 text-gray-600",
  },
  basic: {
    name: "基礎版",
    price: "NT$150/月",
    features: [
      "進階課程拆解",
      "AI 簡答評估（基本回饋）",
      "AI 答錯引導",
    ],
    color: "blue",
    badge: "bg-blue-100 text-blue-700",
  },
  premium: {
    name: "進階版",
    price: "NT$450/月",
    features: [
      "進階課程拆解",
      "AI 深度評估（個人化回饋）",
      "AI 個人化引導",
      "行動空間 AI 陪伴",
    ],
    color: "amber",
    badge: "bg-amber-100 text-amber-700",
  },
};

export function getTier(): Tier {
  if (typeof window === "undefined") return "free";
  return (localStorage.getItem(STORAGE_KEY) as Tier) || "free";
}

export function setTier(tier: Tier) {
  localStorage.setItem(STORAGE_KEY, tier);
}
