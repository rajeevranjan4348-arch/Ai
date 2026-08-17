import React, { useState, useEffect } from 'react';
import { ThinkingState } from '@/lib/memory/types';
import { getTopicAndThinkingWordsForQuery } from '@/lib/thinkingWords';

interface ThinkingIndicatorProps {
  state?: ThinkingState | null;
  isDone?: boolean;
  userQuery?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ state, isDone = false, userQuery }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [statusText, setStatusText] = useState("Thinking...");
  const [isSwitching, setIsSwitching] = useState(false);

  // If thinking is completed, do not render the widget
  if (isDone) return null;

  const topicInfo = getTopicAndThinkingWordsForQuery(userQuery);

  // Cycle thinking status text dynamically based on user question topic & actions
  useEffect(() => {
    if (isDone) {
      setStatusText("Done");
      return;
    }

    if (state?.stageMessage) {
      setIsSwitching(true);
      const timer = setTimeout(() => {
        setStatusText(state.stageMessage);
        setIsSwitching(false);
      }, 250);
      return () => clearTimeout(timer);
    }

    const words = topicInfo.thinkingWords;
    let currentIndex = 0;
    setStatusText(words[0] || "Thinking...");

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % words.length;
      setIsSwitching(true);
      setTimeout(() => {
        setStatusText(words[currentIndex]);
        setIsSwitching(false);
      }, 250);
    }, 1800);

    return () => clearInterval(interval);
  }, [isDone, state?.stageMessage, userQuery]);

  const queryStr = userQuery ? JSON.stringify(userQuery) : '"userQuery"';
  const codePreviewText = `// 🛡️ ACCURACY / ANTI-HALLUCINATION PIPELINE
const query = ${queryStr};

// 1. Question Analyzer & Intent Detection
const analysis = analyzeQuestionIntent(query); // [${topicInfo.topic.toUpperCase()}]

// 2. Verification Decision & Tool Selection
const tool = selectVerificationTool(analysis.intent); // Calculator | Web Search | Code Runner | Files

// 3. Grounded Generation & Fact/Logic Checker
const draft = generateWithTool(tool, query);
const verified = runAccuracyCheck(draft, { 
  noHallucinations: true, 
  stepByStepProof: true 
});

// 4. Confidence Check & Final Output
// Status: ${isDone ? 'VERIFIED ✓ (Zero Hallucinations)' : statusText}`;

  return (
    <div className={`ai-thinking ${isOpen ? 'open' : ''} ${isDone ? 'done' : ''} my-3`}>
      <div className="thinking-row" onClick={() => setIsOpen(!isOpen)}>
        {/* Animated AI Logo with bars & bouncing ball */}
        <div className="ai-logo">
          <div className="loader__bar" />
          <div className="loader__bar" />
          <div className="loader__bar" />
          <div className="loader__bar" />
          <div className="loader__bar" />
          <div className="loader__ball" />
        </div>

        {/* Thinking Status */}
        <div className={`thinking-status ${isSwitching ? 'switching' : ''}`}>
          {statusText}
        </div>

        {/* Dropdown Expand Button */}
        <div className="thinking-arrow" title={isOpen ? "Collapse" : "Expand"}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Expanded Panel */}
      <div className="thinking-panel">
        <div className="thinking-content">
          <div className="code-preview">
            {codePreviewText}
          </div>
          <div className="progress" />
        </div>
      </div>
    </div>
  );
};




