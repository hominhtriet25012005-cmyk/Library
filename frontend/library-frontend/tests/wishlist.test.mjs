import assert from "node:assert/strict";
import test from "node:test";
import { loadWishlistPages } from "../src/api/wishlist.js";

test("Wishlist tải hết trang để nút lưu sách phản ánh toàn bộ danh sách", async () => {
  const pages = [];
  const entries = await loadWishlistPages(async (page, size) => {
    pages.push([page, size]);
    return {
      content: [{ id: page + 1, book: { id: page + 10 } }],
      totalPages: 2,
    };
  });
  assert.deepEqual(pages, [[0, 100], [1, 100]]);
  assert.deepEqual(entries.map((entry) => entry.book.id), [10, 11]);
});

test("Wishlist trả danh sách rỗng khi backend không có trang nào", async () => {
  const entries = await loadWishlistPages(async () => ({ content: [], totalPages: 0 }));
  assert.deepEqual(entries, []);
});
