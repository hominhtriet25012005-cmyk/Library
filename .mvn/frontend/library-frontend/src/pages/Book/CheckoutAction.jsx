import { useState, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Link } from "react-router-dom";
import { loansApi } from "../../api/loans.js";
import { checkoutDaysForPlan, renewalDays } from "../MyLoans/loanRules.js";

const CheckoutAction = ({ book, activeLoan = null, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [days, setDays] = useState("");
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const openDialog = async () => {
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const [active, myLoansRes] = await Promise.all([
        loansApi.activeSubscription(),
        loansApi.list(0, 50).catch(() => ({ content: [] })),
      ]);
      const alreadyBorrowed =
        Boolean(activeLoan) ||
        myLoansRes?.content?.some(
          (l) =>
            Number(l.bookId) === Number(book.id) &&
            (l.status === "CHECKED_OUT" || l.status === "OVERDUE") &&
            !l.returnDate,
        );
      if (alreadyBorrowed) {
        throw new Error(
          "Bạn hiện đang mượn cuốn sách này rồi. Vui lòng kiểm tra mục Sách đang mượn.",
        );
      }
      const defaultDays = checkoutDaysForPlan(active?.maxDaysPerBook);
      if (!defaultDays)
        throw new Error("Gói hiện tại chưa có hạn mức ngày mượn hợp lệ.");
      setSubscription(active);
      setDays(String(defaultDays));
      setIsCustomDays(false);
    } catch (failure) {
      setSubscription(null);
      setError(
        failure.status === 404
          ? "Bạn cần có gói thành viên đang hoạt động để mượn sách."
          : failure.message,
      );
    } finally {
      setLoading(false);
    }
  };

  // Danh sách các mốc thời hạn thông minh phù hợp với hạn mức gói của độc giả
  const checkoutOptions = useMemo(() => {
    if (!subscription?.maxDaysPerBook) return [];
    const max = Number(subscription.maxDaysPerBook);
    const standardMilestones = [7, 14, 21, 30, 60, 90];
    const options = [];

    standardMilestones.forEach((m) => {
      if (m < max) {
        const weeks = m % 7 === 0 ? `${m / 7} tuần` : `${m} ngày`;
        options.push({ value: String(m), label: `${m} ngày (${weeks})` });
      }
    });

    // Luôn bao gồm mốc tối đa của gói
    if (!options.some((o) => o.value === String(max))) {
      const weeks = max % 7 === 0 ? `${max / 7} tuần` : `${max} ngày`;
      options.push({
        value: String(max),
        label: `${max} ngày (Tối đa gói - ${weeks})`,
      });
    }

    return options;
  }, [subscription?.maxDaysPerBook]);

  // Dự tính Hạn trả sách cụ thể  theo ngày hiện tại + số ngày mượn
  const dueDateFormatted = useMemo(() => {
    const numDays = Number(days);
    if (!numDays || numDays < 1) return null;
    const target = new Date();
    target.setDate(target.getDate() + numDays);

    const daysOfWeek = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const dayName = daysOfWeek[target.getDay()];
    const d = String(target.getDate()).padStart(2, "0");
    const m = String(target.getMonth() + 1).padStart(2, "0");
    const y = target.getFullYear();

    return `${dayName}, ${d}/${m}/${y}`;
  }, [days]);

  const handlePeriodChange = (event) => {
    const selected = event.target.value;
    if (selected === "custom") {
      setIsCustomDays(true);
    } else {
      setIsCustomDays(false);
      setDays(selected);
    }
  };

  const checkout = async () => {
    const checkoutDays = renewalDays(days);
    if (checkoutDays === null || checkoutDays > subscription.maxDaysPerBook) {
      setError(
        `Số ngày mượn phải từ 1 đến ${subscription.maxDaysPerBook} ngày.`,
      );
      return;
    }
    if (notes.length > 500) {
      setError("Ghi chú tối đa 500 ký tự.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await loansApi.checkout(book.id, checkoutDays, notes.trim());
      setCompleted(true);
      setOpen(false);
      onSuccess?.();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      {completed ? (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Đã mượn sách thành công!{" "}
          <Button
            component={Link}
            to="/user/my-loans"
            size="small"
            sx={{ fontWeight: 700, textTransform: "none", ml: 1 }}
          >
            Xem lượt mượn của tôi →
          </Button>
        </Alert>
      ) : (
        <Button
          variant="contained"
          disabled={!book.availableCopies}
          onClick={openDialog}
          startIcon={<MenuBookRoundedIcon />}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            py: 1,
            boxShadow: "0 2px 8px rgba(23,105,255,0.25)",
          }}
        >
          {book.availableCopies ? "Mượn cuốn sách này" : "Tạm thời hết sách"}
        </Button>
      )}

      {/* Dialog xác nhận mượn sách */}
      <Dialog
        open={open}
        onClose={busy ? undefined : () => setOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 750, color: "#102d62" }}>
            Đăng ký mượn sách
          </Typography>
          <IconButton
            size="small"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            {/* Tóm tắt thông tin sách */}
            <Box
              sx={{
                p: 1.5,
                bgcolor: "#f8fafc",
                borderRadius: 2,
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 750, color: "#1e293b" }}
              >
                {book.title}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Tác giả: {book.author || "Chưa cập nhật"}
              </Typography>
            </Box>

            {loading && (
              <Box sx={{ py: 2, textAlign: "center" }}>
                <CircularProgress size={24} />
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 1, color: "#64748b" }}
                >
                  Đang kiểm tra gói thành viên...
                </Typography>
              </Box>
            )}

            {subscription && (
              <>
                {/* 1. Lựa chọn thời hạn mượn  */}
                <FormControl fullWidth size="small">
                  <InputLabel id="checkout-period-select-label">
                    Thời hạn mượn
                  </InputLabel>
                  <Select
                    labelId="checkout-period-select-label"
                    label="Thời hạn mượn "
                    value={isCustomDays ? "custom" : days}
                    onChange={handlePeriodChange}
                    sx={{ borderRadius: "10px" }}
                  >
                    {checkoutOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                    <MenuItem value="custom">
                      Tùy chỉnh số ngày khác...
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Ô nhập số ngày cụ thể khi chọn tùy chỉnh */}
                {isCustomDays && (
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={`Số ngày mượn (từ 1 đến ${subscription.maxDaysPerBook} ngày)`}
                    value={days}
                    onChange={(event) => setDays(event.target.value)}
                    slotProps={{
                      htmlInput: {
                        min: 1,
                        max: subscription.maxDaysPerBook,
                        step: 1,
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                    }}
                    helperText={`Tối đa theo gói: ${subscription.maxDaysPerBook} ngày`}
                  />
                )}

                {/* 2. Khối thông tin Hạn trả dự kiến  */}
                {dueDateFormatted && (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "10px",
                      bgcolor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.25,
                    }}
                  >
                    <CalendarTodayRoundedIcon
                      sx={{ fontSize: 20, color: "#16a34a", mt: 0.25 }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#15803d",
                          fontWeight: 700,
                          display: "block",
                        }}
                      >
                        Hạn trả sách dự kiến
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 800, color: "#166534", mt: 0.25 }}
                      >
                        {dueDateFormatted}{" "}
                        <span
                          style={{
                            fontWeight: 500,
                            fontSize: "0.8125rem",
                            color: "#15803d",
                          }}
                        >
                          ({days} ngày)
                        </span>
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#15803d",
                          display: "block",
                          mt: 0.5,
                          fontSize: "0.75rem",
                          lineHeight: 1.4,
                        }}
                      >
                        Vui lòng hoàn trả trước hoặc trong ngày này để tránh
                        phát sinh phí trễ hạn.
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* 3. Ghi chú thêm */}
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label="Ghi chú thêm (không bắt buộc)"
                  placeholder="Lưu ý khi nhận sách tại quầy..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />

                {/* 4. Thông tin quyền lợi gói & chính sách gia hạn */}
                <Box
                  sx={{
                    p: 1.25,
                    borderRadius: "10px",
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <InfoOutlinedIcon
                    sx={{
                      fontSize: 18,
                      color: "#1769ff",
                      mt: 0.25,
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#334155",
                        display: "block",
                        lineHeight: 1.5,
                      }}
                    >
                      Gói <strong>{subscription.planName || "Hội viên"}</strong>
                      : Tối đa{" "}
                      <strong>
                        {subscription.maxDaysPerBook} ngày mượn/cuốn
                      </strong>
                      .
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", display: "block", mt: 0.25 }}
                    >
                      Chính sách: Có thể gia hạn tối đa 2 lần nếu sách chưa có
                      độc giả khác đặt giữ.
                    </Typography>
                  </Box>
                </Box>
              </>
            )}

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            disabled={busy}
            onClick={() => setOpen(false)}
            sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={loading || busy || !subscription || !renewalDays(days)}
            onClick={checkout}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 2.5,
            }}
          >
            {busy ? "Đang xử lý…" : "Xác nhận mượn"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CheckoutAction;
