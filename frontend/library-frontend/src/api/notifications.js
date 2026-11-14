import { api } from "./client.js";

const isNotification = (value) =>
  Number.isSafeInteger(value?.id) &&
  value.id > 0 &&
  typeof value?.eventType === "string" &&
  typeof value?.title === "string" &&
  typeof value?.message === "string" &&
  (value?.actionUrl == null || typeof value.actionUrl === "string") &&
  (value?.readAt == null || typeof value.readAt === "string");

const isPreferencePayload = (value) =>
  value &&
  [
    "emailDueReminder",
    "emailOverdueAlert",
    "emailReservationUpdates",
    "emailMembershipUpdates",
    "emailGeneralAnnouncements",
    "emailAdminReturnRequests",
  ].every((key) => typeof value[key] === "boolean");

export const createNotificationsApi = (client) => ({
  list: async ({ page = 0, size = 20, unreadOnly = false } = {}, options) => {
    if (
      !Number.isSafeInteger(page) ||
      page < 0 ||
      !Number.isSafeInteger(size) ||
      size < 1 ||
      size > 100
    )
      throw new Error("Trang thông báo không hợp lệ.");
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      unreadOnly: String(Boolean(unreadOnly)),
    });
    const result = await client.get(`/api/notifications?${query}`, options);
    if (
      !Array.isArray(result?.content) ||
      !Number.isSafeInteger(result?.totalElements) ||
      result.totalElements < 0 ||
      !Number.isSafeInteger(result?.totalPages) ||
      result.totalPages < 0 ||
      result.content.some((item) => !isNotification(item))
    )
      throw new Error("Dữ liệu thông báo không hợp lệ.");
    return result;
  },
  unreadCount: async (options) => {
    const result = await client.get("/api/notifications/unread-count", options);
    if (!Number.isSafeInteger(result?.unreadCount) || result.unreadCount < 0)
      throw new Error("Số lượng thông báo chưa đọc không hợp lệ.");
    return result.unreadCount;
  },
  markRead: (id, options) => {
    if (!Number.isSafeInteger(id) || id < 1)
      throw new Error("Mã thông báo không hợp lệ.");
    return client.patch(`/api/notifications/${id}/read`, undefined, options);
  },
  markAllRead: (options) =>
    client.patch("/api/notifications/read-all", undefined, options),
  preferences: async (options) => {
    const result = await client.get("/api/notifications/preferences", options);
    if (!isPreferencePayload(result))
      throw new Error("Dữ liệu cài đặt email không hợp lệ.");
    return result;
  },
  updatePreferences: async (preferences, options) => {
    if (!isPreferencePayload(preferences))
      throw new Error("Cần chọn đầy đủ các tùy chọn email.");
    const result = await client.put(
      "/api/notifications/preferences",
      preferences,
      options,
    );
    if (!isPreferencePayload(result))
      throw new Error("Máy chủ trả về cài đặt email không hợp lệ.");
    return result;
  },
});

export const notificationsApi = createNotificationsApi(api);

export const notificationPath = (actionUrl, role) => {
  const fallback = role === "ROLE_ADMIN" ? "/admin" : "/user";
  if (
    typeof actionUrl !== "string" ||
    !actionUrl.startsWith("/") ||
    actionUrl.startsWith("//") ||
    actionUrl.includes("\\") ||
    actionUrl.includes("\r") ||
    actionUrl.includes("\n")
  )
    return fallback;
  return actionUrl;
};
