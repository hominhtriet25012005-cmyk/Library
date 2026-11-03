import assert from "node:assert/strict";
import test from "node:test";
import { createReservationsApi, loadReservationPages } from "../src/api/reservations.js";
import { canCancelReservation, canCreateReservation, filterReservations, reservationCounts } from "../src/pages/My Reservation/reservationRules.js";

test("API đặt giữ dùng đúng đường dẫn và không gọi API admin", async () => {
  const calls = [];
  const api = createReservationsApi({
    get: async (path) => { calls.push(["GET", path]); return { content: [], totalPages: 1 }; },
    post: async (path, body) => { calls.push(["POST", path, body]); return { id: 3 }; },
    delete: async (path) => { calls.push(["DELETE", path]); return { id: 3 }; },
  });
  await api.list(1, 20);
  await api.create(8, "Đọc sau");
  await api.cancel(3);
  assert.equal(api.fulfill, undefined);
  assert.deepEqual(calls, [
    ["GET", "/api/reservations/my?page=1&size=20&sortBy=reservedAt&sortDirection=DESC"],
    ["POST", "/api/reservations", { bookId: 8, notes: "Đọc sau" }],
    ["DELETE", "/api/reservations/3"],
  ]);
});

test("lấy đủ trang lịch sử và từ chối phản hồi không hợp lệ", async () => {
  const pages = [];
  const entries = await loadReservationPages(async (page) => {
    pages.push(page);
    return { content: [{ id: page }], totalPages: 2 };
  });
  assert.deepEqual(pages, [0, 1]);
  assert.deepEqual(entries.map((entry) => entry.id), [0, 1]);
  await assert.rejects(loadReservationPages(async () => ({ content: null, totalPages: 1 })));
});

test("tạo chỉ khi sách hoạt động và đã hết bản; backend vẫn kiểm tra giới hạn/trùng", () => {
  assert.equal(canCreateReservation({ active: true, availableCopies: 0 }), true);
  assert.equal(canCreateReservation({ active: true, availableCopies: 2 }), false);
  assert.equal(canCreateReservation({ active: false, availableCopies: 0 }), false);
});

test("USER chỉ được hủy đặt giữ khi DTO cho phép", () => {
  const pending = { status: "PENDING", canBeCancelled: true, isBookAvailable: false };
  const ready = { status: "AVAILABLE", canBeCancelled: true, isBookAvailable: true, expired: false };
  assert.equal(canCancelReservation(pending), true);
  assert.equal(canCancelReservation({ ...ready, canBeCancelled: false }), false);
});

test("lọc tab và đếm theo trạng thái từ DTO", () => {
  const entries = [{ status: "PENDING" }, { status: "AVAILABLE" }, { status: "CANCELLED" }];
  assert.deepEqual(reservationCounts(entries), { total: 3, active: 2, available: 1 });
  assert.equal(filterReservations(entries, "active").length, 2);
  assert.equal(filterReservations(entries, "past").length, 1);
});
