export interface SharedMediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'other';
  url?: string;
  size?: string;
  source: 'user_uploaded' | 'ai_generated';
  createdAt: string;
  prompt?: string;
  mimeType?: string;
  previewText?: string;
}

const STORAGE_KEY = 'ai_shared_media_store_v1';

export function getSharedMediaItems(): SharedMediaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Provide initial default sample items if store is fresh
      return [
        {
          id: 'sample_img_1',
          name: 'Futuristic City Render.png',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
          size: '1.2 MB',
          source: 'ai_generated',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          prompt: 'A futuristic neon cyberpunk cityscape at midnight'
        },
        {
          id: 'sample_vid_1',
          name: 'Quantum Circuit Dynamics.mp4',
          type: 'video',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-with-moving-electrons-41525-large.mp4',
          size: '3.4 MB',
          source: 'ai_generated',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          prompt: 'Moving electrons across high tech circuit board'
        }
      ];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveSharedMediaItems(items: SharedMediaItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }
}

export function addSharedMediaItem(item: Omit<SharedMediaItem, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): SharedMediaItem {
  const items = getSharedMediaItems();
  const newItem: SharedMediaItem = {
    ...item,
    id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: item.createdAt || new Date().toISOString()
  };

  const updated = [newItem, ...items.filter(i => i.id !== newItem.id)];
  saveSharedMediaItems(updated);
  
  // Dispatch custom window event so all UI components update in real-time
  window.dispatchEvent(new CustomEvent('shared_media_updated', { detail: newItem }));
  return newItem;
}

export function deleteSharedMediaItem(id: string): void {
  const items = getSharedMediaItems();
  const updated = items.filter(item => item.id !== id);
  saveSharedMediaItems(updated);
  window.dispatchEvent(new CustomEvent('shared_media_updated'));
}

export function clearSharedMediaStore(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('shared_media_updated'));
}
