import assert from "node:assert/strict";
import test from "node:test";
import { createLoansApi, loadLoanPages } from "../src/api/loans.js";
import { canRenewLoan, canReturnLoan, checkoutDaysForPlan, effectiveLoanStatus, filterLoans, renewalDays } from "../src/pages/MyLoans/loanRules.js";

test("API khoản mượn dùng đúng endpoint và payload", async () => {
  const calls = [];
  const api = createLoansApi({
    get: async (path) => { calls.push(["GET", path]); return { content: [], totalPages: 1 }; },
    post: async (path, body) => { calls.push(["POST", path, body]); return { id: 7 }; },
  });
  await api.list(2, 20);
  await api.checkout(12, 10, "Ghi chú");
  await api.checkin(7);
  await api.renew(7, 5);
  assert.deepEqual(calls, [
    ["GET", "/api/book-loans/my?page=2&size=20"],
    ["POST", "/api/book-loans/checkout", { bookId: 12, checkoutDays: 10, notes: "Ghi chú" }],
    ["POST", "/api/book-loans/checkin", { bookLoanId: 7, condition: "RETURNED" }],
    ["POST", "/api/book-loans/renew", { bookLoanId: 7, extensionDays: 5 }],
  ]);
});

test("tải đủ các trang lịch sử và từ chối dữ liệu sai định dạng", async () => {
  const pages = [];
  const entries = await loadLoanPages(async (page) => {
    pages.push(page);
    return { content: [{ id: page }], totalPages: 2 };
  });
  assert.deepEqual(pages, [0, 1]);
  assert.deepEqual(entries.map((entry) => entry.id), [0, 1]);
  await assert.rejects(loadLoanPages(async () => ({ content: null, totalPages: 1 })));
});

test("quá hạn theo ngày thực tế dù job chưa đổi trạng thái", () => {
  const today = new Date(2026, 9, 6);
  const overdue = { status: "CHECKED_OUT", dueDate: "2026-10-05", returnDate: null, renewalCount: 0, maxRenewals: 2 };
  assert.equal(effectiveLoanStatus(overdue, today), "OVERDUE");
  assert.equal(canRenewLoan(overdue, today), false);
  assert.equal(canReturnLoan(overdue), true);
  assert.equal(filterLoans([overdue], "OVERDUE", today).length, 1);
});

test("chỉ lượt còn hạn và chưa hết lần mới được gia hạn", () => {
  const today = new Date(2026, 9, 6);
  const active = { status: "CHECKED_OUT", dueDate: "2026-10-06", returnDate: null, renewalCount: 1, maxRenewals: 2 };
  assert.equal(canRenewLoan(active, today), true);
  assert.equal(canRenewLoan({ ...active, renewalCount: 2 }, today), false);
  assert.equal(canReturnLoan({ ...active, status: "RETURNED" }), false);
  assert.equal(renewalDays(14), 14);
  assert.equal(renewalDays(0), null);
  assert.equal(renewalDays(1.5), null);
});

test("ngày mượn mặc định không vượt hạn mức gói", () => {
  assert.equal(checkoutDaysForPlan(7), 7);
  assert.equal(checkoutDaysForPlan(30), 14);
  assert.equal(checkoutDaysForPlan(null), null);
});
