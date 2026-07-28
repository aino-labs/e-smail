import React, { useState, useRef, useEffect, useCallback } from "react";
import "./InputEmail.scss";
import { AppStorage } from "../../store/AppStorage";
import { measureTextWidth } from "../../utils/textTruncation";

// ────────────── Types & helpers ──────────────
interface InputEmailProps {
  emails?: string[];
  input_title?: string;
  placeholder?: string;
  onChange?: (validEmails: string[], invalidEmails: string[]) => void;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const trimEmailToFit = (
  email: string,
  maxWidth = 240,
  font = "16px system-ui, sans-serif",
): string => {
  if (measureTextWidth(email, font) <= maxWidth) return email;

  const atIdx = email.lastIndexOf("@");

  if (atIdx <= 0) {
    let truncated = email;
    while (
      measureTextWidth(truncated + "...", font) > maxWidth &&
      truncated.length > 0
    ) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + "...";
  }

  const localPart = email.substring(0, atIdx);
  const domain = email.substring(atIdx);

  if (measureTextWidth(domain, font) > maxWidth) {
    return email.substring(0, Math.floor(maxWidth / 8)) + "...";
  }

  const remainingWidth =
    maxWidth - measureTextWidth(domain, font) - measureTextWidth("...", font);

  if (remainingWidth <= 0) return "..." + domain;

  let low = 0,
    high = localPart.length;
  let best = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = localPart.substring(0, mid);
    if (measureTextWidth(candidate, font) <= remainingWidth) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const trimmedLocal = localPart.substring(0, best);
  return trimmedLocal + "..." + domain;
};

// ────────────── Component ──────────────────────────────
const InputEmail: React.FC<InputEmailProps> = ({
  emails: initialEmails = [],
  input_title,
  placeholder,
  onChange,
}) => {
  const [state, setState] = useState({
    emails: [] as string[],
    invalidEmails: initialEmails.filter((e) => !validateEmail(e)),
    currentInput: "",
    error: "",
    editingIndex: null as number | null,
    editValue: "",
  });

  const updateState = useCallback(
    (updates: Partial<typeof state>) =>
      setState((prev) => ({ ...prev, ...updates })),
    [],
  );

  const tagsEl = useRef<HTMLDivElement | null>(null);
  const lastClickTime = useRef(0);
  const lastTapTime = useRef(0);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateFadeState = useCallback(() => {
    const el = tagsEl.current;
    if (!el) return;
    const overflowing = el.scrollWidth > el.clientWidth;
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth;
    el.classList.toggle("has-overflow", overflowing && !isAtEnd);
  }, []);

  useEffect(() => {
    updateFadeState();
  });

  const handleTagsScroll = useCallback(() => {
    updateFadeState();
  }, [updateFadeState]);

  // ── Edit mode handlers ───────────────────────────────
  const startEditing = useCallback(
    (index: number) => {
      updateState({
        editingIndex: index,
        editValue: stateRef.current.emails[index],
      });
    },
    [updateState],
  );

  const cancelEdit = useCallback(() => {
    updateState({ editingIndex: null, editValue: "", error: "" });
  }, [updateState]);

  const commitEdit = useCallback(() => {
    const { editingIndex, editValue, emails, invalidEmails } = stateRef.current;
    if (editingIndex === null) return;

    const trimmed = editValue.trim();
    if (!trimmed || trimmed === emails[editingIndex]) {
      cancelEdit();
      return;
    }

    if (!validateEmail(trimmed)) {
      updateState({
        error: "Некорректный email адрес",
        editingIndex: null,
        editValue: "",
      });
      return;
    }

    if (emails.some((e, i) => i !== editingIndex && e === trimmed)) {
      updateState({ error: "Такой email уже добавлен" });
      return;
    }

    const newEmails = [...emails];
    newEmails[editingIndex] = trimmed;
    const newInvalid = invalidEmails.filter((e) => e !== emails[editingIndex]);

    updateState({
      emails: newEmails,
      invalidEmails: newInvalid,
      editingIndex: null,
      editValue: "",
      error: "",
    });

    onChange?.(newEmails, newInvalid);
  }, [updateState, cancelEdit, onChange]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [commitEdit, cancelEdit],
  );

  // ── Tag click / touch for double‑tap editing ─────────
  const handleTagClick = useCallback(
    (index: number) => {
      const now = Date.now();
      if (now - lastClickTime.current < 300) startEditing(index);
      lastClickTime.current = now;
    },
    [startEditing],
  );

  const handleTagTouchEnd = useCallback(
    (index: number, e: React.TouchEvent) => {
      if ((e.target as HTMLElement).closest(".remove-email")) return;
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        e.preventDefault();
        startEditing(index);
      }
      lastTapTime.current = now;
    },
    [startEditing],
  );

