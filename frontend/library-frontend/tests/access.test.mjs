import assert from "node:assert/strict";
import test from "node:test";
import { resolveAccess, safeReturnPath } from "../src/auth/access.js";

test("route chờ xác minh, yêu cầu đăng nhập và chặn sai vai trò", () => {
  assert.equal(resolveAccess({ checking: true, user: null, role: "ROLE_USER" }), "checking");
  assert.equal(resolveAccess({ checking: false, user: null, role: "ROLE_USER" }), "login");
  assert.equal(resolveAccess({ checking: false, user: { role: "ROLE_USER" }, role: "ROLE_ADMIN" }), "forbidden");
  assert.equal(resolveAccess({ checking: false, user: {}, role: ["ROLE_USER", "ROLE_ADMIN"] }), "forbidden");
  assert.equal(resolveAccess({ checking: false, user: { role: "ROLE_ADMIN" }, role: "ROLE_ADMIN" }), "allow");
  assert.equal(resolveAccess({ checking: false, user: { role: "ROLE_ADMIN" }, role: ["ROLE_USER", "ROLE_ADMIN"] }), "allow");
  assert.equal(resolveAccess({ checking: false, user: { role: "ROLE_USER" }, role: ["ROLE_USER", "ROLE_ADMIN"] }), "allow");
  assert.equal(resolveAccess({ checking: false, user: { role: "ROLE_USER" }, role: "ROLE_ADMIN" }), "forbidden");
});

test("đường trở lại chỉ nhận đường dẫn nội bộ", () => {
  assert.equal(safeReturnPath("/user/books"), "/user/books");
  assert.equal(safeReturnPath("/user/payments/result?orderCode=31"), "/user/payments/result?orderCode=31");
  assert.equal(safeReturnPath("//evil.example"), null);
  assert.equal(safeReturnPath("https://evil.example"), null);
});
