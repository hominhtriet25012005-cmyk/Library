import { useEffect, useMemo, useRef, useState } from "react";
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
  Paper,
  Select,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import { useNavigate } from "react-router-dom";

import { finesApi } from "../../api/fines.js";
import { paymentsApi } from "../../api/payments.js";
import { paymentSession } from "../Payments/paymentSession.js";
import { paymentsEnabled } from "../Payments/paymentRules.js";
import {
  canPayFine,
  filterFines,
  fineOutstanding,
  fineStatusLabels,
  fineSummary,
  fineTypeLabels,
} from "./fineRules.js";
import {
  PageHeader,
  StatCard,
  StatCardGrid,
  SearchFilterBar,
  StatusChip,
  EmptyState,
} from "../../components/common";
import {
  formatCurrencyVND,
  formatDateVN,
  formatDateTimeVN,
} from "../../utils/formatters.js";

const InfoItem = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      sx={{ color: "#64748b", fontWeight: 500, display: "block" }}
    >
      {label}
    </Typography>
    <Typography
      sx={{ fontWeight: 600, color: "#1e293b", fontSize: "0.875rem" }}
    >
      {value ?? "—"}
    </Typography>
  </Box>
);

const FinesPage = () => {
  const navigate = useNavigate();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const creatingPayment = useRef(false);

  const createPayment = async () => {
    if (
      !paymentsEnabled ||
      !paymentInfo ||
      !canPayFine(paymentInfo) ||
      paymentBusy ||
      creatingPayment.current
    )
      return;
    creatingPayment.current = true;
    setPaymentBusy(true);
    setPaymentError("");
    try {
      const response = await paymentsApi.payFine(paymentInfo.id);
      paymentSession.save(response, { kind: "fine" });
      navigate(`/user/payments/${response.paymentId}`);
    } catch (failure) {
      setPaymentError(
        "Chưa thể mở đơn thanh toán. Nếu yêu cầu đã được gửi, vui lòng không bấm tạo lại trước khi kiểm tra hoặc đối soát. " +
          (failure.message || ""),
      );
    } finally {
      creatingPayment.current = false;
      setPaymentBusy(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    finesApi
      .mine({}, { signal: controller.signal })
      .then((entries) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(entries))
          throw new Error("Dữ liệu tiền phạt không hợp lệ.");
        setFines(entries);
        setError("");
      })
      .catch((failure) => {
        if (controller.signal.aborted || failure.name === "AbortError") return;
        setFines([]);
        setError(failure.message || "Không thể tải danh sách tiền phạt.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refresh]);

  const summary = useMemo(() => fineSummary(fines), [fines]);
  const visibleFines = useMemo(
    () => filterFines(fines, { status, type }),
    [fines, status, type],
  );

  return (
    <Box
      component="section"
      aria-label="Tiền phạt của tôi"
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
        pb: 4,
      }}
    >
      {/* Header */}
      <PageHeader
        title="Tiền phạt của tôi"
        subtitle="Theo dõi chi tiết các khoản phí phạt phát sinh do trễ hạn mượn hoặc hư tổn tài liệu thư viện."
        icon={ReceiptLongRoundedIcon}
        badge={fines.length ? `${fines.length} khoản phạt` : undefined}
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setLoading(true);
                setRefresh((value) => value + 1);
              }}
            >
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Thẻ thống kê */}
      <StatCardGrid columns={{ xs: 1, sm: 3 }} sx={{ mb: 3 }}>
        <StatCard
          title="Tổng khoản phạt"
          value={loading || error ? "—" : summary.total}
          subtitle="Tất cả các khoản ghi nhận trong lịch sử"
          icon={ReceiptLongRoundedIcon}
          color="primary"
        />
        <StatCard
          title="Khoản còn nợ"
          value={loading || error ? "—" : summary.payable}
          subtitle="Số khoản cần hoàn tất thanh toán"
          icon={HourglassTopRoundedIcon}
          color="warning"
        />
        <StatCard
          title="Tổng tiền còn nợ"
          value={
            loading || error ? "—" : formatCurrencyVND(summary.outstanding)
          }
          subtitle="Số tiền phạt bạn cần thanh toán"
          icon={ErrorOutlineRoundedIcon}
          color={summary.outstanding > 0 ? "error" : "success"}
        />
      </StatCardGrid>

      {/* Thanh bộ lọc */}
      <SearchFilterBar
        showSearchButton={false}
        onReset={() => {
          setStatus("ALL");
          setType("ALL");
        }}
        filters={
          <>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="user-fine-status-label">
                Trạng thái phạt
              </InputLabel>
              <Select
                labelId="user-fine-status-label"
                label="Trạng thái phạt"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                {Object.entries(fineStatusLabels).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="user-fine-type-label">Loại vi phạm</InputLabel>
              <Select
                labelId="user-fine-type-label"
                label="Loại vi phạm"
                value={type}
                onChange={(e) => setType(e.target.value)}
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="ALL">Tất cả loại vi phạm</MenuItem>
                {Object.entries(fineTypeLabels).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        }
      />

      {/* Danh sách khoản phạt */}
      {loading ? (
        <Box
          sx={{
            py: 8,
            textAlign: "center",
            bgcolor: "#fff",
            borderRadius: 3,
            border: "1px solid #e2e8f0",
          }}
        >
          <CircularProgress size={30} />
          <Typography variant="body2" sx={{ mt: 1.5, color: "#64748b" }}>
            Đang tải dữ liệu tiền phạt...
          </Typography>
        </Box>
      ) : visibleFines.length === 0 ? (
        <EmptyState
          icon={ReceiptLongRoundedIcon}
          title="Không có khoản phạt nào"
          description={
            fines.length === 0
              ? "Tuyệt vời! Bạn không có bất kỳ khoản phí phạt nào chưa thanh toán."
              : "Không tìm thấy khoản phạt phù hợp với tiêu chí lọc của bạn."
          }
        />
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {visibleFines.map((fine) => {
            const outstanding = fineOutstanding(fine);
            return (
              <Paper
                key={fine.id}
                variant="outlined"
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: 3,
                  borderColor: "#e2e8f0",
                  bgcolor: "#fff",
                  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "#cbd5e1",
                    boxShadow: "0 6px 16px rgba(15,23,42,0.06)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: "#64748b" }}
                      >
                        Khoản phạt #{fine.id}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        •
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#1769ff", fontWeight: 600 }}
                      >
                        {fineTypeLabels[fine.type] || fine.type}
                      </Typography>
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 750, color: "#1e293b" }}
                    >
                      {fine.bookTitle || "Sách liên quan"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Lý do: {fine.reason || "Không có ghi chú lý do"} · Lập
                      ngày {formatDateVN(fine.createdAt)}
                    </Typography>
                  </Box>

                  <StatusChip type="fine" status={fine.status} />
                </Box>

                {/* Tiền phạt - Đã trả - Còn nợ */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", display: "block" }}
                    >
                      Tổng tiền phạt
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#1e293b" }}
                    >
                      {formatCurrencyVND(fine.amount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", display: "block" }}
                    >
                      Đã thanh toán
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#16a34a" }}
                    >
                      {formatCurrencyVND(fine.amountPaid)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", display: "block" }}
                    >
                      Số tiền còn nợ
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 750,
                        color:
                          outstanding > 0 ? "error.main" : "text.secondary",
                      }}
                    >
                      {formatCurrencyVND(outstanding)}
                    </Typography>
                  </Box>
                </Box>

                {/* Action buttons */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelected(fine)}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Xem chi tiết
                  </Button>
                  {canPayFine(fine) && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PaymentRoundedIcon />}
                      onClick={() => setPaymentInfo(fine)}
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 700,
                        px: 2.5,
                        boxShadow: "0 2px 8px rgba(23,105,255,0.25)",
                      }}
                    >
                      Thanh toán PayOS
                    </Button>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Dialog chi tiết khoản phạt */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
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
          <Box>
            <Typography variant="h6" fontWeight={750} sx={{ color: "#102d62" }}>
              Khoản phạt #{selected?.id}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Chi tiết công nợ và biên nhận
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setSelected(null)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selected && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <InfoItem label="Sách liên quan" value={selected.bookTitle} />
              <InfoItem label="Mã ISBN" value={selected.bookIsbn} />
              <InfoItem
                label="Mã lượt mượn"
                value={`#${selected.bookLoanId}`}
              />
              <InfoItem
                label="Loại vi phạm"
                value={fineTypeLabels[selected.type] || selected.type}
              />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#64748b",
                    fontWeight: 500,
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  Trạng thái
                </Typography>
                <StatusChip type="fine" status={selected.status} />
              </Box>
              <InfoItem
                label="Tổng tiền phạt"
                value={formatCurrencyVND(selected.amount)}
              />
              <InfoItem
                label="Đã thanh toán"
                value={formatCurrencyVND(selected.amountPaid)}
              />
              <InfoItem
                label="Số tiền còn nợ"
                value={formatCurrencyVND(fineOutstanding(selected))}
              />
              <InfoItem
                label="Ngày tạo"
                value={formatDateTimeVN(selected.createdAt)}
              />
              {selected.paidAt && (
                <InfoItem
                  label="Ngày trả đủ"
                  value={formatDateTimeVN(selected.paidAt)}
                />
              )}
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <InfoItem label="Lý do xử phạt" value={selected.reason} />
              </Box>
              {selected.notes && (
                <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                  <InfoItem label="Ghi chú" value={selected.notes} />
                </Box>
              )}
              {selected.status === "WAIVED" && (
                <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                  <InfoItem
                    label="Thông tin miễn nợ"
                    value={`${selected.waiverReason || "Miễn nợ"} · ${formatDateTimeVN(selected.waivedAt)}`}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setSelected(null)}
            sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
          >
            Đóng
          </Button>
          {selected && canPayFine(selected) && (
            <Button
              variant="contained"
              startIcon={<PaymentRoundedIcon />}
              onClick={() => {
                setPaymentInfo(selected);
                setSelected(null);
              }}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Thanh toán khoản này
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog mở đơn thanh toán PayOS */}
      <Dialog
        open={Boolean(paymentInfo)}
        onClose={() => {
          if (!paymentBusy) {
            setPaymentInfo(null);
            setPaymentError("");
          }
        }}
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
            Thanh toán khoản phạt #{paymentInfo?.id}
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              setPaymentInfo(null);
              setPaymentError("");
            }}
            disabled={paymentBusy}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5 }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Box
              sx={{
                p: 2,
                bgcolor: "#f8fafc",
                borderRadius: 2,
                border: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#64748b", display: "block" }}
              >
                Số tiền cần thanh toán
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: "#102d62", my: 0.5 }}
              >
                {paymentInfo
                  ? formatCurrencyVND(fineOutstanding(paymentInfo))
                  : "—"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#16a34a", fontWeight: 600 }}
              >
                Cổng thanh toán tự động PayOS (VietQR)
              </Typography>
            </Box>

            <Alert
              severity={paymentsEnabled ? "info" : "warning"}
              sx={{ borderRadius: 2, fontSize: "0.8125rem" }}
            >
              {paymentsEnabled
                ? "Hệ thống sẽ tạo mã QR thanh toán PayOS. Bạn có thể dùng ứng dụng ngân hàng bất kỳ để quét mã và chuyển tiền."
                : "Chế độ thanh toán PayOS đang tắt ở môi trường thử nghiệm."}
            </Alert>

            {paymentError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {paymentError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            disabled={paymentBusy}
            onClick={() => {
              setPaymentInfo(null);
              setPaymentError("");
            }}
            sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={!paymentsEnabled || paymentBusy}
            onClick={createPayment}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
            }}
          >
            {paymentBusy ? "Đang tạo mã QR…" : "Tạo mã QR PayOS"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinesPage;
