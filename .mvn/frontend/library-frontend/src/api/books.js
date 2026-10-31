import { api } from "./client.js";

export const bookSearchPayload = ({
  searchTerm,
  genreId,
  availability,
  page,
  size,
  sortBy,
  sortDirection,
}) => ({
  searchTerm: searchTerm.trim() || null,
  genreId,
  availableOnly: availability === "AVAILABLE",
  unavailableOnly: availability === "CHECKED_OUT",
  page,
  size: size ?? 9,
  sortBy,
  sortDirection,
});

export const booksApi = {
  search: (filters, options) =>
    api.post("/api/books/search", bookSearchPayload(filters), options),
  genres: (options) => api.get("/api/genres", options),
  detail: (id, options) =>
    api.get(`/api/books/${encodeURIComponent(id)}`, options),
};
