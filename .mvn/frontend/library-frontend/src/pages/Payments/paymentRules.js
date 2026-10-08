export const paymentsEnabled = import.meta.env?.VITE_PAYMENTS_ENABLED === "true";

const paymentStatuses = new Set(["PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"]);
const validId = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0;

export const checkoutUrl = (value) => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || (parsed.hostname !== "payos.vn" && !parsed.hostname.endsWith(".payos.vn"))) return null;
    return parsed.href;
  } catch {
    return null;
  }
};

export const validateInitiation = (response) => {
  if (!response || !validId(response.paymentId) || Number(response.orderCode) !== Number(response.paymentId)
    || !Number.isSafeInteger(Number(response.amount)) || Number(response.amount) <= 0
    || response.currency !== "VND" || response.gateway !== "PAYOS"
    || !paymentStatuses.has(response.status)) {
    throw new Error("Phản hồi tạo đơn thanh toán không hợp lệ; không mở trang thanh toán.");
  }
  return response;
};

export const readReturnOrderCode = (search) => {
  const value = new URLSearchParams(search).get("orderCode");
  return value && /^\d+$/.test(value) && validId(value) ? Number(value) : null;
};

export const validateSnapshot = (snapshot, paymentId) => {
  if (!snapshot || !validId(paymentId) || Number(snapshot.paymentId) !== Number(paymentId)
    || !Number.isSafeInteger(Number(snapshot.amount)) || Number(snapshot.amount) <= 0
    || snapshot.currency !== "VND" || !paymentStatuses.has(snapshot.status)) {
    throw new Error("Trạng thái thanh toán từ máy chủ không hợp lệ.");
  }
  return snapshot;
};

export const paymentView = (status) => {
  switch (status) {
    case "SUCCESS": return { label: "Đã xác nhận thanh toán", severity: "success", terminal: true, success: true };
    case "FAILED": return { label: "Thanh toán thất bại", severity: "error", terminal: true, success: false };
    case "CANCELLED": return { label: "Đơn đã hủy", severity: "warning", terminal: true, success: false };
    case "REFUNDED": return { label: "Đã hoàn tiền", severity: "warning", terminal: true, success: false };
    case "PROCESSING": return { label: "Đang chờ xác nhận", severity: "info", terminal: false, success: false };
    default: return { label: "Chờ thanh toán", severity: "info", terminal: false, success: false };
  }
};
