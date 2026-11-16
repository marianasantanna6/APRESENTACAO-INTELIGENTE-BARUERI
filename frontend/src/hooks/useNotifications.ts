import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../lib/apiClient";

export type Notification = {
  id: string;
  action: "aprovou" | "rejeitou";
  project: string;
  moment: string;
  read: boolean;
};

const STORAGE_KEY = "barueri:last_seen_notification";

function getLastSeenId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setLastSeenId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await authFetch(
        "/api/projects-logs?mine_projects=true&action=aprovou",
      );
      const resR = await authFetch(
        "/api/projects-logs?mine_projects=true&action=rejeitou",
      );
      if (!res.ok || !resR.ok) return;

      const approved: { id: string; action: string; project: string; moment: string }[] =
        await res.json();
      const rejected: { id: string; action: string; project: string; moment: string }[] =
        await resR.json();

      const all = [...approved, ...rejected].sort(
        (a, b) => new Date(b.moment).getTime() - new Date(a.moment).getTime(),
      );

      const lastSeen = getLastSeenId();
      const lastSeenNum = lastSeen ? BigInt(lastSeen) : 0n;

      const mapped: Notification[] = all.map((log) => ({
        id: log.id,
        action: log.action as "aprovou" | "rejeitou",
        project: log.project,
        moment: log.moment,
        read: BigInt(log.id) <= lastSeenNum,
      }));

      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.read).length);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function markAllRead() {
    if (notifications.length === 0) return;
    const maxId = notifications.reduce(
      (max, n) => (BigInt(n.id) > BigInt(max) ? n.id : max),
      "0",
    );
    setLastSeenId(maxId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  function open() {
    setIsOpen(true);
    markAllRead();
  }

  function close() {
    setIsOpen(false);
  }

  return { notifications, unreadCount, isOpen, open, close, refresh };
}
