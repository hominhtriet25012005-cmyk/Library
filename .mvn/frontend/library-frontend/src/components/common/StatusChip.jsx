import { Chip } from "@mui/material";

// Từ điển trạng thái toàn hệ thống
const statusDictionary = {
  // Lượt mượn (Loans)
  loan: {
    CHECKED_OUT: {
      label: "Đang mượn",
      color: "primary",
      bg: "#e8f0ff",
      text: "#1769ff",
    },
    OVERDUE: {
      label: "Quá hạn",
      color: "error",
      bg: "#fee2e2",
      text: "#dc2626",
    },
    RETURNED: {
      label: "Đã trả",
      color: "success",
      bg: "#dcfce7",
      text: "#15803d",
    },
    LOST: { label: "Báo mất", color: "error", bg: "#fef2f2", text: "#b91c1c" },
    DAMAGED: {
      label: "Hư hỏng",
      color: "warning",
      bg: "#fef3c7",
      text: "#b45309",
    },
  },
  // Đặt giữ (Reservations)
  reservation: {
    PENDING: {
      label: "Đang chờ",
      color: "warning",
      bg: "#fef3c7",
      text: "#b45309",
    },
    AVAILABLE: {
      label: "Sẵn sàng nhận",
      color: "info",
      bg: "#e0f2fe",
      text: "#0369a1",
    },
    FULFILLED: {
      label: "Đã giao sách",
      color: "success",
      bg: "#dcfce7",
      text: "#15803d",
    },
    CANCELLED: {
      label: "Đã hủy",
      color: "default",
      bg: "#f1f5f9",
      text: "#64748b",
    },
    EXPIRED: {
      label: "Hết hạn",
      color: "error",
      bg: "#fee2e2",
      text: "#dc2626",
    },
  },
  // Tiền phạt (Fines)
  fine: {
    PENDING: {
      label: "Chưa thanh toán",
      color: "warning",
      bg: "#fef3c7",
      text: "#b45309",
    },
    PARTIALLY_PAID: {
      label: "Đã trả một phần",
      color: "info",
      bg: "#e0f2fe",
      text: "#0369a1",
    },
    PAID: {
      label: "Đã thanh toán",
      color: "success",
      bg: "#dcfce7",
      text: "#15803d",
    },
    WAIVED: {
      label: "Đã miễn",
      color: "default",
      bg: "#f1f5f9",
      text: "#64748b",
    },
  },
  // Thanh toán (Payments)
  payment: {
    PENDING: {
      label: "Chờ thanh toán",
      color: "warning",
      bg: "#fef3c7",
      text: "#b45309",
    },
    PROCESSING: {
      label: "Đang xác nhận",
      color: "info",
      bg: "#e0f2fe",
      text: "#0369a1",
    },
    SUCCESS: {
      label: "Đã xác nhận",
      color: "success",
      bg: "#dcfce7",
      text: "#15803d",
    },
    FAILED: {
      label: "Thất bại",
      color: "error",
      bg: "#fee2e2",
      text: "#dc2626",
    },
    CANCELLED: {
      label: "Đã hủy",
      color: "default",
      bg: "#f1f5f9",
      text: "#64748b",
    },
    REFUNDED: {
      label: "Đã hoàn tiền",
      color: "default",
      bg: "#f1f5f9",
      text: "#475569",
    },
  },
  // Trạng thái hiển thị Sách / Thể loại (Active / Inactive)
  active: {
    true: {
      label: "Hiển thị",
      color: "success",
      bg: "#dcfce7",
      text: "#15803d",
    },
    false: { label: "Đã ẩn", color: "default", bg: "#f1f5f9", text: "#64748b" },
    ACTIVE: {
      label: "Hiển thị",
      color: "success",
      bg: "#dcfce7",
      text: "#15803d",
    },
    INACTIVE: {
      label: "Đã ẩn",
      color: "default",
      bg: "#f1f5f9",
      text: "#64748b",
    },
  },
  // Vai trò (Roles)
  role: {
    ROLE_ADMIN: {
      label: "Quản trị viên",
      color: "primary",
      bg: "#e8f0ff",
      text: "#1769ff",
    },
    ROLE_USER: {
      label: "Độc giả",
      color: "default",
      bg: "#f1f5f9",
      text: "#475569",
    },
  },
};

/**
 * StatusChip - Chip hiển thị trạng thái chuẩn hóa với màu sắc và nhãn ngữ nghĩa
 *
 * @param {string|boolean} status - Mã trạng thái (vd: "CHECKED_OUT", "PENDING", true...)
 * @param {'loan'|'reservation'|'fine'|'payment'|'active'|'role'|'general'} [type='general'] - Phân loại nghiệp vụ
 * @param {string} [label] - Nhãn hiển thị đè (nếu muốn tự đặt)
 * @param {'small'|'medium'} [size='small'] - Kích thước chip
 */
export const StatusChip = ({
  status,
  type = "general",
  label,
  size = "small",
  variant = "filled",
  sx = {},
}) => {
  const normalizedKey = typeof status === "boolean" ? String(status) : status;
  const config = statusDictionary[type]?.[normalizedKey] ||
    statusDictionary.active[normalizedKey] || {
      label: label || String(status ?? "—"),
      color: "default",
      bg: "#f1f5f9",
      text: "#475569",
    };

  const displayLabel = label || config.label;

  return (
    <Chip
      size={size}
      label={displayLabel}
      sx={{
        fontWeight: 600,
        fontSize: size === "small" ? "0.75rem" : "0.8125rem",
        height: size === "small" ? 24 : 28,
        borderRadius: 1.5,
        bgcolor: config.bg,
        color: config.text,
        border: "1px solid transparent",
        ...sx,
      }}
    />
  );
};

export default StatusChip;
