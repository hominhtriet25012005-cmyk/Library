import { api } from "./client.js";

const positiveId = (value, label) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1)
    throw new Error(`${label} phải là số nguyên dương.`);
  return number;
};

export const buildAdminReviewQuery = ({
  userId = "",
  bookId = "",
  active = "ALL",
  page = 0,
  size = 10,
} = {}) => {
  if (
    !Number.isSafeInteger(page) ||
    page < 0 ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 100
  )
    throw new Error("Trang hoặc kích thước trang không hợp lệ.");
  const query = new URLSearchParams();
  if (userId !== "" && userId != null)
    query.set("userId", positiveId(userId, "ID người dùng"));
  if (bookId !== "" && bookId != null)
    query.set("bookId", positiveId(bookId, "ID sách"));
  if (active !== "ALL") {
    if (active !== "true" && active !== "false")
      throw new Error("Trạng thái đánh giá không hợp lệ.");
    query.set("active", active);
  }
  query.set("page", page);
  query.set("size", size);
  return `?${query}`;
};

const checkedReview = (item) => {
  if (
    !Number.isSafeInteger(item?.id) ||
    item.id < 1 ||
    typeof item.isActive !== "boolean"
  )
    throw new Error("Dữ liệu đánh giá không hợp lệ.");
  return item;
};

const checkedPage = (page) => {
  if (
    !Array.isArray(page?.content) ||
    !Number.isSafeInteger(page.totalElements) ||
    page.totalElements < 0 ||
    !Number.isSafeInteger(page.totalPages) ||
    page.totalPages < 0 ||
    !Number.isSafeInteger(page.pageNumber) ||
    page.pageNumber < 0
  )
    throw new Error("Dữ liệu trang đánh giá không hợp lệ.");
  page.content.forEach(checkedReview);
  return page;
};

export const createAdminReviewsApi = (client) => ({
  search: async (filters = {}, options) =>
    checkedPage(
      await client.get(
        `/api/reviews/admin${buildAdminReviewQuery(filters)}`,
        options,
      ),
    ),
  hide: async (id) =>
    checkedReview(
      await client.post(
        `/api/reviews/admin/${positiveId(id, "ID đánh giá")}/hide`,
      ),
    ),
});

export const adminReviewsApi = createAdminReviewsApi(api);
