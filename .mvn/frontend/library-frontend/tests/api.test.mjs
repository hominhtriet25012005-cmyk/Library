import assert from "node:assert/strict";
import test from "node:test";
import { createApiClient } from "../src/api/client.js";
import { createTokenStore } from "../src/api/tokenStore.js";

test("token chỉ được lưu trong kho phiên và có thể xóa", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const tokens = createTokenStore(storage);
  tokens.set("abc");
  assert.equal(tokens.get(), "abc");
  tokens.clear();
  assert.equal(tokens.get(), null);
});

test("API gắn Bearer token và đọc JSON", async () => {
  let captured;
  const client = createApiClient({
    getToken: () => "abc",
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(JSON.stringify({ fullName: "An" }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    },
  });
  assert.deepEqual(await client.get("/api/users/profile"), { fullName: "An" });
  assert.equal(captured.url, "/api/users/profile");
  assert.equal(captured.options.headers.Authorization, "Bearer abc");
});

test("401 có token làm hết phiên, 403 giữ phiên", async () => {
  let expired = 0;
  const client = createApiClient({
    getToken: () => "abc",
    onUnauthorized: () => { expired += 1; },
    fetchImpl: async () => new Response("{}", { status: 401 }),
  });
  await assert.rejects(client.get("/api/users/profile"), (error) => error.status === 401);
  assert.equal(expired, 1);

  const forbidden = createApiClient({
    getToken: () => "abc",
    onUnauthorized: () => { expired += 1; },
    fetchImpl: async () => new Response("{}", { status: 403 }),
  });
  await assert.rejects(forbidden.get("/api/admin/test"), (error) => error.status === 403);
  assert.equal(expired, 1);
});

test("API DELETE gửi Bearer token và không gửi body", async () => {
  let captured;
  const client = createApiClient({
    getToken: () => "abc",
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    },
  });
  assert.deepEqual(await client.delete("/api/wishlist/remove/7"), { success: true });
  assert.equal(captured.url, "/api/wishlist/remove/7");
  assert.equal(captured.options.method, "DELETE");
  assert.equal(captured.options.headers.Authorization, "Bearer abc");
  assert.equal(captured.options.body, undefined);
});

test("API PUT gửi JSON và Bearer token", async () => {
  let captured;
  const client = createApiClient({
    getToken: () => "abc",
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(JSON.stringify({ id: 9 }), { status: 200 });
    },
  });
  assert.deepEqual(await client.put("/api/reviews/9", { rating: 4 }), { id: 9 });
  assert.equal(captured.url, "/api/reviews/9");
  assert.equal(captured.options.method, "PUT");
  assert.equal(captured.options.headers.Authorization, "Bearer abc");
  assert.equal(captured.options.body, '{"rating":4}');
});
