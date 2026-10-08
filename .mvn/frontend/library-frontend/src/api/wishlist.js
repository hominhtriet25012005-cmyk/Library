import { api } from "./client.js";

export const wishlistApi = {
  list: (page = 0, size = 100, options) =>
    api.get(`/api/wishlist/my-wishlist?page=${page}&size=${size}`, options),
  add: (bookId, notes = "") =>
    api.post(
      `/api/wishlist/add/${encodeURIComponent(bookId)}${notes.trim() ? `?notes=${encodeURIComponent(notes.trim())}` : ""}`,
    ),
  remove: (bookId) =>
    api.delete(`/api/wishlist/remove/${encodeURIComponent(bookId)}`),
};

export const loadWishlistPages = async (listPage, options = {}) => {
  const entries = [];
  for (let page = 0; ; page += 1) {
    const result = await listPage(page, 100, options);
    if (!Array.isArray(result?.content))
      throw new Error("Dữ liệu danh sách yêu thích không hợp lệ.");
    entries.push(...result.content);
    if (page + 1 >= (result.totalPages || 1)) return entries;
  }
};
