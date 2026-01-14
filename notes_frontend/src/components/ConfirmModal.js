import React, { useEffect } from "react";
import "./ConfirmModal.css";

// PUBLIC_INTERFACE
export function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  /**
   * Simple accessible modal dialog.
   * - Closes on Escape
   * - Click outside to cancel
   */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modalOverlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        <div className="modalHeader">
          <h2 id="confirm-modal-title" className="modalTitle">
            {title}
          </h2>
        </div>

        <div className="modalBody">
          <p id="confirm-modal-desc" className="modalMessage">
            {message}
          </p>
        </div>

        <div className="modalFooter">
          <button type="button" className="btn btnGhost" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${variant === "danger" ? "btnDanger" : "btnPrimary"}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
