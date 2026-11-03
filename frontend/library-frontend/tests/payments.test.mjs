import assert from "node:assert/strict";
import test from "node:test";
import { createPaymentsApi } from "../src/api/payments.js";
import { checkoutUrl, readReturnOrderCode, paymentView, validateInitiation, validateSnapshot } from "../src/pages/Payments/paymentRules.js";
import { createPaymentSession } from "../src/pages/Payments/paymentSession.js";

test("API tạo đơn và xác nhận dùng endpoint backend hiện có, không tin redirect", async () => {
  const calls = [];
  const client = {
    get: async (path, options) => { calls.push(["GET", path, options]); return {}; },
    post: async (path, body) => { calls.push(["POST", path, body]); return {}; },
  };
  const api = createPaymentsApi(client);
  await api.subscribe(9);
  await api.payFine(17);
  await api.status(31, { signal: "signal" });
  await api.reconcile(31);
  assert.deepEqual(calls, [
    ["POST", "/api/subscriptions/subscribe", { planId: 9 }],
    ["POST", "/api/fines/17/pay", undefined],
    ["GET", "/api/payments/31/status", { signal: "signal" }],
    ["POST", "/api/payments/31/reconcile", undefined],
  ]);
});

test("chỉ nhận payment response VND/payOS có mã đơn trùng payment ID", () => {
  const valid = { paymentId: 31, orderCode: 31, amount: 50000, currency: "VND", gateway: "PAYOS", status: "PROCESSING", qrCode: "payload", checkoutUrl: "https://pay.payos.vn/web/abc" };
  assert.equal(validateInitiation(valid).paymentId, 31);
  assert.throws(() => validateInitiation({ ...valid, orderCode: 32 }));
  assert.throws(() => validateInitiation({ ...valid, currency: "INR" }));
  assert.throws(() => validateInitiation({ ...valid, amount: 0 }));
  assert.equal(checkoutUrl(valid.checkoutUrl), valid.checkoutUrl);
  assert.equal(checkoutUrl("http://pay.payos.vn/web/abc"), null);
  assert.equal(checkoutUrl("https://payos.vn.evil.test/web/abc"), null);
});

test("redirect chỉ chọn mã để tra backend, không xác nhận thành công hoặc hủy", () => {
  assert.equal(readReturnOrderCode("?orderCode=31&status=PAID&code=00"), 31);
  const pendingFromServer = validateSnapshot({ paymentId: 31, amount: 50000, currency: "VND", status: "PENDING" }, 31);
  assert.equal(paymentView(pendingFromServer.status).success, false);
  assert.equal(paymentView(pendingFromServer.status).terminal, false);
  assert.equal(readReturnOrderCode("?orderCode=abc&status=PAID"), null);
  assert.equal(readReturnOrderCode("?orderCode=0"), null);
  assert.equal(paymentView("PROCESSING").terminal, false);
  assert.equal(paymentView("SUCCESS").terminal, true);
  assert.equal(paymentView("CANCELLED").terminal, true);
  assert.equal(paymentView("REFUNDED").success, false);
});

test("snapshot phải thuộc mã đơn đang xem, trạng thái từ backend", () => {
  const snapshot = { paymentId: 31, amount: 50000, currency: "VND", status: "SUCCESS", subscriptionId: 6, fineId: null };
  assert.equal(validateSnapshot(snapshot, 31).status, "SUCCESS");
  assert.throws(() => validateSnapshot({ ...snapshot, paymentId: 32 }, 31));
  assert.throws(() => validateSnapshot({ ...snapshot, status: "PAID" }, 31));
});

test("thông tin QR chỉ lưu trong phiên và không lẫn sang mã đơn khác", () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const session = createPaymentSession(storage);
  session.save({ paymentId: 31, orderCode: 31, amount: 50000, currency: "VND", gateway: "PAYOS", status: "PROCESSING", qrCode: "vietqr payload", checkoutUrl: "https://pay.payos.vn/web/abc" }, { kind: "fine" });
  assert.equal(session.get(31).qrCode, "vietqr payload");
  assert.equal(session.get(32), null);
  session.save({ paymentId: 31, orderCode: 31, amount: 50000, currency: "VND", gateway: "PAYOS", status: "PROCESSING" }, { kind: "fine" });
  assert.equal(session.get(31).qrCode, "vietqr payload");
  session.save({ paymentId: 31, orderCode: 31, amount: 60000, currency: "VND", gateway: "PAYOS", status: "PROCESSING" }, { kind: "fine" });
  assert.equal(session.get(31).qrCode, null);
});
