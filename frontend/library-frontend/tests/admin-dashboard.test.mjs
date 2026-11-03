import assert from "node:assert/strict";
import test from "node:test";
import { createAdminDashboardApi } from "../src/api/adminDashboard.js";

test("Dashboard chỉ đọc hai tổng chính xác từ API thống kê sách", async () => {
  const calls = [];
  const options = { signal: new AbortController().signal };
  const dashboardApi = createAdminDashboardApi({
    get: async (path, passedOptions) => {
      calls.push({ path, options: passedOptions });
      return { totalActiveBooks: 42, totalAvailableBooks: 31 };
    },
  });

  assert.deepEqual(await dashboardApi.bookStats(options), {
    totalActiveBooks: 42,
    totalAvailableBooks: 31,
  });
  assert.deepEqual(calls, [{ path: "/api/books/stats", options }]);
});

test("không biến dữ liệu trống hoặc phản hồi lỗi thành số liệu giả", async () => {
  const empty = createAdminDashboardApi({ get: async () => ({ totalActiveBooks: 0, totalAvailableBooks: 0 }) });
  assert.deepEqual(await empty.bookStats(), { totalActiveBooks: 0, totalAvailableBooks: 0 });

  for (const response of [
    null,
    {},
    { totalActiveBooks: "42", totalAvailableBooks: 31 },
    { totalActiveBooks: -1, totalAvailableBooks: 0 },
    { totalActiveBooks: 3, totalAvailableBooks: 4 },
  ]) {
    const invalid = createAdminDashboardApi({ get: async () => response });
    await assert.rejects(invalid.bookStats(), /Dữ liệu thống kê sách không hợp lệ/);
  }
});

test("Dashboard lấy tổng lượt mượn và quá hạn từ totalElements, không đếm một trang", async () => {
  const calls = [];
  const options = { signal: new AbortController().signal };
  const dashboardApi = createAdminDashboardApi({
    post: async (path, body, passedOptions) => {
      calls.push({ path, body, options: passedOptions });
      return { content: [{ id: 1 }], totalElements: body.overdueOnly ? 7 : 128 };
    },
  });

  assert.deepEqual(await dashboardApi.loanSummary(options), { totalLoans: 128, overdueLoans: 7 });
  assert.deepEqual(calls, [
    { path: "/api/book-loans/search", body: { page: 0, size: 1, sortBy: "createdAt", sortDirection: "DESC" }, options },
    { path: "/api/book-loans/search", body: { page: 0, size: 1, sortBy: "createdAt", sortDirection: "DESC", overdueOnly: true }, options },
  ]);
});

test("Dashboard từ chối totalElements thiếu hoặc không nhất quán", async () => {
  for (const result of [
    [{ totalElements: "128" }, { totalElements: 7 }],
    [{ totalElements: 2 }, { totalElements: 3 }],
    [{ totalElements: -1 }, { totalElements: 0 }],
  ]) {
    let index = 0;
    const dashboardApi = createAdminDashboardApi({ post: async () => result[index++] });
    await assert.rejects(dashboardApi.loanSummary(), /Dữ liệu thống kê mượn sách không hợp lệ/);
  }
});
