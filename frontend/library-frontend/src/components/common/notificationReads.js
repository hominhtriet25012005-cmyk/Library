export const readNotificationIds = (storageKey) => {
  if (!storageKey || typeof window === "undefined") return new Set();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

export const writeNotificationIds = (storageKey, ids) => {
  if (!storageKey || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...ids]));
  } catch {
    // Notifications remain usable if this browser blocks local storage.
  }
};
