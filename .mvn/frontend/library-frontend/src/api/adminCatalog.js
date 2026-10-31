import { api } from "./client.js";

export const createAdminCatalogApi = (client) => ({
  searchBooks: (filters, options) =>
    client.post("/api/admin/book/search", filters, options),
  getBook: (id, options) =>
    client.get(`/api/admin/book/${encodeURIComponent(id)}`, options),
  createBook: (book) => client.post("/api/admin/book/admin", book),
  updateBook: (id, book) =>
    client.put(`/api/books/${encodeURIComponent(id)}`, book),
  setBookActive: (id, active) =>
    client.put(`/api/admin/book/${encodeURIComponent(id)}/active`, { active }),
  hardDeleteBook: (id) =>
    client.delete(`/api/books/${encodeURIComponent(id)}/permanent`),
  uploadBookCover: (file, options) => {
    const formData =
      file instanceof FormData
        ? file
        : (() => {
            const fd = new FormData();
            fd.append("file", file);
            return fd;
          })();
    return client.post("/api/admin/books/covers", formData, options);
  },
  getGenres: (options) => client.get("/api/genres", options),
  getGenre: (id, options) =>
    client.get(`/api/genres/${encodeURIComponent(id)}`, options),
  createGenre: (genre) => client.post("/api/genres/create", genre),
  updateGenre: (id, genre) =>
    client.put(`/api/genres/${encodeURIComponent(id)}`, genre),
  hideGenre: (id) => client.delete(`/api/genres/${encodeURIComponent(id)}`),
  hardDeleteGenre: (id) =>
    client.delete(`/api/genres/${encodeURIComponent(id)}/hard`),
  getBookCountByGenre: (id, options) =>
    client.get(`/api/genres/${encodeURIComponent(id)}/book-count`, options),
});

export const adminCatalogApi = createAdminCatalogApi(api);
