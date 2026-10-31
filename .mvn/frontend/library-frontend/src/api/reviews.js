import { api } from "./client.js";

export const createReviewsApi = (client) => ({
  list: (bookId, page = 0, size = 100, options) =>
    client.get(
      `/api/reviews/book/${encodeURIComponent(bookId)}?page=${page}&size=${size}`,
      options,
    ),
  create: (bookId, values) =>
    client.post("/api/reviews", { bookId, ...values }),
  update: (reviewId, values) =>
    client.put(`/api/reviews/${encodeURIComponent(reviewId)}`, values),
  remove: (reviewId) =>
    client.delete(`/api/reviews/${encodeURIComponent(reviewId)}`),
});

export const reviewsApi = createReviewsApi(api);

export const loadReviewPages = async (listPage, options = {}) => {
  const entries = [];
  for (let page = 0; ; page += 1) {
    const result = await listPage(page, 100, options);
    if (!Array.isArray(result?.content))
      throw new Error("Dữ liệu đánh giá không hợp lệ.");
    entries.push(...result.content);
    if (page + 1 >= (result.totalPages || 1)) return entries;
  }
};
