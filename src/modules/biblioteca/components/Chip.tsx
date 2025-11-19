import React from "react";
import { Tag } from "lucide-react";

// =====================================================
// 🎨 Paleta (puedes ajustar estos tokens a tu gusto/EMI)
// =====================================================
const palette = {
  border: "border-neutral-700",
  chip: "bg-neutral-800 hover:bg-neutral-700",
};

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export default function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border ${palette.border} ${palette.chip} transition-transform active:scale-95 ${
        active ? "ring-2 ring-emerald-400/40" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <Tag className="size-3.5" />
        <span>{label}</span>
      </div>
    </button>
  );
}
