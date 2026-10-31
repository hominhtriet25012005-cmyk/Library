import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { Link, useLocation, useParams } from "react-router-dom";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";

import { paymentsApi } from "../../api/payments.js";
import { formatDateVN, formatCurrencyVND } from "../../utils/formatters.js";
import { paymentSession } from "./paymentSession.js";
import {
  paymentView,
  paymentsEnabled,
  readReturnOrderCode,
  validateSnapshot,
} from "./paymentRules.js";
import StatusChip from "../../components/common/StatusChip";

const PaymentDetails = ({ paymentId, returned }) => {
  const cached = paymentSession.get(paymentId);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(Boolean(paymentId));
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [reconciling, setReconciling] = useState(false);
  const reconcilingRef = useRef(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    if (!paymentId) return;
    const controller = new AbortController();
    const version = ++requestVersion.current;
    paymentsApi
      .status(paymentId, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted || version !== requestVersion.current)
          return;
        setSnapshot(validateSnapshot(result, paymentId));
        setError("");
      })
      .catch((failure) => {
        if (
          controller.signal.aborted ||
          version !== requestVersion.current ||
          failure.name === "AbortError"
        )
          return;
        setError(
          failure.message || "Không thể kiểm tra trạng thái thanh toán.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted && version === requestVersion.current)
          setLoading(false);
      });
    return () => controller.abort();
  }, [paymentId, refresh]);

  useEffect(() => {
    if (
      !paymentId ||
      error ||
      reconciling ||
      !snapshot ||
      paymentView(snapshot.status).terminal
    )
      return;
    const timer = window.setTimeout(
      () => setRefresh((value) => value + 1),
      6000,
    );
    return () => window.clearTimeout(timer);
  }, [paymentId, snapshot, error, refresh, reconciling]);

  const reconcile = async () => {
    if (!paymentsEnabled || !paymentId || reconcilingRef.current) return;
    reconcilingRef.current = true;
    const version = ++requestVersion.current;
    setReconciling(true);
    setError("");
    try {
      const result = await paymentsApi.reconcile(paymentId);
      if (version === requestVersion.current)
        setSnapshot(validateSnapshot(result, paymentId));
    } catch (failure) {
      if (version === requestVersion.current)
        setError(
          failure.message || "Chưa thể đối soát với payOS. Không tạo đơn mới.",
        );
    } finally {
      reconcilingRef.current = false;
      setReconciling(false);
    }
  };

  const view = snapshot ? paymentView(snapshot.status) : null;
  const source =
    snapshot?.fineId || cached?.kind === "fine"
      ? "/user/my-fines"
      : "/user/subscriptions";
  const matchingCache =
    snapshot && cached?.amount === Number(snapshot.amount) ? cached : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 4 },
        py: 6,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 680,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow:
            "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: "rgba(23, 105, 255, 0.1)",
              color: "#1769ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReceiptLongRoundedIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
              {returned
                ? "Kết quả giao dịch"
                : "Cổng thanh toán payOS / VietQR"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Giao dịch trực tuyến bảo mật tiêu chuẩn NAPAS 247
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {!paymentId ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Đường dẫn không có mã đơn hợp lệ. Vui lòng trở lại trang gói thành
            viên hoặc khoản phạt.
          </Alert>
        ) : (
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Mã đơn hàng:{" "}
                <strong style={{ color: "#0f172a" }}>#{paymentId}</strong>
              </Typography>
              {snapshot && (
                <StatusChip type="payment" status={snapshot.status} />
              )}
            </Box>

            {returned && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Bạn đã quay về từ payOS. Kết quả được kiểm tra và xác thực an
                toàn trực tiếp từ máy chủ thư viện.
              </Alert>
            )}

            {loading && !snapshot && (
              <Box
                role="status"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  py: 4,
                  color: "#64748b",
                }}
              >
                <CircularProgress size={24} />
                <Typography variant="body2">
                  Đang kiểm tra trạng thái thanh toán từ hệ thống...
                </Typography>
              </Box>
            )}

            {error && (
              <Alert
                severity="error"
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
                sx={{ borderRadius: 2 }}
              >
                {error}
              </Alert>
            )}

            {snapshot && (
              <>
                <Alert severity={view.severity} sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {view.label}
                    {!view.terminal &&
                      " — Hệ thống đang tự động cập nhật trạng thái; vui lòng không quét mã lần 2 trước khi đối soát."}
                  </Typography>
                </Alert>

                {/* THẺ TÓM TẮT ĐƠN HÀNG */}
                <Box
                  sx={{
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark" ? "#17243a" : "#f8fafc",
                    p: 2.5,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Số tiền thanh toán:
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 800, color: "#1769ff" }}
                    >
                      {formatCurrencyVND(snapshot.amount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Loại thanh toán:
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: "#0f172a" }}
                    >
                      {snapshot.fineId
                        ? "Thanh toán tiền phạt vi phạm"
                        : "Đăng ký gói thành viên độc giả"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Cổng thanh toán:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#334155" }}
                    >
                      payOS / VietQR Chuyển khoản nhanh
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Thời gian hoàn tất:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#334155" }}
                    >
                      {formatDateVN(snapshot.completedAt)}
                    </Typography>
                  </Box>
                </Box>

                {/* KHUNG HIỂN THỊ VIETQR */}
                {!view.terminal && matchingCache?.qrCode && (
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3.5,
                      border: (theme) =>
                        theme.palette.mode === "dark"
                          ? "1px dashed #2563eb"
                          : "1px dashed #93c5fd",
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(37, 99, 235, 0.12)"
                          : "#f0f7ff",
                      textAlign: "center",
                    }}
                    aria-label="Mã VietQR"
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: (theme) =>
                          theme.palette.mode === "dark" ? "#f8fafc" : "#0f172a",
                        mb: 0.5,
                      }}
                    >
                      Quét mã VietQR để thanh toán
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: (theme) =>
                          theme.palette.mode === "dark" ? "#94a3b8" : "#475569",
                        display: "block",
                        mb: 2,
                      }}
                    >
                      Sử dụng ứng dụng Ngân hàng (MB, Vietcombank,
                      Techcombank...) hoặc Ví điện tử để quét mã.
                    </Typography>

                    <Box
                      sx={{
                        display: "inline-block",
                        p: 2,
                        bgcolor: "#ffffff",
                        borderRadius: 3,
                        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      <QRCodeSVG
                        value={matchingCache.qrCode}
                        size={220}
                        level="M"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{ mt: 2, color: "#334155", fontWeight: 500 }}
                    >
                      Số tiền chính xác:{" "}
                      <strong>{formatCurrencyVND(snapshot.amount)}</strong> ·
                      Nội dung: <strong>#{paymentId}</strong>
                    </Typography>
                  </Box>
                )}

                {!view.terminal && matchingCache?.checkoutUrl && (
                  <Button
                    component="a"
                    href={matchingCache.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    fullWidth
                    endIcon={<OpenInNewRoundedIcon />}
                    sx={{
                      py: 1.2,
                      borderRadius: 2.5,
                      fontWeight: 700,
                      textTransform: "none",
                    }}
                  >
                    Mở cổng thanh toán payOS trên trình duyệt
                  </Button>
                )}

                {!view.terminal &&
                  !matchingCache?.checkoutUrl &&
                  !matchingCache?.qrCode && (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      Đơn hàng đã được khởi tạo trước đó. Nếu đã thực hiện
                      chuyển khoản, hãy nhấn "Kiểm tra trạng thái" hoặc "Đối
                      soát với payOS" để hoàn tất.
                    </Alert>
                  )}

                {!view.terminal && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      disabled={reconciling}
                      startIcon={<SyncRoundedIcon />}
                      onClick={() => setRefresh((value) => value + 1)}
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 2,
                      }}
                    >
                      Kiểm tra trạng thái
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      disabled={!paymentsEnabled || reconciling}
                      startIcon={<QrCodeScannerRoundedIcon />}
                      onClick={reconcile}
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 2,
                      }}
                    >
                      {reconciling ? "Đang đối soát..." : "Đối soát với payOS"}
                    </Button>
                  </Box>
                )}

                {!view.terminal && !paymentsEnabled && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#64748b",
                      textAlign: "center",
                      display: "block",
                    }}
                  >
                    Tính năng đối soát trực tiếp payOS đang tắt ở môi trường thử
                    nghiệm; kiểm tra trạng thái nội bộ vẫn hoạt động.
                  </Typography>
                )}

                {view.success && (
                  <Alert
                    severity="success"
                    icon={<CheckCircleRoundedIcon fontSize="inherit" />}
                    sx={{ borderRadius: 2 }}
                  >
                    Thanh toán thành công! Hệ thống đã ghi nhận khoản thanh
                    toán. Dữ liệu tài khoản của bạn đã được cập nhật.
                  </Alert>
                )}
              </>
            )}
          </Stack>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Button
            component={Link}
            to={source}
            startIcon={<ArrowBackRoundedIcon />}
            sx={{ textTransform: "none", fontWeight: 600, color: "#1769ff" }}
          >
            Quay lại{" "}
            {source.endsWith("my-fines")
              ? "danh sách tiền phạt"
              : "gói thành viên"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

const PaymentPage = ({ returned = false }) => {
  const { paymentId: pathId } = useParams();
  const location = useLocation();
  const paymentId = returned
    ? readReturnOrderCode(location.search)
    : readReturnOrderCode(`?orderCode=${pathId || ""}`);
  return (
    <PaymentDetails
      key={paymentId ?? "invalid"}
      paymentId={paymentId}
      returned={returned}
    />
  );
};

export default PaymentPage;
