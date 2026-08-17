import React, { useMemo, useState } from "react";

type CollapsibleQuestionProps = {
  text: string;
  limit?: number;
  className?: string;
  isUserBubble?: boolean;
};

export default function CollapsibleQuestion({
  text,
  limit = 40,
  className = "",
  isUserBubble = false,
}: CollapsibleQuestionProps) {
  const [expanded, setExpanded] = useState(false);

  // Normalize spaces and clean internal plugin tags, but preserve the actual question text
  const cleanText = useMemo(() => {
    return (text || "")
      .replace(/^\[PLUGIN:[^\]]+\]\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }, [text]);

  // Split into words
  const words = useMemo(() => {
    return cleanText ? cleanText.split(" ") : [];
  }, [cleanText]);

  const wordCount = words.length;
  const isLong = wordCount > limit;

  // First 40 words
  const previewText = useMemo(() => {
    if (!isLong) return cleanText;
    return words.slice(0, limit).join(" ") + "…";
  }, [cleanText, words, isLong, limit]);

  const displayText = !isLong || expanded ? cleanText : previewText;

  if (isUserBubble) {
    return (
      <div className={`w-full ${className}`}>
        <div className="whitespace-pre-wrap break-words font-medium">
          {displayText}
        </div>

        {isLong && (
          <button
            type="button"
            className="mt-2 text-cyan-400 hover:text-cyan-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            <span>{expanded ? "Show less" : "Show more"}</span>
            <span className={`text-sm transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`question-wrapper ${className}`}>
      <div className="question-text">
        {displayText}
      </div>

      {isLong && (
        <button
          type="button"
          className="show-more-button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          <span>{expanded ? "Show less" : "Show more"}</span>

          <span
            className={`arrow ${expanded ? "up" : "down"}`}
          >
            {expanded ? "⌃" : "⌄"}
          </span>
        </button>
      )}

      <style>{`
        .question-wrapper {
          width: 100%;
          box-sizing: border-box;
          padding: 18px 22px 16px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        .question-text {
          font-size: 16px;
          line-height: 1.55;
          font-weight: 500;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .show-more-button {
          margin-top: 12px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #38bdf8;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;

          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .arrow {
          font-size: 16px;
          line-height: 1;
          display: inline-block;
          transition: transform 180ms ease;
        }

        .arrow.down {
          transform: translateY(-1px);
        }

        .arrow.up {
          transform: translateY(2px);
        }

        .show-more-button:hover {
          color: #7dd3fc;
        }

        .show-more-button:active {
          opacity: 0.65;
        }

        @media (max-width: 600px) {
          .question-wrapper {
            padding: 16px 18px 14px;
            border-radius: 20px;
          }

          .question-text {
            font-size: 15px;
            line-height: 1.5;
          }

          .show-more-button {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}
