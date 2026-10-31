import { api } from "./client.js";

export const createSubscriptionsApi = (client) => ({
  plans: (options) => client.get("/api/subscription-plans", options),
  active: (options) => client.get("/api/subscriptions/user/active", options),
  cancel: (id, reason = "") =>
    client.post(
      `/api/subscriptions/cancel/${encodeURIComponent(id)}${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`,
    ),
});

export const subscriptionsApi = createSubscriptionsApi(api);
