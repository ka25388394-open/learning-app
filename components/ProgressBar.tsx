"use client";

interface Props {
  steps: { key: string; label: string }[];
  currentIndex: number;
  color?: string;
}

export default function ProgressBar({ steps, currentIndex, color = "blue" }: Props) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step.key} className="flex-1 flex flex-col items-center">
          <div
            className={`h-1.5 w-full rounded-full transition ${
              i < currentIndex
                ? `bg-${color}-500`
                : i === currentIndex
                  ? `bg-${color}-300`
                  : "bg-gray-200"
            }`}
          />
          <span className="text-[10px] text-gray-400 mt-1">{step.label}</span>
        </div>
      ))}
    </div>
  );
}
