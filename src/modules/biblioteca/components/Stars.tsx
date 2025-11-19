import React from "react";
import { Star } from "lucide-react";

// =====================================================
// 🎨 Paleta (puedes ajustar estos tokens a tu gusto/EMI)
// =====================================================
const palette = {
  muted: "text-neutral-400",
};

interface StarsProps {
  value?: number;
}

export default function Stars({ value = 0 }: StarsProps) {
  const whole = Math.floor(value);
  return (
    <div className="flex items-center gap-0.5" aria-label={`Calificación ${value} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-4 ${i < whole ? "fill-yellow-400 stroke-yellow-400" : "stroke-neutral-500"}`} />
      ))}
      <span className={`ml-1 text-xs ${palette.muted}`}>{value.toFixed(1)}</span>
    </div>
  );
}
