import { api } from "./client.js";

const validCount = (value) => Number.isSafeInteger(value) && value >= 0;

export const createAdminDashboardApi = (client) => ({
  bookStats: async (options) => {
    const result = await client.get("/api/books/stats", options);
    if (!validCount(result?.totalActiveBooks)
      || !validCount(result?.totalAvailableBooks)
      || result.totalAvailableBooks > result.totalActiveBooks) {
      throw new Error("Dữ liệu thống kê sách không hợp lệ.");
    }
    return {
      totalActiveBooks: result.totalActiveBooks,
      totalAvailableBooks: result.totalAvailableBooks,
    };
  },
  loanSummary: async (options) => {
    const base = { page: 0, size: 1, sortBy: "createdAt", sortDirection: "DESC" };
    const [all, overdue] = await Promise.all([
      client.post("/api/book-loans/search", base, options),
      client.post("/api/book-loans/search", { ...base, overdueOnly: true }, options),
    ]);
    if (!validCount(all?.totalElements)
      || !validCount(overdue?.totalElements)
      || overdue.totalElements > all.totalElements) {
      throw new Error("Dữ liệu thống kê mượn sách không hợp lệ.");
    }
    return { totalLoans: all.totalElements, overdueLoans: overdue.totalElements };
  },
});

export const adminDashboardApi = createAdminDashboardApi(api);
