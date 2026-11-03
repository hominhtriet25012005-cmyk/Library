import assert from "node:assert/strict";
import test from "node:test";
import {
  adminNavigationSections,
  adminPageForPath,
  isAdminNavActive,
} from "../src/pages/AdminLayout/adminNavigation.js";

test("sitemap ADMIN V1 có đúng 10 mục và không tạo vai trò thủ thư", () => {
  const items = adminNavigationSections.flatMap((section) => section.items);
  assert.equal(items.length, 10);
  assert.equal(new Set(items.map((item) => item.path)).size, 10);
  assert.deepEqual(items.map((item) => item.path), [
    "/admin/dashboard", "/admin/books", "/admin/genres", "/admin/users",
    "/admin/loans", "/admin/reservations", "/admin/reviews",
    "/admin/subscriptions", "/admin/fines", "/admin/payments",
  ]);
  assert.equal(items.some((item) => /thủ thư/i.test(item.title)), false);
});

test("menu gói active ở hai tab nhưng dashboard không active ở trang khác", () => {
  assert.equal(isAdminNavActive("/admin/subscriptions", "/admin/subscriptions/plans"), true);
  assert.equal(isAdminNavActive("/admin/subscriptions", "/admin/subscriptions/members"), true);
  assert.equal(isAdminNavActive("/admin/dashboard", "/admin/books"), false);
  assert.equal(adminPageForPath("/admin/subscriptions/plans")?.title, "Các gói");
  assert.equal(adminPageForPath("/admin/subscriptions/members")?.title, "Thành viên đăng ký");
  assert.equal(adminPageForPath("/admin/unknown"), null);
});
