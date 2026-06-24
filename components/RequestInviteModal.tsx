"use client";

import { useState, useEffect } from "react";

interface RequestInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  happeningTitle: string;
  onSubmit: (data: { partySize: number; note: string }) => void;
}

export default function RequestInviteModal({
  isOpen,
  onClose,
  happeningTitle,
  onSubmit,
}: RequestInviteModalProps) {
  const [partySize, setPartySize] = useState<number>(2);
  const [note, setNote] = useState<string>("");

  // Handle escape key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ partySize, note });
    // Reset form states
    setPartySize(2);
    setNote("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="modal-header">
          <span className="modal-header-title">
            REQUEST_TRANSMISSION
          </span>
          <div className="modal-header-status">
            <span className="modal-header-status-dot" />
            <span className="modal-header-status-label">
              PENDING_AUTH
            </span>
          </div>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div>
            <span className="modal-field-label">
              TARGET_UNIT
            </span>
            <span className="modal-field-value-static">
              {happeningTitle}
            </span>
          </div>

          {/* Party Size Field */}
          <div>
            <label htmlFor="party-size" className="modal-field-label">
              PARTY_SIZE_MULTIPLIER (1-10)
            </label>
            <select
              id="party-size"
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value, 10))}
              className="modal-select"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1} className="bg-zinc-950">
                  {i + 1} {i + 1 === 1 ? "OPERATIVE" : "OPERATIVES"}
                </option>
              ))}
            </select>
          </div>

          {/* Intro Note Field */}
          <div>
            <label htmlFor="intro-note" className="modal-field-label">
              INTRO_TRANSMISSION_NOTE
            </label>
            <textarea
              id="intro-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="State your credentials and target intent to host..."
              maxLength={240}
              required
              className="modal-textarea"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions-container">
            <button
              type="submit"
              className="modal-submit-btn"
            >
              SUBMIT_REQUEST_GATE
            </button>
            <button
              type="button"
              onClick={onClose}
              className="modal-abort-btn"
            >
              ABORT_TRANSMISSION
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
