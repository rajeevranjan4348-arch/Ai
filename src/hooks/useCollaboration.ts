import { useState, useEffect, useRef } from 'react';
import { blink } from '@/lib/blink';

export interface Collaborator {
  userId: string;
  metadata?: { name?: string; color?: string };
  joinedAt: number;
  lastSeen: number;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

function getColor(sessionId: string): string {
  let hash = 0;
  for (const c of sessionId) hash = ((hash << 5) - hash) + c.charCodeAt(0);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function useCollaboration(
  threadId: string | undefined,
  sessionId: string
) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!threadId || !sessionId) return;

    let channel: any = null;
    let mounted = true;

    const init = async () => {
      try {
        channel = blink.realtime.channel(`thread-${threadId}`);
        channelRef.current = channel;

        await channel.subscribe({
          userId: sessionId,
          metadata: {
            name: `Researcher ${sessionId.slice(-4)}`,
            color: getColor(sessionId),
          },
        });

        if (!mounted) return;
        setIsConnected(true);

        channel.onPresence((users: any[]) => {
          if (!mounted) return;
          // Filter out self, cast to Collaborator shape
          const others: Collaborator[] = users
            .filter((u) => u.userId !== sessionId)
            .map((u) => ({
              userId: u.userId,
              metadata: u.metadata,
              joinedAt: u.joinedAt ?? Date.now(),
              lastSeen: u.lastSeen ?? Date.now(),
            }));
          setCollaborators(others);
        });
      } catch (error) {
        console.error('Collaboration connection failed:', error);
      }
    };

    init().catch(console.error);

    return () => {
      mounted = false;
      try {
        channel?.unsubscribe?.();
      } catch (e) {}
      channelRef.current = null;
      setIsConnected(false);
      setCollaborators([]);
    };
  }, [threadId, sessionId]);

  const publishMessage = async (type: string, data: any) => {
    if (channelRef.current) {
      try {
        await channelRef.current.publish(type, data, { userId: sessionId });
      } catch (e) {
        console.warn('Failed to publish collaboration message:', e);
      }
    }
  };

  return { collaborators, isConnected, publishMessage };
}
