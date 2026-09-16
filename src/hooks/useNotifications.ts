import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  is_unread: boolean;
  created_at: string;
}

interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL_MS = 30_000;

export function useNotifications(enabled: boolean): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await api.get<AppNotification[]>('/api/me/notifications');
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      setUnreadCount(list.filter(n => n.is_unread).length);
    } catch {
      // Silently ignore — network issues should not break the UI
    }
  }, [enabled]);

  // Initial load
  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    fetch().finally(() => setLoading(false));
  }, [enabled, fetch]);

  // Polling every 30 seconds
  useEffect(() => {
    if (!enabled) return;
    intervalRef.current = setInterval(fetch, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetch]);

  const markRead = useCallback(async (id: string) => {
    try {
      const updated = await api.patch<AppNotification>(`/api/me/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_unread: false, read_at: updated.read_at } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.post('/api/me/notifications/mark-all-read');
      const now = new Date().toISOString();
      setNotifications(prev => prev.map(n => ({ ...n, is_unread: false, read_at: now })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refresh: fetch,
  };
}
