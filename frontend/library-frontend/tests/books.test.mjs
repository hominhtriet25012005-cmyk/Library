import test from "node:test";
import assert from "node:assert/strict";
import { bookSearchPayload } from "../src/api/books.js";

test("tìm sách gửi đủ bộ lọc và phân trang cho backend", () => {
  assert.deepEqual(bookSearchPayload({
    searchTerm: "  Java  ", genreId: 10, availability: "CHECKED_OUT",
    page: 2, sortBy: "title", sortDirection: "ASC",
  }), {
    searchTerm: "Java", genreId: 10, availableOnly: false, unavailableOnly: true,
    page: 2, size: 9, sortBy: "title", sortDirection: "ASC",
  });
});
