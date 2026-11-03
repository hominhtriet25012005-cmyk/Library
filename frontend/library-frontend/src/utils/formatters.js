/**
 * formatCurrencyVND - Định dạng tiền tệ VND chuẩn Việt Nam
 * @param {number|string} value - Số tiền
 * @returns {string} - Ví dụ "50.000 ₫"
 */
export const formatCurrencyVND = (value) => {
  const numeric = Number(value);
  if (value === null || value === undefined || isNaN(numeric)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numeric);
};

/**
 * formatDateVN - Định dạng ngày tháng DD/MM/YYYY
 * @param {string|Date} value
 * @returns {string} - Ví dụ "15/10/2026" hoặc "—"
 */
export const formatDateVN = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatPublicationInfo = (date, year) => {
  if (date) return formatDateVN(date);
  if (year !== null && year !== undefined && String(year).trim() !== "")
    return String(year);
  return "—";
};

/**
 * formatDateTimeVN - Định dạng ngày giờ HH:mm, DD/MM/YYYY
 * @param {string|Date} value
 * @returns {string}
 */
export const formatDateTimeVN = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
