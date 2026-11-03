import { api } from "./client.js";

export const createPaymentsApi = (client) => ({
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
