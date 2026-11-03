export const DEFAULT_USER_SETTINGS = Object.freeze({
  notifications: Object.freeze({
    dueReminder: true,
    reminderDaysBefore: 2,
    reservationAlert: true,
    overdueAlert: true,
    newsletter: false,
  }),
  appearance: Object.freeze({
    theme: "light",
    defaultBookView: "grid",
    booksPerPage: 12,
  }),
  privacy: Object.freeze({
    anonymousReview: false,
    saveSearchHistory: true,
  }),
  localization: Object.freeze({
    language: "vi",
    dateFormat: "DD/MM/YYYY",
  }),
});

export const getStorageKey = (userId) =>
  `library_user_settings_${userId ?? "guest"}`;

export const getSearchHistoryKey = (userId) =>
  `library_search_history_${userId ?? "guest"}`;

export const normalizeUserSettings = (raw) => {
  if (!raw || typeof raw !== "object") {
    return {
      notifications: { ...DEFAULT_USER_SETTINGS.notifications },
      appearance: { ...DEFAULT_USER_SETTINGS.appearance },
      privacy: { ...DEFAULT_USER_SETTINGS.privacy },
      localization: { ...DEFAULT_USER_SETTINGS.localization },
    };
  }

  return {
    notifications: {
      ...DEFAULT_USER_SETTINGS.notifications,
      ...(raw.notifications && typeof raw.notifications === "object"
        ? raw.notifications
        : {}),
    },
    appearance: {
      ...DEFAULT_USER_SETTINGS.appearance,
      ...(raw.appearance && typeof raw.appearance === "object"
        ? raw.appearance
        : {}),
    },
    privacy: {
      ...DEFAULT_USER_SETTINGS.privacy,
      ...(raw.privacy && typeof raw.privacy === "object" ? raw.privacy : {}),
    },
    localization: {
      ...DEFAULT_USER_SETTINGS.localization,
      ...(raw.localization && typeof raw.localization === "object"
        ? raw.localization
        : {}),
    },
  };
};

export const loadUserSettings = (userId) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return normalizeUserSettings(null);
    }
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return normalizeUserSettings(null);
    return normalizeUserSettings(JSON.parse(raw));
  } catch (error) {
    console.error("Failed to load user settings:", error);
    return normalizeUserSettings(null);
  }
};

export const saveUserSettings = (userId, settings) => {
  const normalized = normalizeUserSettings(settings);
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(
        getStorageKey(userId),
        JSON.stringify(normalized),
      );
      if (typeof window.dispatchEvent === "function") {
        window.dispatchEvent(
          new CustomEvent("library:settings-changed", {
            detail: { userId: userId ?? "guest", settings: normalized },
          }),
        );
      }
    }
    return normalized;
  } catch (error) {
    console.error("Failed to save user settings:", error);
    return normalized;
  }
};

export const resetUserSettings = (userId) => {
  return saveUserSettings(userId, DEFAULT_USER_SETTINGS);
};

export const clearUserSearchHistory = (userId) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(getSearchHistoryKey(userId));
      if (typeof window.dispatchEvent === "function") {
        window.dispatchEvent(
          new CustomEvent("library:search-history-cleared", {
            detail: { userId: userId ?? "guest" },
          }),
        );
      }
    }
    return true;
  } catch (error) {
    console.error("Failed to clear search history:", error);
    return false;
  }
};

export const getUserSearchHistory = (userId) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = window.localStorage.getItem(getSearchHistoryKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export const addUserSearchHistory = (userId, term) => {
  if (!term || !term.trim()) return [];
  const clean = term.trim();
  try {
    const list = getUserSearchHistory(userId).filter(
      (t) => t.toLowerCase() !== clean.toLowerCase(),
    );
    const updated = [clean, ...list].slice(0, 5);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(
        getSearchHistoryKey(userId),
        JSON.stringify(updated),
      );
      if (typeof window.dispatchEvent === "function") {
        window.dispatchEvent(
          new CustomEvent("library:search-history-updated", {
            detail: { userId: userId ?? "guest", history: updated },
          }),
        );
      }
    }
    return updated;
  } catch (error) {
    return [];
  }
};
