// ============================================================
// AI APP — IMAGE PANEL → CHAT HANDOFF SYSTEM
// ============================================================

export type ImageItem = {
  id: string;
  url: string;
  name?: string;
  title?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: ImageItem[];
  timestamp: number;
};

export type ChatHandoff = {
  text: string;
  images: ImageItem[];
  source: "image-panel" | "library-panel" | "direct";
};

export const CHAT_HANDOFF_EVENT = "rishi_chat_handoff_event";

/**
 * Send text and image items from the Image Panel (or Library/Project) directly into Chat.
 * Automatically switches active view to Chat and injects prompt + image context.
 */
export function sendImageToChat(text: string, images: ImageItem[] = [], source: ChatHandoff["source"] = "image-panel") {
  const cleanText = text.trim();

  if (!cleanText && images.length === 0) {
    return;
  }

  const handoffData: ChatHandoff = {
    text: cleanText,
    images: images,
    source,
  };

  // 1. Dispatch custom DOM event for instant reactive handoff
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<ChatHandoff>(CHAT_HANDOFF_EVENT, {
        detail: handoffData,
      })
    );
  }

  return handoffData;
}
