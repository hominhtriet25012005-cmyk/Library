import assert from "node:assert/strict";
import test from "node:test";
import { createAdminUsersApi, filterAdminUsers, paginateAdminUsers } from "../src/api/adminUsers.js";

const users = [
  { id: 2, fullName: "Nguyễn An", email: "an@example.test", phone: "0901000001", role: "ROLE_USER", lastLogin: null },
  { id: 1, fullName: "Quản trị", email: "admin@example.test", phone: null, role: "ROLE_ADMIN", lastLogin: "2026-10-08T10:00:00" },
];

test("AD3 chỉ đọc API ADMIN và loại bỏ trường mật khẩu khỏi dữ liệu UI", async () => {
  const calls = [];
  const options = { signal: new AbortController().signal };
  const client = { get: async (path, receivedOptions) => {
    calls.push({ path, options: receivedOptions });
    return [{ ...users[0], password: "hash-secret", googleId: "private" }, users[1]];
  } };

  const result = await createAdminUsersApi(client).list(options);
  assert.deepEqual(calls, [{ path: "/api/users/list", options }]);
  assert.deepEqual(result, users);
  assert.equal("password" in result[0], false);
  assert.equal("googleId" in result[0], false);
});

test("AD3 từ chối danh sách sai định dạng thay vì hiển thị dữ liệu giả", async () => {
  for (const response of [null, {}, [{ id: 1, email: "x", fullName: "X", role: "ROLE_ROOT" }]]) {
    await assert.rejects(createAdminUsersApi({ get: async () => response }).list(),
      /Dữ liệu người dùng không hợp lệ/);
  }
});

test("tìm theo tên/email/điện thoại và lọc vai trò không đổi dữ liệu gốc", () => {
  assert.deepEqual(filterAdminUsers(users, { searchTerm: "nguyễn", role: "ALL" }), [users[0]]);
  assert.deepEqual(filterAdminUsers(users, { searchTerm: "ADMIN@", role: "ROLE_ADMIN" }), [users[1]]);
  assert.deepEqual(filterAdminUsers(users, { searchTerm: "0901", role: "ROLE_ADMIN" }), []);
  assert.deepEqual(users.map((user) => user.id), [2, 1]);
});

test("phân trang cục bộ và giới hạn trang vượt quá kết quả", () => {
  const first = paginateAdminUsers(users, 0, 1);
  assert.deepEqual(first.items, [users[0]]);
  assert.equal(first.totalPages, 2);
  assert.equal(first.totalElements, 2);
  assert.deepEqual(paginateAdminUsers(users, 99, 1).items, [users[1]]);
  assert.equal(paginateAdminUsers([], 0, 10).totalPages, 0);
});
