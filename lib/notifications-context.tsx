import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./auth-context";
import { notificationsAPI } from "./api";
import { supabase } from "./supabase";

export type Notification = {
  id: string;
  customer_id: string;
  type: string;
  title: string;
  body: string | null;
  related_id: string | null;
  related_type: string | null;
  read: boolean;
  created_at: string;
};

type Ctx = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<Ctx>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refresh: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  const refresh = useCallback(async () => {
    if (!customer?.id) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    const { data } = await notificationsAPI.list(50);
    setNotifications((data || []) as Notification[]);
    setLoading(false);
  }, [customer?.id]);

  // Initial load + on customer change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime — listen for new/updated notifications for this customer
  useEffect(() => {
    if (!customer?.id) return;
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch {}
      channelRef.current = null;
    }
    const ch = supabase
      .channel(`notif-${customer.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_notifications", filter: `customer_id=eq.${customer.id}` },
        () => refresh()
      )
      .subscribe();
    channelRef.current = ch;
    return () => {
      try { supabase.removeChannel(ch); } catch {}
      channelRef.current = null;
    };
  }, [customer?.id, refresh]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await notificationsAPI.markRead(id);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await notificationsAPI.markAllRead();
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo<Ctx>(
    () => ({ notifications, unreadCount, loading, refresh, markRead, markAllRead }),
    [notifications, unreadCount, loading, refresh, markRead, markAllRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
