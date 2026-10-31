import { api } from "./client.js";

export const createLoansApi = (client) => ({
  list: (page = 0, size = 20, options) =>
    client.get(`/api/book-loans/my?page=${page}&size=${size}`, options),
  checkout: (bookId, checkoutDays, notes = "") =>
    client.post("/api/book-loans/checkout", { bookId, checkoutDays, notes }),
  checkin: (bookLoanId) =>
    client.post("/api/book-loans/checkin", {
      bookLoanId,
      condition: "RETURNED",
    }),
  renew: (bookLoanId, extensionDays) =>
    client.post("/api/book-loans/renew", { bookLoanId, extensionDays }),
  activeSubscription: (options) =>
    client.get("/api/subscriptions/user/active", options),
});

export const loansApi = createLoansApi(api);

export const loadLoanPages = async (listPage, options = {}) => {
  const entries = [];
  for (let page = 0; ; page += 1) {
    const result = await listPage(page, 20, options);
    if (!Array.isArray(result?.content))
      throw new Error("Dữ liệu lượt mượn không hợp lệ.");
    entries.push(...result.content);
    if (page + 1 >= (result.totalPages || 1)) return entries;
  }
};
