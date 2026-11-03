import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMembershipSearch, buildPlanPayload, createAdminMembershipApi, membershipStatus,
} from "../src/api/adminMembership.js";

test("ADMIN đọc mọi gói, còn USER chỉ dùng endpoint công khai", async () => {
  const calls = [];
  const admin = createAdminMembershipApi({ get: async (path) => { calls.push(path); return []; } });
  await admin.plans();
  assert.deepEqual(calls, ["/api/subscription-plans/admin"]);
});

test("tạo gói chỉ nhận giá nguyên VND và quyền lợi hợp lệ", async () => {
  const payload = buildPlanPayload({ planCode: "BASIC", name: "Cơ bản", durationDays: "30",
    price: "100000", maxBooksAllowed: "3", maxDaysPerBook: "14", displayOrder: "0" });
  assert.deepEqual(payload, { planCode: "BASIC", name: "Cơ bản", description: "",
    durationDays: 30, price: 100000, currency: "VND", maxBooksAllowed: 3,
    maxDaysPerBook: 14, displayOrder: 0, isActive: true, isFeatured: false,
    badgeText: "", adminNotes: "" });
  assert.throws(() => buildPlanPayload({ ...payload, price: "1000.5" }), /VND/);
  assert.throws(() => buildPlanPayload({ ...payload, maxBooksAllowed: 0 }), /Số sách/);
  const calls = [];
  const admin = createAdminMembershipApi({ post: async (path, body) => { calls.push([path, body]); return { id: 1 }; } });
  await admin.createPlan(payload);
  assert.deepEqual(calls, [["/api/subscription-plans/admin/create", payload]]);
});

test("danh sách thành viên đăng ký phân trang thật và không tự suy ra đã thanh toán", async () => {
  const calls = [];
  const admin = createAdminMembershipApi({ get: async (path) => { calls.push(path); return {
    content: [{ id: 1, userId: 2, planId: 3, isActive: false }], pageNumber: 1,
    pageSize: 10, totalElements: 11, totalPages: 2,
  }; } });
  const result = await admin.members({ page: 1, userId: "2", active: "false" });
  assert.equal(result.totalElements, 11);
  assert.deepEqual(calls, ["/api/subscriptions/admin/search?page=1&size=10&userId=2&active=false"]);
  assert.equal(membershipStatus({ isActive: false, cancelledAt: null, isExpired: false }), "Chưa có hiệu lực");
  assert.equal(membershipStatus({ isActive: false, cancelledAt: "2026-10-01" }), "Đã hủy");
  assert.equal(membershipStatus({ isActive: true, isExpired: true }), "Hết hạn");
  assert.throws(() => buildMembershipSearch({ page: -1 }), /Trang/);
});
