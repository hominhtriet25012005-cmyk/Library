import assert from "node:assert/strict";
import test from "node:test";
import { buildAdminReviewQuery, createAdminReviewsApi } from "../src/api/adminReviews.js";

test("ADMIN reviews query validates filters and pagination", () => {
  assert.equal(buildAdminReviewQuery({ bookId: "3", active: "false", page: 1 }),
    "?bookId=3&active=false&page=1&size=10");
  assert.throws(() => buildAdminReviewQuery({ userId: "-2" }), /ID người dùng/);
  assert.throws(() => buildAdminReviewQuery({ size: 101 }), /kích thước/);
});

test("ADMIN reviews API searches and hides without editing content", async () => {
  const calls = [];
  const api = createAdminReviewsApi({
    get: async (path) => { calls.push(path); return { content: [{ id: 7, isActive: false }], pageNumber: 0, totalPages: 1, totalElements: 1 }; },
    post: async (path) => { calls.push(path); return { id: 7, isActive: false }; },
  });
  const page = await api.search({ active: "false" });
  assert.equal(page.content[0].isActive, false);
  assert.equal((await api.hide(7)).isActive, false);
  assert.deepEqual(calls, ["/api/reviews/admin?active=false&page=0&size=10", "/api/reviews/admin/7/hide"]);
});
