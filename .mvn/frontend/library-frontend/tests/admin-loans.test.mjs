import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLoanSearch, canCheckinLoan, canRenewLoan, createAdminLoansApi,
} from "../src/api/adminLoans.js";

test("tra cứu mượn trả chỉ gửi một bộ lọc có hiệu lực cùng phân trang server", async () => {
  const calls = [];
  const admin = createAdminLoansApi({
    post: async (path, body, options) => {
      calls.push({ path, body, options });
      return { content: [{ id: 8, status: "CHECKED_OUT" }], pageNumber: 1,
        pageSize: 10, totalElements: 12, totalPages: 2 };
    },
  });
  const options = { signal: new AbortController().signal };
  const result = await admin.search({ page: 1, mode: "user", value: "42" }, options);
  assert.equal(result.totalElements, 12);
  assert.deepEqual(calls, [{ path: "/api/book-loans/search", body: {
    page: 1, size: 10, sortBy: "createdAt", sortDirection: "DESC", userId: 42,
  }, options }]);
  assert.deepEqual(buildLoanSearch({ mode: "overdue" }), {
    page: 0, size: 10, sortBy: "createdAt", sortDirection: "DESC", overdueOnly: true,
  });
  assert.deepEqual(buildLoanSearch({ mode: "status", value: "RETURNED" }), {
    page: 0, size: 10, sortBy: "createdAt", sortDirection: "DESC", status: "RETURNED",
  });
  assert.throws(() => buildLoanSearch({ mode: "user", value: "abc" }), /ID người dùng/);
});

test("từ chối trang tra cứu lỗi thay vì hiển thị danh sách giả", async () => {
  const admin = createAdminLoansApi({ post: async () => ({ content: null, totalElements: 4 }) });
  await assert.rejects(admin.search({}), /Dữ liệu lượt mượn không hợp lệ/);
});

test("cấp/trả/gia hạn chỉ gửi payload hợp lệ đến API thật", async () => {
  const calls = [];
  const admin = createAdminLoansApi({ post: async (path, body) => {
    calls.push({ path, body });
    return path.endsWith("update-overdue") ? { status: true } : { id: 7, status: "CHECKED_OUT" };
  } });
  await admin.checkout({ userId: "3", bookId: "5", checkoutDays: "7", notes: "" });
  await admin.checkin(7, "LOST");
  await admin.renew(7, "2");
  await admin.updateOverdue();
  assert.deepEqual(calls, [
    { path: "/api/book-loans/checkout/user/3", body: { bookId: 5, checkoutDays: 7, notes: "" } },
    { path: "/api/book-loans/checkin", body: { bookLoanId: 7, condition: "LOST" } },
    { path: "/api/book-loans/renew", body: { bookLoanId: 7, extensionDays: 2 } },
    { path: "/api/book-loans/admin/update-overdue", body: {} },
  ]);
  await assert.rejects(admin.checkout({ userId: 1, bookId: 2, checkoutDays: 0 }), /Số ngày mượn/);
  await assert.rejects(admin.checkin(7, "CHECKED_OUT"), /Tình trạng trả/);
  await assert.rejects(admin.renew(7, 0), /Số ngày gia hạn/);
  assert.equal(calls.length, 4);
  const failedBatch = createAdminLoansApi({ post: async () => ({ status: false }) });
  await assert.rejects(failedBatch.updateOverdue(), /Không thể xác nhận/);
});

test("chỉ hiển thị thao tác theo trạng thái hiện tại", () => {
  const today = "2026-10-08";
  assert.equal(canCheckinLoan({ status: "CHECKED_OUT" }), true);
  assert.equal(canCheckinLoan({ status: "OVERDUE" }), true);
  assert.equal(canCheckinLoan({ status: "RETURNED" }), false);
  assert.equal(canRenewLoan({ status: "CHECKED_OUT", isOverdue: false,
    dueDate: today, renewalCount: 0, maxRenewals: 2 }, today), true);
  assert.equal(canRenewLoan({ status: "OVERDUE", dueDate: today }, today), false);
  assert.equal(canRenewLoan({ status: "CHECKED_OUT", dueDate: "2026-10-07",
    renewalCount: 0, maxRenewals: 2 }, today), false);
  assert.equal(canRenewLoan({ status: "CHECKED_OUT", dueDate: today,
    renewalCount: 2, maxRenewals: 2 }, today), false);
});
