import { useState, useEffect } from 'react';

const SESSION_KEY = 'research_session_id';

export function useSession() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem(SESSION_KEY, id);
      }
      setSessionId(id);
    } catch {
      // Fallback if localStorage is unavailable
      setSessionId(`anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
    }
  }, []);

  return { sessionId };
}
