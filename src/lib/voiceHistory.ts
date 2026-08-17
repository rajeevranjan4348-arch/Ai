export interface VoiceHistoryItem {
  id: string;
  text: string;
  timestamp: string;
  isVoice: boolean;
}

const VOICE_HISTORY_KEY = 'voice_history';

export function getVoiceHistory(): VoiceHistoryItem[] {
  try {
    const raw = localStorage.getItem(VOICE_HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    const oldRaw = localStorage.getItem('voice_chat_history');
    if (oldRaw) {
      const oldItems = JSON.parse(oldRaw);
      return oldItems.map((item: any) => ({
        id: item.id || `vh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: item.text,
        timestamp: item.timestamp || new Date().toISOString(),
        isVoice: true,
      }));
    }
    return [];
  } catch (e) {
    console.error('Error reading voice_history', e);
    return [];
  }
}

export function saveToVoiceHistory(text: string): VoiceHistoryItem[] {
  const trimmed = text.trim();
  if (!trimmed) return getVoiceHistory();

  try {
    const history = getVoiceHistory();
    // Prevent duplicate consecutive entries
    if (history.length > 0 && history[0].text.toLowerCase() === trimmed.toLowerCase()) {
      return history;
    }

    const newItem: VoiceHistoryItem = {
      id: `vh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: trimmed,
      timestamp: new Date().toISOString(),
      isVoice: true,
    };

    const updated = [newItem, ...history].slice(0, 100);
    localStorage.setItem(VOICE_HISTORY_KEY, JSON.stringify(updated));
    localStorage.setItem('voice_chat_history', JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent('voice_history_updated', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Error saving to voice_history', e);
    return getVoiceHistory();
  }
}

export function deleteVoiceHistoryItem(id: string): VoiceHistoryItem[] {
  try {
    const history = getVoiceHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(VOICE_HISTORY_KEY, JSON.stringify(updated));
    localStorage.setItem('voice_chat_history', JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent('voice_history_updated', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Error deleting voice history item', e);
    return getVoiceHistory();
  }
}

export function clearVoiceHistory(): VoiceHistoryItem[] {
  try {
    localStorage.removeItem(VOICE_HISTORY_KEY);
    localStorage.removeItem('voice_chat_history');

    window.dispatchEvent(new CustomEvent('voice_history_updated', { detail: [] }));
    return [];
  } catch (e) {
    console.error('Error clearing voice history', e);
    return [];
  }
}
