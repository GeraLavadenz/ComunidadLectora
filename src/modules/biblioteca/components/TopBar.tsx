import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";

// =====================================================
// 🎨 Paleta (puedes ajustar estos tokens a tu gusto/EMI)
// =====================================================
const palette = {
  surface: "bg-neutral-800",
  border: "border-neutral-700",
  chip: "bg-neutral-800 hover:bg-neutral-700",
  text: "text-neutral-100",
  muted: "text-neutral-400",
};

interface TopBarProps {
  query: string;
  onQuery: (s: string) => void;
  activeChips: { type: "genre" | "tag" | "author"; value: string }[];
  onClearChip: (chip: { type: "genre" | "tag" | "author"; value: string }) => void;
}

export default function TopBar({
  query,
  onQuery,
  activeChips,
  onClearChip,
}: TopBarProps) {
  const debouncedHandler = (e: React.ChangeEvent<HTMLInputElement>) => onQuery(e.target.value);
  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 ${palette.surface} border ${palette.border} rounded-2xl px-4 py-2.5`}>
        <Search className="size-5" />
        <input
          defaultValue={query}
          onChange={debouncedHandler}
          placeholder="Buscar por título o autor..."
          className={`bg-transparent outline-none w-full ${palette.text} placeholder:${palette.muted}`}
        />
      </div>

      {/* Chips activos */}
      <AnimatePresence initial={false}>
        {activeChips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap gap-2"
          >
            {activeChips.map((c) => (
              <motion.button
                key={`${c.type}:${c.value}`}
                onClick={() => onClearChip(c)}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 border ${palette.border} ${palette.chip}`}
              >
                <span className="capitalize">{c.type}:</span>
                <span className="font-medium">{c.value}</span>
                <X className="size-3.5" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
