import { api } from "./client.js";

const roles = new Set(["ROLE_USER", "ROLE_ADMIN"]);
const invalidUsers = () => new Error("Dữ liệu người dùng không hợp lệ.");

const toSafeUser = (user) => {
  if (!user || !Number.isSafeInteger(user.id) || user.id < 1
    || typeof user.email !== "string" || !user.email.trim()
    || typeof user.fullName !== "string" || !user.fullName.trim()
    || !roles.has(user.role)
    || (user.phone != null && typeof user.phone !== "string")
    || (user.lastLogin != null && typeof user.lastLogin !== "string")) {
    throw invalidUsers();
  }
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    lastLogin: user.lastLogin ?? null,
  };
};

export const createAdminUsersApi = (client) => ({
  list: async (options) => {
    const response = await client.get("/api/users/list", options);
    if (!Array.isArray(response)) throw invalidUsers();
    return response.map(toSafeUser);
  },
});

export const adminUsersApi = createAdminUsersApi(api);

const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase("vi-VN")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

export const filterAdminUsers = (users, { searchTerm = "", role = "ALL" } = {}) => {
  const query = normalize(searchTerm);
  return users.filter((user) => {
    if (role !== "ALL" && user.role !== role) return false;
    return !query || [user.fullName, user.email, user.phone, user.id]
      .some((value) => normalize(value).includes(query));
  });
};

export const paginateAdminUsers = (users, requestedPage, requestedSize = 10) => {
  const size = Number.isSafeInteger(requestedSize) && requestedSize > 0 ? requestedSize : 10;
  const totalElements = users.length;
  const totalPages = Math.ceil(totalElements / size);
  const page = totalPages === 0 ? 0 : Math.min(Math.max(0, requestedPage || 0), totalPages - 1);
  return { items: users.slice(page * size, (page + 1) * size), page, size, totalElements, totalPages };
};
