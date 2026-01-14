import React from "react";
import "./NoteListItem.css";

function formatUpdatedAt(updatedAt) {
  if (!updatedAt) return "";
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// PUBLIC_INTERFACE
export function NoteListItem({ note, selected, onSelect }) {
  /** A single note row (title + updated time). */
  const title = (note?.title || "").trim() || "Untitled";
  const subtitle = formatUpdatedAt(note?.updated_at || note?.updatedAt);

  return (
    <button
      type="button"
      className={`noteRow ${selected ? "noteRowSelected" : ""}`}
      onClick={() => onSelect?.(note)}
      aria-current={selected ? "true" : "false"}
    >
      <div className="noteRowMain">
        <div className="noteRowTitle" title={title}>
          {title}
        </div>
        <div className="noteRowMeta">{subtitle}</div>
      </div>
    </button>
  );
}
