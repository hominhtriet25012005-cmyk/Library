import { api } from "./client.js";

export const createPaymentsApi = (client) => ({
  pendingMemberships: (options) => client.get("/api/payments/membership/pending", options),
  resume: (paymentId, options) =>
    client.post(`/api/payments/${encodeURIComponent(paymentId)}/resume`, undefined, options),
  subscribe: (planId) =>
    client.post("/api/subscriptions/subscribe", { planId }),
  payFine: (fineId) =>
    client.post(`/api/fines/${encodeURIComponent(fineId)}/pay`),
  status: (paymentId, options) =>
    client.get(
      `/api/payments/${encodeURIComponent(paymentId)}/status`,
      options,
    ),
  reconcile: (paymentId) =>
    client.post(`/api/payments/${encodeURIComponent(paymentId)}/reconcile`),
});

export const paymentsApi = createPaymentsApi(api);
