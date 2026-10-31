import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  DEFAULT_USER_SETTINGS,
  clearUserSearchHistory,
  loadUserSettings,
  resetUserSettings,
  saveUserSettings,
} from "./userSettings";

export const useUserSettings = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "guest";

  const [settings, setSettings] = useState(() => loadUserSettings(userId));

  useEffect(() => {
    setSettings(loadUserSettings(userId));
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSettingsChanged = (event) => {
      const targetUserId = event?.detail?.userId;
      if (targetUserId === userId || targetUserId === "guest") {
        setSettings(event.detail?.settings || loadUserSettings(userId));
      }
    };

    window.addEventListener("library:settings-changed", handleSettingsChanged);
    return () => {
      window.removeEventListener(
        "library:settings-changed",
        handleSettingsChanged,
      );
    };
  }, [userId]);

  const updateSettings = useCallback(
    (updater) => {
      setSettings((prev) => {
        const next =
          typeof updater === "function"
            ? updater(prev)
            : { ...prev, ...updater };
        saveUserSettings(userId, next);
        return next;
      });
    },
    [userId],
  );

  const resetSettings = useCallback(() => {
    const fresh = resetUserSettings(userId);
    setSettings(fresh);
    return fresh;
  }, [userId]);

  const clearHistory = useCallback(() => {
    return clearUserSearchHistory(userId);
  }, [userId]);

  return {
    settings,
    updateSettings,
    resetSettings,
    clearHistory,
    defaultSettings: DEFAULT_USER_SETTINGS,
  };
};
