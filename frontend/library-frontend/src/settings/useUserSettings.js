import { useCallback, useEffect, useMemo, useState } from "react";
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

  const loadedSettings = useMemo(() => loadUserSettings(userId), [userId]);
  const [settingsState, setSettingsState] = useState(() => ({
    userId,
    settings: loadedSettings,
  }));
  const settings =
    settingsState.userId === userId ? settingsState.settings : loadedSettings;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSettingsChanged = (event) => {
      const targetUserId = event?.detail?.userId;
      if (targetUserId === userId || targetUserId === "guest") {
        setSettingsState({
          userId,
          settings: event.detail?.settings || loadUserSettings(userId),
        });
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
      const next =
        typeof updater === "function"
          ? updater(settings)
          : { ...settings, ...updater };
      const saved = saveUserSettings(userId, next);
      setSettingsState({ userId, settings: saved });
      return saved;
    },
    [settings, userId],
  );

  const resetSettings = useCallback(() => {
    const fresh = resetUserSettings(userId);
    setSettingsState({ userId, settings: fresh });
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
