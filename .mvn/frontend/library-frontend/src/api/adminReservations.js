import { api } from "./client.js";

const positiveId = (value, label) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1)
    throw new Error(`${label} phải là số nguyên dương.`);
  return number;
};

const statuses = ["PENDING", "AVAILABLE", "FULFILLED", "CANCELLED", "EXPIRED"];
const sortFields = [
  "id",
  "reservedAt",
  "availableAt",
  "queuePosition",
  "status",
];

export const buildReservationSearch = ({
  page = 0,
  size = 10,
  userId = "",
  bookId = "",
  status = "ALL",
  activeOnly = false,
  sortBy = "reservedAt",
  sortDirection = "DESC",
} = {}) => {
  if (
    !Number.isSafeInteger(page) ||
    page < 0 ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 100
  )
    throw new Error("Trang hoặc kích thước trang không hợp lệ.");
  if (!sortFields.includes(sortBy) || !["ASC", "DESC"].includes(sortDirection))
    throw new Error("Thứ tự sắp xếp không hợp lệ.");
  const body = { page, size, sortBy, sortDirection };
  if (userId !== "" && userId != null)
    body.userId = positiveId(userId, "ID người dùng");
  if (bookId !== "" && bookId != null)
    body.bookId = positiveId(bookId, "ID sách");
  if (status !== "ALL") {
    if (!statuses.includes(status))
      throw new Error("Trạng thái đặt giữ không hợp lệ.");
    body.status = status;
  }
  if (activeOnly) body.activeOnly = true;
  return body;
};

const checkedReservation = (entry) => {
  if (
    !Number.isSafeInteger(entry?.id) ||
    entry.id < 1 ||
    !statuses.includes(entry.status)
  )
    throw new Error("Dữ liệu đặt giữ không hợp lệ.");
  return entry;
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
    throw new Error("Dữ liệu đặt giữ không hợp lệ.");
  page.content.forEach(checkedReservation);
  return page;
};

export const canAdminCancel = (entry) =>
  ["PENDING", "AVAILABLE"].includes(entry?.status) &&
  entry.canBeCancelled === true;

export const canAdminFulfill = (entry) =>
  ["PENDING", "AVAILABLE"].includes(entry?.status) &&
  entry.queuePosition === 1 &&
  entry.isBookAvailable === true &&
  entry.expired !== true;

export const createAdminReservationsApi = (client) => ({
  search: async (filters = {}, options) =>
    checkedPage(
      await client.post(
        "/api/reservations/search",
        buildReservationSearch(filters),
        options,
      ),
    ),
  create: async ({ userId, bookId, notes = "" }) =>
    checkedReservation(
      await client.post(
        `/api/reservations/user/${positiveId(userId, "ID người dùng")}`,
        { bookId: positiveId(bookId, "ID sách"), notes },
      ),
    ),
  cancel: async (id) =>
    checkedReservation(
      await client.delete(`/api/reservations/${positiveId(id, "ID đặt giữ")}`),
    ),
  fulfill: async (id) =>
    checkedReservation(
      await client.post(
        `/api/reservations/${positiveId(id, "ID đặt giữ")}/fulfill`,
      ),
    ),
});

export const adminReservationsApi = createAdminReservationsApi(api);
