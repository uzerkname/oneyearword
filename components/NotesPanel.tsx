"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface NotesPanelProps {
  day: number;
}

function getStorageKey(day: number) {
  return `bible-notes-day-${day}`;
}

export default function NotesPanel({ day }: NotesPanelProps) {
  const [saved, setSaved] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load notes from localStorage when day changes
  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(day));
    if (editorRef.current) {
      editorRef.current.innerHTML = stored ?? "";
      setHasContent(!!stored && stored.length > 0);
    }
    setSaved(false);
  }, [day]);

  const saveContent = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    // Treat <br> only or empty tags as empty
    const isEmpty = !html || html === "<br>" || html === "<p><br></p>";
    localStorage.setItem(getStorageKey(day), isEmpty ? "" : html);
    setHasContent(!isEmpty);
    setSaved(true);
  }, [day]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Tab to indent lists
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand(e.shiftKey ? "outdent" : "indent");
      return;
    }

    // Auto-continue lists on Enter
    if (e.key === "Enter" && !e.shiftKey) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;

      const node = sel.anchorNode;
      const textContent = node?.textContent ?? "";

      // Check if we're in the last text node of the current line
      // and the line is empty (user wants to exit the list)
      // The browser handles this natively for <ul>/<ol>, so we only
      // need to handle plain-text patterns like "1. " or "- "

      // Already inside a list? Let the browser handle it natively
      const parentLi = (node instanceof HTMLElement ? node : node?.parentElement)?.closest("li");
      if (parentLi) return;

      // Plain text: detect "N. " or "- " or "* " patterns
      const lineText = textContent.substring(0, sel.anchorOffset);
      const lastNewline = lineText.lastIndexOf("\n");
      const currentLine = lineText.substring(lastNewline + 1);

      // Numbered list: "1. something" → insert "2. " on next line
      const numMatch = currentLine.match(/^(\d+)\.\s/);
      if (numMatch) {
        e.preventDefault();
        const nextNum = parseInt(numMatch[1], 10) + 1;
        document.execCommand("insertText", false, "\n" + nextNum + ". ");
        saveContent();
        return;
      }

      // Bullet list: "- something" or "* something" → continue
      const bulletMatch = currentLine.match(/^([*-])\s/);
      if (bulletMatch) {
        // If line is just the bullet marker with no content, clear it (exit list)
        if (currentLine.trim() === bulletMatch[1]) {
          return; // let browser handle normal enter
        }
        e.preventDefault();
        document.execCommand("insertText", false, "\n" + bulletMatch[1] + " ");
        saveContent();
        return;
      }
    }
  }, [saveContent]);

  return (
    <div className="flex flex-col h-full bg-leather-text">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-leather-border bg-leather-text px-4 py-2">
        <span className="text-leather-accent font-bold text-xs font-sans uppercase tracking-widest">
          Notes
        </span>
        {saved && hasContent && (
          <span className="text-leather-muted text-xs font-sans">
            Saved locally
          </span>
        )}
      </div>

      {/* Rich text editor */}
      <div className="flex-1 overflow-y-auto p-3">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={saveContent}
          onKeyDown={handleKeyDown}
          data-placeholder="Write your thoughts on today's reading..."
          className="notes-editor w-full h-full bg-transparent text-leather-body font-serif text-sm
            leading-relaxed outline-none"
        />
      </div>
    </div>
  );
}
