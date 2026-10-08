import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReservationSearch, canAdminCancel, canAdminFulfill, createAdminReservationsApi,
} from "../src/api/adminReservations.js";

test("ADMIN tìm toàn hệ thống bằng phân trang server và bộ lọc hàng đợi", async () => {
  const calls = [];
  const admin = createAdminReservationsApi({ post: async (path, body, options) => {
    calls.push({ path, body, options });
    return { content: [{ id: 1, status: "PENDING" }], pageNumber: 1,
      pageSize: 10, totalElements: 13, totalPages: 2 };
  } });
  const options = { signal: new AbortController().signal };
  const result = await admin.search({ page: 1, bookId: "7", activeOnly: true,
    sortDirection: "ASC" }, options);
  assert.equal(result.totalElements, 13);
  assert.deepEqual(calls, [{ path: "/api/reservations/search", body: {
    page: 1, size: 10, sortBy: "reservedAt", sortDirection: "ASC",
    bookId: 7, activeOnly: true,
  }, options }]);
  assert.deepEqual(buildReservationSearch({ status: "AVAILABLE" }), {
    page: 0, size: 10, sortBy: "reservedAt", sortDirection: "DESC", status: "AVAILABLE",
  });
  assert.throws(() => buildReservationSearch({ userId: "x" }), /ID người dùng/);
  assert.throws(() => buildReservationSearch({ status: "WRONG" }), /Trạng thái/);
});

test("ADMIN không chấp nhận trang kết quả sai định dạng", async () => {
  const admin = createAdminReservationsApi({ post: async () => ({ content: null, totalElements: 1 }) });
  await assert.rejects(admin.search(), /Dữ liệu đặt giữ không hợp lệ/);
});

test("ADMIN tạo, hủy, xác nhận nhận sách qua đúng endpoint và payload", async () => {
  const calls = [];
  const admin = createAdminReservationsApi({
    post: async (path, body) => { calls.push(["POST", path, body]); return { id: 8, status: "PENDING" }; },
    delete: async (path) => { calls.push(["DELETE", path]); return { id: 8, status: "CANCELLED" }; },
  });
  await admin.create({ userId: "3", bookId: "5", notes: "Đặt tại quầy" });
  await admin.cancel(8);
  await admin.fulfill(8);
  assert.deepEqual(calls, [
    ["POST", "/api/reservations/user/3", { bookId: 5, notes: "Đặt tại quầy" }],
    ["DELETE", "/api/reservations/8"],
    ["POST", "/api/reservations/8/fulfill", undefined],
  ]);
  await assert.rejects(admin.create({ userId: 0, bookId: 5 }), /ID người dùng/);
  assert.equal(calls.length, 3);
});

test("chỉ xác nhận người đầu hàng, sách sẵn và đặt giữ chưa hết hạn", () => {
  const first = { status: "PENDING", queuePosition: 1, isBookAvailable: true,
    expired: false, canBeCancelled: true };
  assert.equal(canAdminFulfill(first), true);
  assert.equal(canAdminFulfill({ ...first, queuePosition: 2 }), false);
  assert.equal(canAdminFulfill({ ...first, isBookAvailable: false }), false);
  assert.equal(canAdminFulfill({ ...first, expired: true }), false);
  assert.equal(canAdminFulfill({ ...first, status: "CANCELLED" }), false);
  assert.equal(canAdminCancel(first), true);
  assert.equal(canAdminCancel({ ...first, status: "FULFILLED" }), false);
});
