import { Box, Button, Chip, Divider, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import AccessAlarm from "@mui/icons-material/AccessAlarmRounded";
import Book from "@mui/icons-material/BookRounded";
import CalendarToday from "@mui/icons-material/CalendarTodayRounded";
import Notifications from "@mui/icons-material/NotificationsRounded";
import CheckCircle from "@mui/icons-material/CheckCircleRounded";
import { formatDateVN, formatDateTimeVN } from "../../utils/formatters.js";
import { StatusChip } from "../../components/common";
import { canCancelReservation } from "./reservationRules.js";

const MyReservationCard = ({ reservation, preview = false, onAction }) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: "#e2e8f0",
        bgcolor: "#fff",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: "#cbd5e1",
          boxShadow: "0 6px 16px rgba(15,23,42,0.06)",
        },
      }}
    >
      {/* Header trạng thái */}
      <Box
        sx={{
          p: 2,
          px: 2.5,
          bgcolor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: "#64748b" }}
        >
          Mã đặt giữ #{reservation.id}
        </Typography>
        <StatusChip type="reservation" status={reservation.status} />
      </Box>

      {/* Thông tin sách */}
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
        <Box
          sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}
        >
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: "rgba(23,105,255,0.08)",
              color: "#1769ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Book sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 750,
                color: "#1e293b",
                lineHeight: 1.3,
                mb: 0.25,
              }}
            >
              {reservation.bookTitle}
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Tác giả: {reservation.bookAuthor || "Chưa rõ"}
            </Typography>
          </Box>
        </Box>

        {/* Hàng đợi (nếu có) */}
        {reservation.queuePosition != null &&
          reservation.status === "PENDING" && (
            <Box
              sx={{
                my: 1,
                p: 1.25,
                borderRadius: 2,
                bgcolor: "rgba(23,105,255,0.06)",
                border: "1px solid rgba(23,105,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: "#1769ff" }}
              >
                Vị trí trong hàng đợi:
              </Typography>
              <Chip
                label={`Thứ hạng #${reservation.queuePosition}`}
                size="small"
                color="primary"
                sx={{ fontWeight: 750, height: 22, fontSize: "0.75rem" }}
              />
            </Box>
          )}

        <Divider sx={{ my: 1.5 }} />

        {/* Timeline chi tiết */}
        <Box sx={{ display: "grid", gap: 1, my: 1, flexGrow: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessAlarm sx={{ fontSize: 16, color: "#94a3b8" }} />
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Ngày đăng ký:{" "}
              <strong>{formatDateVN(reservation.reservedAt)}</strong>
            </Typography>
          </Box>

          {reservation.availableAt && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarToday sx={{ fontSize: 16, color: "success.main" }} />
              <Typography
                variant="caption"
                sx={{ color: "success.main", fontWeight: 600 }}
              >
                Sách sẵn sàng từ: {formatDateVN(reservation.availableAt)}
              </Typography>
            </Box>
          )}

          {reservation.availableUntil && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Notifications sx={{ fontSize: 16, color: "error.main" }} />
              <Typography
                variant="caption"
                sx={{ color: "error.main", fontWeight: 700 }}
              >
                Hết hạn nhận: {formatDateTimeVN(reservation.availableUntil)}
              </Typography>
            </Box>
          )}

          {reservation.fulfilledAt && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle sx={{ fontSize: 16, color: "primary.main" }} />
              <Typography variant="caption" sx={{ color: "#475569" }}>
                Đã nhận sách ngày: {formatDateVN(reservation.fulfilledAt)}
              </Typography>
            </Box>
          )}

          {reservation.cancelledAt && (
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              Đã hủy ngày: {formatDateVN(reservation.cancelledAt)}
            </Typography>
          )}

          {reservation.notes && (
            <Typography
              variant="caption"
              sx={{ color: "#64748b", fontStyle: "italic", mt: 0.5 }}
            >
              Ghi chú: {reservation.notes}
            </Typography>
          )}
        </Box>

        {/* Nút hành động */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1,
            pt: 2,
            borderTop: "1px solid #f1f5f9",
            mt: "auto",
          }}
        >
          {!preview && reservation.bookId && (
            <Button
              component={Link}
              to={`/user/books/${reservation.bookId}`}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Xem sách
            </Button>
          )}
          {!preview && canCancelReservation(reservation) && (
            <Button
              color="error"
              variant="outlined"
              size="small"
              onClick={() => onAction(reservation, "cancel")}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Hủy đặt giữ
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default MyReservationCard;
