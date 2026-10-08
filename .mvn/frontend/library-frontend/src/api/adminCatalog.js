import { api } from "./client.js";

export const createAdminCatalogApi = (client) => ({
  searchBooks: (filters, options) => client.post("/api/admin/book/search", filters, options),
  getBook: (id, options) => client.get(`/api/admin/book/${encodeURIComponent(id)}`, options),
  createBook: (book) => client.post("/api/admin/book/admin", book),
  updateBook: (id, book) => client.put(`/api/books/${encodeURIComponent(id)}`, book),
  setBookActive: (id, active) => client.put(`/api/admin/book/${encodeURIComponent(id)}/active`, { active }),
  getGenres: (options) => client.get("/api/genres", options),
  createGenre: (genre) => client.post("/api/genres/create", genre),
  updateGenre: (id, genre) => client.put(`/api/genres/${encodeURIComponent(id)}`, genre),
  hideGenre: (id) => client.delete(`/api/genres/${encodeURIComponent(id)}`),
});

export const adminCatalogApi = createAdminCatalogApi(api);
