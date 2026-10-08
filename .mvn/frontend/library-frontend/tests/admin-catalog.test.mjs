import test from "node:test";
import assert from "node:assert/strict";
import { createAdminCatalogApi } from "../src/api/adminCatalog.js";

test("ADMIN uses a separate endpoint to search inactive books", async () => {
  const calls = [];
  const client = {
    post: async (path, body) => { calls.push({ path, body }); return { content: [] }; },
  };
  const catalog = createAdminCatalogApi(client);
  await catalog.searchBooks({ active: false, page: 0 });
  assert.deepEqual(calls, [{ path: "/api/admin/book/search", body: { active: false, page: 0 } }]);
});

test("visibility change sends only active flag, not stale stock", async () => {
  const calls = [];
  const client = {
    put: async (path, body) => { calls.push({ path, body }); return body; },
  };
  await createAdminCatalogApi(client).setBookActive(4, false);
  assert.deepEqual(calls, [{ path: "/api/admin/book/4/active", body: { active: false } }]);
});
