import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import "./TopBar.css";

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
    <div className="top-bar">
      <div className="top-bar-search">
        <Search className="size-5" />
        <input
          defaultValue={query}
          onChange={debouncedHandler}
          placeholder="Buscar por título o autor..."
          className="top-bar-input"
        />
      </div>

      {/* Chips activos */}
      <AnimatePresence initial={false}>
        {activeChips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="top-bar-chips"
          >
            {activeChips.map((c) => (
              <motion.button
                key={`${c.type}:${c.value}`}
                onClick={() => onClearChip(c)}
                whileTap={{ scale: 0.95 }}
                className="top-bar-chip"
              >
                <div className="top-bar-chip-content">
                  <span className="top-bar-chip-type">{c.type}:</span>
                  <span className="top-bar-chip-value">{c.value}</span>
                  <X className="size-3.5" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
