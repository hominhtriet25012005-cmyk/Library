import { api } from "./client.js";

export const createFinesApi = (client) => ({
  mine: ({ status, type } = {}, options) => {
    const query = new URLSearchParams();
    if (status && status !== "ALL") query.set("status", status);
    if (type && type !== "ALL") query.set("type", type);
    return client.get(`/api/fines/my${query.size ? `?${query}` : ""}`, options);
  },
});

export const finesApi = createFinesApi(api);
