import { useState } from "react";
import { Box, Button, Collapse, Paper, Typography } from "@mui/material";
import MenuBook from "@mui/icons-material/MenuBookRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import { Link } from "react-router-dom";
import { formatDateVN } from "../../utils/formatters.js";
import { StatusChip } from "../../components/common";
import {
  canRenewLoan,
  canReturnLoan,
  effectiveLoanStatus,
} from "./loanRules.js";

const LoanCard = ({ loan, preview = false, onAction }) => {
  const [expanded, setExpanded] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const status = effectiveLoanStatus(loan);

  return (
    <Paper
      component="article"
      variant="outlined"
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2.5,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
        }}
      >
        {/* Thumbnail Bìa Sách */}
        <Box
          sx={{
            width: 80,
            height: 110,
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "#17243a" : "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {loan.bookCoverImage && !coverFailed ? (
            <Box
              component="img"
              src={loan.bookCoverImage}
              alt={`Bìa sách ${loan.bookTitle}`}
              onError={() => setCoverFailed(true)}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <MenuBook sx={{ color: "#1769ff", fontSize: 36 }} />
          )}
        </Box>

        {/* Thông tin mượn */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1.5,
              mb: 0.5,
            }}
          >
            <Typography
              variant="subtitle1"
              component="h2"
              sx={{ fontWeight: 750, color: "text.primary", lineHeight: 1.3 }}
            >
              {loan.bookTitle}
            </Typography>
            <StatusChip type="loan" status={status} />
          </Box>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.25 }}>
            Tác giả: <strong>{loan.bookAuthor || "Chưa rõ tác giả"}</strong>
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 1.5 }}
          >
            Mã lượt mượn: #{loan.id} · ISBN: {loan.bookIsbn || "—"}
          </Typography>

          {/* Metadata timeline */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "#17243a" : "#f8fafc",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarTodayRoundedIcon
                sx={{ fontSize: 16, color: "text.secondary" }}
              />
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", display: "block" }}
                >
                  Ngày mượn
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#1e293b" }}
                >
                  {formatDateVN(loan.checkoutDate)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EventBusyRoundedIcon
                sx={{
                  fontSize: 16,
                  color: status === "OVERDUE" ? "error.main" : "#64748b",
                }}
              />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: status === "OVERDUE" ? "error.main" : "#64748b",
                    display: "block",
                  }}
                >
                  Hạn trả sách
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: status === "OVERDUE" ? "error.main" : "#1e293b",
                  }}
                >
                  {formatDateVN(loan.dueDate)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AutorenewRoundedIcon sx={{ fontSize: 16, color: "#64748b" }} />
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", display: "block" }}
                >
                  Đã gia hạn
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#1e293b" }}
                >
                  {loan.renewalCount ?? 0} / {loan.maxRenewals ?? "—"} lần
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Chi tiết mở rộng */}
      <Collapse in={expanded}>
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: "1px dashed #e2e8f0",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 1.5,
          }}
        >
          {loan.returnDate && (
            <Typography variant="caption" sx={{ color: "#475569" }}>
              Ngày hoàn trả thực tế:{" "}
              <strong>{formatDateVN(loan.returnDate)}</strong>
            </Typography>
          )}
          {status === "OVERDUE" && (
            <Typography
              variant="caption"
              sx={{ color: "error.main", fontWeight: 600 }}
            >
              Số ngày quá hạn:{" "}
              {loan.overdueDays || "Đang tính toán theo hạn trả"}
            </Typography>
          )}
          {loan.notes && (
            <Typography
              variant="caption"
              sx={{ color: "#475569", gridColumn: { sm: "1 / -1" } }}
            >
              Ghi chú: {loan.notes}
            </Typography>
          )}
        </Box>
      </Collapse>

      {/* Hàng nút bấm hành động */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mt: 2,
          pt: 1.5,
          borderTop: "1px solid #f1f5f9",
        }}
      >
        <Button
          size="small"
          onClick={() => setExpanded((v) => !v)}
          endIcon={
            expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />
          }
          sx={{ textTransform: "none", color: "#64748b", fontWeight: 600 }}
        >
          {expanded ? "Thu gọn" : "Chi tiết thêm"}
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          {!preview && loan.bookId && (
            <Button
              component={Link}
              to={`/user/books/${loan.bookId}`}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Xem trang sách
            </Button>
          )}
          {!preview && canRenewLoan(loan) && (
            <Button
              onClick={() => onAction(loan, "renew")}
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<AutorenewRoundedIcon />}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Gia hạn
            </Button>
          )}
          {!preview && canReturnLoan(loan) && (
            <Button
              onClick={() => onAction(loan, "return")}
              variant="contained"
              size="small"
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Trả sách
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default LoanCard;
