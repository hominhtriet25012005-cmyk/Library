export const loanStatusLabels = {
  CHECKED_OUT: "Đang mượn",
  OVERDUE: "Quá hạn",
  RETURNED: "Đã trả",
  LOST: "Bị mất",
  DAMAGED: "Hư hỏng",
};

export const reservationStatusLabels = {
  PENDING: "Đang chờ",
  AVAILABLE: "Sẵn sàng nhận",
  FULFILLED: "Đã nhận sách",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value))
    : "—";
