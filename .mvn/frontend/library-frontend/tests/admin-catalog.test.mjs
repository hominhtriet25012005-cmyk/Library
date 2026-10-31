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

test("hard delete uses the guarded permanent-delete endpoint", async () => {
  const calls = [];
  const client = {
    delete: async (path) => { calls.push(path); return { success: true }; },
  };

  await createAdminCatalogApi(client).hardDeleteBook(12);

  assert.deepEqual(calls, ["/api/books/12/permanent"]);
});

test("genre hide and restore use existing backend routes", async () => {
  const calls = [];
  const client = {
    get: async (path) => { calls.push({ method: "GET", path }); return { id: 7, code: "NOVEL", name: "Tiểu thuyết", active: false }; },
    put: async (path, body) => { calls.push({ method: "PUT", path, body }); return body; },
    delete: async (path) => { calls.push({ method: "DELETE", path }); return { success: true }; },
  };
  const catalog = createAdminCatalogApi(client);
  await catalog.hideGenre(7);
  const current = await catalog.getGenre(7);
  await catalog.updateGenre(7, { ...current, active: true });
  assert.deepEqual(calls, [
    { method: "DELETE", path: "/api/genres/7" },
    { method: "GET", path: "/api/genres/7" },
    { method: "PUT", path: "/api/genres/7", body: { id: 7, code: "NOVEL", name: "Tiểu thuyết", active: true } },
  ]);
});

test("uploadBookCover posts to /api/admin/books/covers with FormData field file", async () => {
  let captured;
  const client = {
    post: async (path, body) => {
      captured = { path, body };
      return { imageUrl: "http://localhost:8000/api/book-covers/uuid.png", filename: "uuid.png" };
    },
  };
  const catalog = createAdminCatalogApi(client);
  const mockFile = new Blob(["fake-img"], { type: "image/png" });
  const response = await catalog.uploadBookCover(mockFile);

  assert.equal(captured.path, "/api/admin/books/covers");
  assert.ok(captured.body instanceof FormData);
  assert.equal(response.imageUrl, "http://localhost:8000/api/book-covers/uuid.png");
});

test("hardDeleteGenre calls /api/genres/:id/hard and getBookCountByGenre calls /api/genres/:id/book-count", async () => {
  const calls = [];
  const client = {
    delete: async (path) => { calls.push({ method: "DELETE", path }); return { success: true }; },
    get: async (path) => { calls.push({ method: "GET", path }); return 5; },
  };
  const catalog = createAdminCatalogApi(client);
  await catalog.hardDeleteGenre(15);
  const count = await catalog.getBookCountByGenre(15);
  assert.equal(count, 5);
  assert.deepEqual(calls, [
    { method: "DELETE", path: "/api/genres/15/hard" },
    { method: "GET", path: "/api/genres/15/book-count" },
  ]);
});
