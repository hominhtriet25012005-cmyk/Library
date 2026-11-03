import test from "node:test";
import assert from "node:assert/strict";
import { isActive, navigationPath } from "../src/pages/UserLayout/util.js";

test("bản xem thử dùng đường dẫn riêng mà không thay đổi đường dẫn USER thật", () => {
  assert.equal(navigationPath("/user", true), "/demo");
  assert.equal(navigationPath("/user/books", true), "/demo/books");
  assert.equal(navigationPath("/user/books", false), "/user/books");
  assert.equal(navigationPath("/login", true), "/login");
});

test("mục Tổng quan chỉ sáng tại trang gốc của từng chế độ", () => {
  assert.equal(isActive("/demo", { pathname: "/demo" }), true);
  assert.equal(isActive("/demo", { pathname: "/demo/books" }), false);
  assert.equal(isActive("/demo/books", { pathname: "/demo/books" }), true);
  assert.equal(isActive("/user", { pathname: "/user/books" }), false);
});
