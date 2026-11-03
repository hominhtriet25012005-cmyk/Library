import { api } from "./client.js";

export const createReservationsApi = (client) => ({
  list: (page = 0, size = 20, options) =>
    client.get(
      `/api/reservations/my?page=${page}&size=${size}&sortBy=reservedAt&sortDirection=DESC`,
      options,
    ),
  create: (bookId, notes = "") =>
    client.post("/api/reservations", { bookId, notes }),
  cancel: (id) => client.delete(`/api/reservations/${encodeURIComponent(id)}`),
});

export const reservationsApi = createReservationsApi(api);

export const loadReservationPages = async (listPage, options = {}) => {
  const entries = [];
  for (let page = 0; ; page += 1) {
    const result = await listPage(page, 20, options);
    if (!Array.isArray(result?.content))
      throw new Error("Dữ liệu đặt giữ không hợp lệ.");
    entries.push(...result.content);
    if (page + 1 >= (result.totalPages || 1)) return entries;
  }
};
