import React from "react";
import { Tag } from "lucide-react";
import "../styles/Chip.css";

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export default function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`chip ${active ? "chip-active" : ""}`}
    >
      <div className="chip-content">
        <Tag className="size-3.5" />
        <span>{label}</span>
      </div>
    </button>
  );
}
