import { checkoutUrl, validateInitiation } from "./paymentRules.js";

const keyFor = (paymentId) => `library.payment.${paymentId}`;

export const createPaymentSession = (storage) => ({
  get: (paymentId) => {
    if (!Number.isSafeInteger(Number(paymentId)) || Number(paymentId) <= 0)
      return null;
    try {
      const value = JSON.parse(storage?.getItem(keyFor(paymentId)) || "null");
      return Number(value?.paymentId) === Number(paymentId) ? value : null;
    } catch {
      return null;
    }
  },
  save(response, { kind } = {}) {
    const payment = validateInitiation(response);
    const stored = this.get(payment.paymentId);
    const previous = stored?.amount === Number(payment.amount) ? stored : null;
    const value = {
      paymentId: Number(payment.paymentId),
      amount: Number(payment.amount),
      kind: kind === "fine" ? "fine" : "membership",
      qrCode:
        typeof payment.qrCode === "string" && payment.qrCode
          ? payment.qrCode
          : previous?.qrCode || null,
      checkoutUrl:
        checkoutUrl(payment.checkoutUrl) || previous?.checkoutUrl || null,
    };
    storage?.setItem(keyFor(payment.paymentId), JSON.stringify(value));
    return value;
  },
});

export const paymentSession = createPaymentSession(
  typeof window === "undefined" ? null : window.sessionStorage,
);