  // ── Main email input ──────────────────────────────────
  const handleInput = useCallback(
    (e: React.InputEvent<HTMLInputElement>) => {
      updateState({
        currentInput: e.currentTarget.value,
        error: "",
      });
    },
    [updateState],
  );

  // ── Core operations ———————————————————————————————————
  const addEmail = useCallback(
    (email: string) => {
      const trimmed = email.trim();
      if (!trimmed) return;

      const { emails, invalidEmails } = stateRef.current;

      if (!validateEmail(trimmed)) {
        const newEmails = [...emails, trimmed];
        const newInvalid = [...invalidEmails, trimmed];
        updateState({
          emails: newEmails,
          invalidEmails: newInvalid,
          currentInput: "",
          error: "Некорректный email адрес",
        });
        onChange?.(newEmails, newInvalid);
        return;
      }

      if (emails.includes(trimmed)) {
        updateState({ error: "Такой email уже добавлен" });
        return;
      }

      const newEmails = [...emails, trimmed];
      updateState({
        emails: newEmails,
        currentInput: "",
        error: "",
      });
      onChange?.(newEmails, invalidEmails);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addEmail(stateRef.current.currentInput);
      }
    },
    [addEmail],
  );

  const removeEmail = useCallback(
    (index: number) => {
      const { emails, invalidEmails } = stateRef.current;
      const newEmails = [...emails];
      const removed = newEmails.splice(index, 1)[0];
      const newInvalid = invalidEmails.filter((e) => e !== removed);

      updateState({ emails: newEmails, invalidEmails: newInvalid, error: "" });
      onChange?.(newEmails, newInvalid);
    },
    [onChange],
  );

  const handleOnBlur = useCallback(() => {
    const { currentInput } = stateRef.current;
    if (currentInput.trim()) addEmail(currentInput);
  }, [addEmail]);

  const { emails, currentInput, invalidEmails, editingIndex, editValue } =
    state;

  return (
    <div className="input-container">
      <span className="input__title">{input_title}</span>
      <div className="input-form">
        <div
          className="tags-scrollable"
          ref={tagsEl}
          onScroll={handleTagsScroll}
        >
          {emails.map((email, index) => {
            const isInvalid = invalidEmails.includes(email);
            const isEditing = index === editingIndex;

            return (
              <span
                key={index}
                className={isInvalid ? "email-tag__error" : "email-tag"}
                onClick={() => handleTagClick(index)}
                onTouchEnd={(e) => handleTagTouchEnd(index, e)}
              >
                {isEditing ? (
                  <input
                    className="edit-input"
                    value={editValue}
                    onChange={(e) => updateState({ editValue: e.target.value })}
                    onBlur={commitEdit}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="email-text">{trimEmailToFit(email)}</span>
                    <button
                      type="button"
                      className="remove-email"
                      onClick={() => removeEmail(index)}
                    >
                      ×
                    </button>
                  </>
                )}
              </span>
            );
          })}
        </div>
        <input
          type="text"
          value={currentInput}
          onInput={handleInput}
          onBlur={handleOnBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="email-input"
        />
      </div>
    </div>
  );
};

export default InputEmail;
