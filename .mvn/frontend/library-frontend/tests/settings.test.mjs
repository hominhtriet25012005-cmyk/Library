import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_USER_SETTINGS,
  addUserSearchHistory,
  clearUserSearchHistory,
  getSearchHistoryKey,
  getStorageKey,
  getUserSearchHistory,
  loadUserSettings,
  normalizeUserSettings,
  resetUserSettings,
  saveUserSettings,
} from "../src/settings/userSettings.js";

function setupMockBrowser() {
  const store = new Map();
  const dispatchedEvents = [];

  globalThis.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, val) => store.set(key, String(val)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
    },
    dispatchEvent: (event) => {
      dispatchedEvents.push(event);
      return true;
    },
  };

  globalThis.CustomEvent = class CustomEvent {
    constructor(type, eventInitDict) {
      this.type = type;
      this.detail = eventInitDict?.detail;
    }
  };

  return { store, dispatchedEvents };
}

test("DEFAULT_USER_SETTINGS chứa đầy đủ các phân hệ và giá trị chuẩn", () => {
  assert.equal(DEFAULT_USER_SETTINGS.notifications.dueReminder, true);
  assert.equal(DEFAULT_USER_SETTINGS.notifications.reminderDaysBefore, 2);
  assert.equal(DEFAULT_USER_SETTINGS.notifications.reservationAlert, true);
  assert.equal(DEFAULT_USER_SETTINGS.notifications.overdueAlert, true);
  assert.equal(DEFAULT_USER_SETTINGS.notifications.newsletter, false);

  assert.equal(DEFAULT_USER_SETTINGS.appearance.theme, "light");
  assert.equal(DEFAULT_USER_SETTINGS.appearance.defaultBookView, "grid");
  assert.equal(DEFAULT_USER_SETTINGS.appearance.booksPerPage, 12);

  assert.equal(DEFAULT_USER_SETTINGS.privacy.anonymousReview, false);
  assert.equal(DEFAULT_USER_SETTINGS.privacy.saveSearchHistory, true);

  assert.equal(DEFAULT_USER_SETTINGS.localization.language, "vi");
  assert.equal(DEFAULT_USER_SETTINGS.localization.dateFormat, "DD/MM/YYYY");
});

test("normalizeUserSettings gộp an toàn khi dữ liệu rỗng hoặc thiếu trường", () => {
  const fromNull = normalizeUserSettings(null);
  assert.deepEqual(fromNull, DEFAULT_USER_SETTINGS);

  const partial = normalizeUserSettings({
    appearance: { defaultBookView: "list" },
    notifications: { reminderDaysBefore: 1 },
  });

  assert.equal(partial.appearance.defaultBookView, "list");
  assert.equal(partial.appearance.booksPerPage, 12); // fallback
  assert.equal(partial.notifications.reminderDaysBefore, 1);
  assert.equal(partial.notifications.dueReminder, true); // fallback
  assert.equal(partial.privacy.saveSearchHistory, true);
});

test("loadUserSettings trả về mặc định khi localStorage trống hoặc lỗi cú pháp", () => {
  const { store } = setupMockBrowser();

  const fresh = loadUserSettings(101);
  assert.deepEqual(fresh, DEFAULT_USER_SETTINGS);

  // Thử trường hợp dữ liệu JSON bị hỏng
  store.set(getStorageKey(101), "{corrupted-json...");
  const recovered = loadUserSettings(101);
  assert.deepEqual(recovered, DEFAULT_USER_SETTINGS);
});

test("saveUserSettings lưu vào localStorage và phát event library:settings-changed", () => {
  const { store, dispatchedEvents } = setupMockBrowser();

  const custom = {
    notifications: {
      dueReminder: false,
      reminderDaysBefore: 3,
      reservationAlert: false,
      overdueAlert: true,
      newsletter: true,
    },
    appearance: {
      theme: "dark",
      defaultBookView: "list",
      booksPerPage: 24,
    },
    privacy: {
      anonymousReview: true,
      saveSearchHistory: false,
    },
    localization: {
      language: "en",
      dateFormat: "YYYY-MM-DD",
    },
  };

  const saved = saveUserSettings(101, custom);
  assert.deepEqual(saved, custom);

  // Kiểm tra lưu trong storage
  const stored = JSON.parse(store.get(getStorageKey(101)));
  assert.deepEqual(stored, custom);

  // Kiểm tra phát CustomEvent
  assert.equal(dispatchedEvents.length, 1);
  assert.equal(dispatchedEvents[0].type, "library:settings-changed");
  assert.equal(dispatchedEvents[0].detail.userId, 101);
  assert.deepEqual(dispatchedEvents[0].detail.settings, custom);
});

test("resetUserSettings khôi phục cấu hình về mặc định", () => {
  const { store } = setupMockBrowser();

  // Đổi cài đặt
  saveUserSettings(101, {
    appearance: { theme: "dark", defaultBookView: "list" },
  });
  assert.equal(loadUserSettings(101).appearance.theme, "dark");

  // Reset
  resetUserSettings(101);
  const reloaded = loadUserSettings(101);
  assert.equal(reloaded.appearance.theme, "light");
  assert.equal(reloaded.appearance.defaultBookView, "grid");
});

test("clearUserSearchHistory xóa key lịch sử và phát event thông báo", () => {
  const { store, dispatchedEvents } = setupMockBrowser();

  store.set(getSearchHistoryKey(101), JSON.stringify(["React", "Java"]));
  assert.equal(store.has(getSearchHistoryKey(101)), true);

  clearUserSearchHistory(101);
  assert.equal(store.has(getSearchHistoryKey(101)), false);

  const clearEvent = dispatchedEvents.find(
    (e) => e.type === "library:search-history-cleared"
  );
  assert.ok(clearEvent);
  assert.equal(clearEvent.detail.userId, 101);
});

test("cài đặt phân lập riêng biệt giữa các tài khoản khác nhau", () => {
  setupMockBrowser();

  saveUserSettings(101, { appearance: { theme: "dark" } });
  saveUserSettings(202, { appearance: { theme: "light" } });

  assert.equal(loadUserSettings(101).appearance.theme, "dark");
  assert.equal(loadUserSettings(202).appearance.theme, "light");
});

test("addUserSearchHistory lưu tối đa 5 từ khóa và loại bỏ trùng lặp", () => {
  setupMockBrowser();

  addUserSearchHistory(101, "Java");
  addUserSearchHistory(101, "React");
  addUserSearchHistory(101, "Python");
  addUserSearchHistory(101, "Java"); // Đưa Java lên đầu
  addUserSearchHistory(101, "Spring");
  addUserSearchHistory(101, "Vite");
  addUserSearchHistory(101, "Docker");

  const history = getUserSearchHistory(101);
  assert.equal(history.length, 5);
  assert.equal(history[0], "Docker");
  assert.equal(history[1], "Vite");
  assert.equal(history[2], "Spring");
  assert.equal(history[3], "Java");
  assert.equal(history[4], "Python");
});

