import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFineQuery, buildPaymentQuery, canReconcilePayment, canWaiveFine,
  createAdminFinanceApi,
} from "../src/api/adminFinance.js";

test("AD7 tiền phạt lọc/phân trang server và tạo/miễn đúng payload", async () => {
  const calls = [];
  const finance = createAdminFinanceApi({
    get: async (path) => { calls.push(["GET", path]); return {
      content: [{ id: 5, status: "PENDING", type: "OVERDUE", amount: 10000 }],
      pageNumber: 0, pageSize: 20, totalElements: 1, totalPages: 1,
    }; },
    post: async (path, body) => { calls.push(["POST", path, body]); return { id: 5, status: "PENDING" }; },
  });
  await finance.fines({ userId: "7", status: "PENDING", type: "OVERDUE" });
  await finance.createFine({ bookLoanId: "3", type: "OVERDUE", amount: "10000", reason: "Quá hạn" });
  await finance.waiveFine(5, "Miễn phần còn lại");
  assert.deepEqual(calls, [
    ["GET", "/api/fines?page=0&size=20&userId=7&status=PENDING&type=OVERDUE"],
    ["POST", "/api/fines", { bookLoanId: 3, type: "OVERDUE", amount: 10000, reason: "Quá hạn", notes: "" }],
    ["POST", "/api/fines/waive", { fineId: 5, reason: "Miễn phần còn lại" }],
  ]);
  assert.equal(canWaiveFine({ status: "PARTIALLY_PAID", amountOutstanding: 5000 }), true);
  assert.equal(canWaiveFine({ status: "PAID", amountOutstanding: 0 }), false);
  assert.throws(() => buildFineQuery({ status: "SUCCESS" }), /Trạng thái/);
  assert.throws(() => finance.createFine({ bookLoanId: 3, type: "OVERDUE", amount: 0 }), /Số tiền/);
});

test("AD7 thanh toán chỉ đọc trạng thái từ backend và đối soát đơn payOS đang chờ", async () => {
  const calls = [];
  const finance = createAdminFinanceApi({
    get: async (path) => { calls.push(["GET", path]); return path.includes("/status")
      ? { paymentId: 9, amount: 10000, currency: "VND", status: "PENDING" }
      : { content: [{ id: 9, status: "PENDING", paymentType: "FINE", gateway: "PAYOS", amount: 10000, currency: "VND" }],
        number: 0, size: 10, totalElements: 1, totalPages: 1 }; },
    post: async (path) => { calls.push(["POST", path]); return {
      paymentId: 9, amount: 10000, currency: "VND", status: "PROCESSING",
    }; },
  });
  await finance.payments({ page: 0, size: 10 });
  assert.equal((await finance.status(9)).status, "PENDING");
  assert.equal((await finance.reconcile(9)).status, "PROCESSING");
  assert.deepEqual(calls, [
    ["GET", "/api/payments?page=0&size=10&sortBy=createdAt&sortDir=DESC"],
    ["GET", "/api/payments/9/status"],
    ["POST", "/api/payments/9/reconcile"],
  ]);
  assert.equal(canReconcilePayment({ status: "PENDING", gateway: "PAYOS", currency: "VND", paymentType: "FINE" }), true);
  assert.equal(canReconcilePayment({ status: "SUCCESS", gateway: "PAYOS", currency: "VND", paymentType: "FINE" }), false);
  assert.equal(canReconcilePayment({ status: "PENDING", gateway: "PAYOS", currency: "VND", paymentType: "LOST_BOOK_PENALTY" }), false);
  assert.throws(() => buildPaymentQuery({ sortBy: "gatewaySignature" }), /Sắp xếp/);
});

test("AD7 từ chối phản hồi danh sách và snapshot không hợp lệ", async () => {
  const finance = createAdminFinanceApi({
    get: async (path) => path.startsWith("/api/fines") ? { content: null }
      : path.endsWith("/status") ? { paymentId: 99, status: "SUCCESS", amount: 1, currency: "VND" }
        : { content: [], totalElements: -1 },
  });
  await assert.rejects(finance.fines(), /Dữ liệu tiền phạt/);
  await assert.rejects(finance.payments(), /Dữ liệu thanh toán/);
  await assert.rejects(finance.status(9), /Trạng thái thanh toán/);
});
