import assert from "node:assert/strict";
import test from "node:test";
import { createReviewsApi, loadReviewPages } from "../src/api/reviews.js";
import {
  canCreateReview,
  cleanReviewText,
  hasReturnedLoan,
  ownReview,
  validateReview,
} from "../src/pages/library/Book/reviewRules.js";

test("API đánh giá chỉ dùng endpoint thực có và payload đúng", async () => {
  const calls = [];
  const api = createReviewsApi({
    get: async (path) => {
      calls.push(["GET", path]);
      return { content: [], totalPages: 1 };
    },
    post: async (path, body) => {
      calls.push(["POST", path, body]);
      return { id: 9 };
    },
    put: async (path, body) => {
      calls.push(["PUT", path, body]);
      return { id: 9 };
    },
    delete: async (path) => {
      calls.push(["DELETE", path]);
      return { success: true };
    },
  });
  await api.list(12, 1, 100);
  await api.create(12, {
    rating: 5,
    title: "Hay",
    reviewText: "Cuốn sách rất hữu ích.",
  });
  await api.update(9, {
    rating: 4,
    title: "Hay",
    reviewText: "Đánh giá sau khi đọc.",
  });
  await api.remove(9);
  assert.deepEqual(calls, [
    ["GET", "/api/reviews/book/12?page=1&size=100"],
    [
      "POST",
      "/api/reviews",
      {
        bookId: 12,
        rating: 5,
        title: "Hay",
        reviewText: "Cuốn sách rất hữu ích.",
      },
    ],
    [
      "PUT",
      "/api/reviews/9",
      { rating: 4, title: "Hay", reviewText: "Đánh giá sau khi đọc." },
    ],
    ["DELETE", "/api/reviews/9"],
  ]);
});

test("lấy đủ trang để tìm đánh giá của mình và kiểm tra phản hồi", async () => {
  const pages = [];
  const reviews = await loadReviewPages((page) => {
    pages.push(page);
    return { content: [{ id: page }], totalPages: 2 };
  });
  assert.deepEqual(pages, [0, 1]);
  assert.deepEqual(
    reviews.map((review) => review.id),
    [0, 1],
  );
  await assert.rejects(
    loadReviewPages(async () => ({ content: null, totalPages: 1 })),
  );
});

test("chỉ người có lượt mượn RETURNED và chưa có đánh giá hoạt động mới thấy tạo", () => {
  const loans = [
    { bookId: 12, status: "CHECKED_OUT" },
    { bookId: 13, status: "RETURNED" },
  ];
  assert.equal(hasReturnedLoan(loans, 12), false);
  assert.equal(hasReturnedLoan(loans, 13), true);
  const reviews = [
    { id: 7, userId: 5 },
    { id: 8, userId: 6 },
  ];
  assert.equal(ownReview(reviews, 5)?.id, 7);
  assert.equal(canCreateReview(loans, 13, reviews, 5), false);
  assert.equal(canCreateReview(loans, 13, reviews, 9), true);
});

test("validation cho phép đánh giá chỉ có sao hoặc kèm nhận xét tùy chọn", () => {
  assert.equal(
    validateReview({ rating: 0, reviewText: "Nội dung đánh giá" }),
    "Điểm đánh giá phải từ 1 đến 5 sao.",
  );
  assert.equal(validateReview({ rating: 5, reviewText: "Ok" }), null);
  assert.equal(validateReview({ rating: 5, reviewText: "" }), null);
  assert.equal(
    validateReview({ rating: 5, reviewText: "x".repeat(2001) }),
    "Nội dung đánh giá tối đa 2000 ký tự.",
  );
  assert.equal(
    validateReview({ rating: 5, reviewText: "Nội dung đủ dài" }),
    null,
  );

  assert.equal(cleanReviewText("  \u200B  "), "");
  assert.equal(validateReview({ rating: 5, reviewText: "  \u200B  " }), null);
  assert.equal(cleanReviewText("Sách hay"), "Sách hay");
});
