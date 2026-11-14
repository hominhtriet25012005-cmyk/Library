import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { notificationsApi } from "../api/notifications.js";
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
  const preferenceScope = `${userId}:${user?.role || ""}`;

  const loadedSettings = useMemo(() => loadUserSettings(userId), [userId]);
  const [settingsState, setSettingsState] = useState(() => ({
    userId,
    settings: loadedSettings,
  }));
  const settings =
    settingsState.userId === userId ? settingsState.settings : loadedSettings;
  const [preferenceState, setPreferenceState] = useState({
    scope: preferenceScope,
    preferences: null,
    loading: true,
    saving: false,
    error: "",
  });
  const preferences =
    preferenceState.scope === preferenceScope
      ? preferenceState.preferences
      : null;
  const preferencesLoading =
    preferenceState.scope !== preferenceScope || preferenceState.loading;
  const preferencesSaving =
    preferenceState.scope === preferenceScope && preferenceState.saving;
  const preferencesError =
    preferenceState.scope === preferenceScope ? preferenceState.error : "";

  useEffect(() => {
    const controller = new AbortController();
    if (!user?.id) {
      setPreferenceState({
        scope: preferenceScope,
        preferences: null,
        loading: false,
        saving: false,
        error: "Vui lòng đăng nhập để tải cài đặt email.",
      });
      return () => controller.abort();
    }

    setPreferenceState({
      scope: preferenceScope,
      preferences: null,
      loading: true,
      saving: false,
      error: "",
    });
    notificationsApi
      .preferences({ signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setPreferenceState({
          scope: preferenceScope,
          preferences: result,
          loading: false,
          saving: false,
          error: "",
        });
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === "AbortError") return;
        setPreferenceState({
          scope: preferenceScope,
          preferences: null,
          loading: false,
          saving: false,
          error: error?.message || "Không tải được cài đặt email.",
        });
      });
    return () => controller.abort();
  }, [preferenceScope, user?.id]);

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

  const updateNotificationPreference = useCallback(
    async (key, value) => {
      if (!preferences || typeof preferences[key] !== "boolean") {
        throw new Error("Cài đặt email chưa được tải. Vui lòng thử lại.");
      }
      const nextPreferences = { ...preferences, [key]: Boolean(value) };
      setPreferenceState((current) =>
        current.scope === preferenceScope
          ? { ...current, saving: true, error: "" }
          : current,
      );
      try {
        const saved = await notificationsApi.updatePreferences(nextPreferences);
        setPreferenceState({
          scope: preferenceScope,
          preferences: saved,
          loading: false,
          saving: false,
          error: "",
        });
        return saved;
      } catch (error) {
        setPreferenceState((current) =>
          current.scope === preferenceScope
            ? {
                ...current,
                saving: false,
                error: error?.message || "Không lưu được cài đặt email.",
              }
            : current,
        );
        throw error;
      }
    },
    [preferences, preferenceScope],
  );

  const resetNotificationPreferences = useCallback(async () => {
    const defaults = {
      emailDueReminder: true,
      emailOverdueAlert: true,
      emailReservationUpdates: true,
      emailMembershipUpdates: true,
      emailGeneralAnnouncements: true,
      emailAdminReturnRequests: true,
    };
    setPreferenceState((current) =>
      current.scope === preferenceScope
        ? { ...current, saving: true, error: "" }
        : current,
    );
    try {
      const saved = await notificationsApi.updatePreferences(defaults);
      setPreferenceState({
        scope: preferenceScope,
        preferences: saved,
        loading: false,
        saving: false,
        error: "",
      });
      return saved;
    } catch (error) {
      setPreferenceState((current) =>
        current.scope === preferenceScope
          ? {
              ...current,
              saving: false,
              error: error?.message || "Không khôi phục được cài đặt email.",
            }
          : current,
      );
      throw error;
    }
  }, [preferenceScope]);

  const reloadNotificationPreferences = useCallback(async () => {
    if (!user?.id) return false;
    setPreferenceState((current) =>
      current.scope === preferenceScope
        ? { ...current, loading: true, error: "" }
        : current,
    );
    try {
      const loaded = await notificationsApi.preferences();
      setPreferenceState({
        scope: preferenceScope,
        preferences: loaded,
        loading: false,
        saving: false,
        error: "",
      });
      return true;
    } catch (error) {
      setPreferenceState((current) =>
        current.scope === preferenceScope
          ? {
              ...current,
              loading: false,
              error: error?.message || "Không tải được cài đặt email.",
            }
          : current,
      );
      return false;
    }
  }, [preferenceScope, user?.id]);

  const clearHistory = useCallback(() => {
    return clearUserSearchHistory(userId);
  }, [userId]);

  return {
    settings,
    preferences,
    preferencesLoading,
    preferencesSaving,
    preferencesError,
    isAdmin: user?.role === "ROLE_ADMIN",
    updateNotificationPreference,
    resetNotificationPreferences,
    reloadNotificationPreferences,
    updateSettings,
    resetSettings,
    clearHistory,
    defaultSettings: DEFAULT_USER_SETTINGS,
  };
};
