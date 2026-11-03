import assert from "node:assert/strict";
import test from "node:test";
import { createSubscriptionsApi } from "../src/api/subscriptions.js";
import { availablePlans, canCancelSubscription } from "../src/pages/Subscriptions/subscriptionRules.js";

test("API gói thành viên dùng đúng endpoint hiện có", async () => {
  const calls = [];
  const api = createSubscriptionsApi({
    get: async (path) => { calls.push(["GET", path]); return []; },
    post: async (path) => { calls.push(["POST", path]); return {}; },
  });
  await api.plans();
  await api.active();
  await api.cancel(12, "Đổi nhu cầu sử dụng");
  assert.deepEqual(calls, [
    ["GET", "/api/subscription-plans"],
    ["GET", "/api/subscriptions/user/active"],
    ["POST", "/api/subscriptions/cancel/12?reason=%C4%90%E1%BB%95i%20nhu%20c%E1%BA%A7u%20s%E1%BB%AD%20d%E1%BB%A5ng"],
  ]);
});

test("USER chỉ thấy gói active giá VND hợp lệ, theo thứ tự hiển thị", () => {
  const plans = [
    { id: 1, name: "B", isActive: true, currency: "VND", price: 100000, displayOrder: 2 },
    { id: 2, name: "A", isActive: true, currency: "VND", price: 50000, displayOrder: 1 },
    { id: 3, isActive: false, currency: "VND", price: 90000 },
    { id: 4, isActive: true, currency: "USD", price: 10 },
  ];
  assert.deepEqual(availablePlans(plans).map((plan) => plan.id), [2, 1]);
  assert.deepEqual(plans.map((plan) => plan.id), [1, 2, 3, 4]);
  assert.equal(canCancelSubscription({ id: 3, isActive: true, isValid: true }), true);
  assert.equal(canCancelSubscription({ id: 3, isActive: false, isValid: false }), false);
});
