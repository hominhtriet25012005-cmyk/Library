import { useCallback, useEffect, useRef, useState } from "react";
import { notificationsApi } from "../api/notifications.js";

const initialState = (scope) => ({
  scope,
  notifications: [],
  unreadCount: 0,
  error: "",
  loading: true,
  page: 0,
  totalPages: 0,
});

export const useNotifications = ({
  enabled = true,
  scope = "current-user",
} = {}) => {
  const [state, setState] = useState(() => initialState(scope));
  const [selection, setSelection] = useState({ scope, page: 0 });
  const selectedPage = selection.scope === scope ? selection.page : 0;
  const requestController = useRef(null);
  const matchesScope = state.scope === scope;
  const notifications = matchesScope && state.page === selectedPage ? state.notifications : [];
  const unreadCount = matchesScope ? state.unreadCount : 0;
  const error = matchesScope ? state.error : "";
  const loading = enabled && (!matchesScope || state.loading || state.page !== selectedPage);
  const totalPages = matchesScope ? state.totalPages : 0;
  const changePage = (nextPage) => {
    if (!enabled || loading || !Number.isInteger(nextPage) || nextPage < 0 ||
        nextPage >= totalPages || nextPage === selectedPage) return;
    setSelection({ scope, page: nextPage });
  };

  const refresh = useCallback(async () => {
    requestController.current?.abort();
    if (!enabled) {
      setState(initialState(scope));
      return;
    }
    const controller = new AbortController();
    requestController.current = controller;
    setState((current) => ({
      ...(current.scope === scope ? current : initialState(scope)),
      loading: true,
    }));
    try {
      const [page, count] = await Promise.all([
        notificationsApi.list({ page: selectedPage, size: 20 }, { signal: controller.signal }),
        notificationsApi.unreadCount({ signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      if (selectedPage > 0 && selectedPage >= page.totalPages) {
        setSelection({ scope, page: Math.max(0, page.totalPages - 1) });
        return;
      }
      setState({
        scope,
        page: selectedPage,
        totalPages: page.totalPages,
        notifications: page.content,
        unreadCount: count,
        error: "",
        loading: false,
      });
    } catch (requestError) {
      if (controller.signal.aborted || requestError?.name === "AbortError")
        return;
      setState((current) => ({
        ...(current.scope === scope ? current : initialState(scope)),
        error: requestError?.message || "Không tải được thông báo.",
        page: selectedPage,
        notifications: current.scope === scope && current.page === selectedPage ? current.notifications : [],
        loading: false,
      }));
    } finally {
      if (requestController.current === controller) requestController.current = null;
    }
  }, [enabled, scope, selectedPage]);

  useEffect(() => {
    void refresh();
    if (!enabled) return undefined;
    const interval = window.setInterval(() => void refresh(), 30_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      requestController.current?.abort();
    };
  }, [enabled, refresh]);

  const markAsRead = useCallback(
    async (id) => {
      const item =
        state.scope === scope
          ? state.notifications.find((notification) => notification.id === id)
          : null;
      if (!item || item.readAt) return true;
      try {
        const result = await notificationsApi.markRead(id);
        setState((current) => {
          if (current.scope !== scope) return current;
          const wasUnread = current.notifications.some(
            (notification) => notification.id === id && !notification.readAt,
          );
          return {
            ...current,
            notifications: current.notifications.map((notification) =>
              notification.id === id
                ? {
                    ...notification,
                    readAt: result?.readAt || new Date().toISOString(),
                  }
                : notification,
            ),
            unreadCount: wasUnread
              ? Math.max(0, current.unreadCount - 1)
              : current.unreadCount,
            error: "",
          };
        });
        return true;
      } catch (requestError) {
        setState((current) =>
          current.scope === scope
            ? {
                ...current,
                error:
                  requestError?.message || "Không thể đánh dấu đã đọc.",
              }
            : current,
        );
        return false;
      }
    },
    [scope, state],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      const readAt = new Date().toISOString();
      setState((current) => current.scope === scope
        ? {
            ...current,
            notifications: current.notifications.map((item) => item.readAt ? item : { ...item, readAt }),
            unreadCount: 0,
            error: "",
          }
        : current);
      return true;
    } catch (requestError) {
      setState((current) => current.scope === scope
        ? { ...current, error: requestError?.message || "Không thể đánh dấu đã đọc." }
        : current);
      return false;
    }
  }, [scope]);

  return { notifications, unreadCount, error, loading, refresh, markAsRead, markAllAsRead,
    page: selectedPage, totalPages, changePage };
};
