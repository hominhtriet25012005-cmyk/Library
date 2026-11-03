import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import StarsRoundedIcon from "@mui/icons-material/StarsRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import QrCodeRoundedIcon from "@mui/icons-material/QrCodeRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import { subscriptionsApi } from "../../api/subscriptions.js";
import { formatDateVN, formatCurrencyVND } from "../../utils/formatters.js";
import { availablePlans, canCancelSubscription } from "./subscriptionRules.js";
import { useNavigate } from "react-router-dom";
import { paymentsApi } from "../../api/payments.js";
import { paymentSession } from "../Payments/paymentSession.js";
import { paymentsEnabled } from "../Payments/paymentRules.js";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

const getPlanTheme = (plan, index, total, isDark = false) => {
  const isFeatured =
    Boolean(plan.isFeatured) || (total === 3 && index === 1) || total === 1;

  if (isFeatured) {
    return {
      isFeatured: true,
      badgeText: plan.badgeText || "★ PHỔ BIẾN NHẤT",
      tagline: "Lựa chọn được ưa chuộng nhiều nhất",
      accentColor: "#8b5cf6",
      badgeBg: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
      badgeTextColor: "#ffffff",
      cardBorder: isDark ? "2px solid #a78bfa" : "2px solid #8b5cf6",
      cardBg: isDark
        ? "linear-gradient(180deg, #1e1b4b 0%, #111c2e 100%)"
        : "linear-gradient(180deg, #faf5ff 0%, #ffffff 100%)",
      cardShadow: isDark
        ? "0 20px 40px -8px rgba(0, 0, 0, 0.6)"
        : "0 20px 40px -8px rgba(124, 58, 237, 0.22)",
      hoverShadow: isDark
        ? "0 28px 50px -10px rgba(124, 58, 237, 0.5)"
        : "0 28px 50px -10px rgba(124, 58, 237, 0.35)",
      iconBg: isDark ? "rgba(167, 139, 250, 0.2)" : "rgba(124, 58, 237, 0.12)",
      iconColor: isDark ? "#c4b5fd" : "#7c3aed",
      priceColor: isDark ? "#c4b5fd" : "#6d28d9",
      checkIconBg: isDark
        ? "rgba(167, 139, 250, 0.2)"
        : "rgba(124, 58, 237, 0.12)",
      checkIconColor: isDark ? "#c4b5fd" : "#7c3aed",
      buttonVariant: "contained",
      buttonSx: {
        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
        color: "#ffffff",
        boxShadow: "0 8px 20px -4px rgba(124, 58, 237, 0.4)",
        "&:hover": {
          background: "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)",
          boxShadow: "0 10px 24px -2px rgba(124, 58, 237, 0.5)",
        },
      },
    };
  }

  if (index % 3 === 0) {
    return {
      isFeatured: false,
      badgeText: "TIẾT KIỆM & LINH HOẠT",
      tagline: "Khởi đầu lý tưởng cho bạn",
      accentColor: isDark ? "#38bdf8" : "#0284c7",
      badgeBg: isDark ? "rgba(2, 132, 199, 0.25)" : "#e0f2fe",
      badgeTextColor: isDark ? "#38bdf8" : "#0369a1",
      cardBorder: isDark ? "1px solid #1e3a5f" : "1px solid #bae6fd",
      cardBg: isDark
        ? "linear-gradient(180deg, #0d233a 0%, #111c2e 100%)"
        : "linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)",
      cardShadow: isDark
        ? "0 8px 25px -4px rgba(0, 0, 0, 0.4)"
        : "0 8px 25px -4px rgba(2, 132, 199, 0.1)",
      hoverShadow: isDark
        ? "0 18px 36px -6px rgba(2, 132, 199, 0.4)"
        : "0 18px 36px -6px rgba(2, 132, 199, 0.22)",
      iconBg: isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(2, 132, 199, 0.12)",
      iconColor: isDark ? "#38bdf8" : "#0284c7",
      priceColor: isDark ? "#38bdf8" : "#0369a1",
      checkIconBg: isDark
        ? "rgba(56, 189, 248, 0.2)"
        : "rgba(2, 132, 199, 0.12)",
      checkIconColor: isDark ? "#38bdf8" : "#0284c7",
      buttonVariant: "outlined",
      buttonSx: {
        borderColor: isDark ? "#38bdf8" : "#0284c7",
        color: isDark ? "#38bdf8" : "#0284c7",
        bgcolor: isDark ? "rgba(56, 189, 248, 0.1)" : "#ffffff",
        "&:hover": {
          borderColor: isDark ? "#7dd3fc" : "#0369a1",
          bgcolor: isDark
            ? "rgba(56, 189, 248, 0.2)"
            : "rgba(2, 132, 199, 0.08)",
        },
      },
    };
  }

  return {
    isFeatured: false,
    badgeText: "ĐẶC QUYỀN VIP CAO CẤP",
    tagline: "Tối ưu trọn vẹn cho nghiên cứu dài hạn",
    accentColor: isDark ? "#fbbf24" : "#d97706",
    badgeBg: isDark ? "rgba(217, 119, 6, 0.25)" : "#fef3c7",
    badgeTextColor: isDark ? "#fbbf24" : "#92400e",
    cardBorder: isDark ? "1px solid #4a3410" : "1px solid #fde68a",
    cardBg: isDark
      ? "linear-gradient(180deg, #261b0c 0%, #111c2e 100%)"
      : "linear-gradient(180deg, #fffbeb 0%, #ffffff 100%)",
    cardShadow: isDark
      ? "0 8px 25px -4px rgba(0, 0, 0, 0.4)"
      : "0 8px 25px -4px rgba(217, 119, 6, 0.12)",
    hoverShadow: isDark
      ? "0 18px 36px -6px rgba(217, 119, 6, 0.4)"
      : "0 18px 36px -6px rgba(217, 119, 6, 0.25)",
    iconBg: isDark ? "rgba(251, 191, 36, 0.2)" : "rgba(217, 119, 6, 0.12)",
    iconColor: isDark ? "#fbbf24" : "#d97706",
    priceColor: isDark ? "#fbbf24" : "#b45309",
    checkIconBg: isDark ? "rgba(251, 191, 36, 0.2)" : "rgba(217, 119, 6, 0.12)",
    checkIconColor: isDark ? "#fbbf24" : "#d97706",
    buttonVariant: "outlined",
    buttonSx: {
      borderColor: isDark ? "#fbbf24" : "#d97706",
      color: isDark ? "#fbbf24" : "#d97706",
      bgcolor: isDark ? "rgba(251, 191, 36, 0.1)" : "#ffffff",
      "&:hover": {
        borderColor: isDark ? "#fcd34d" : "#b45309",
        bgcolor: isDark ? "rgba(251, 191, 36, 0.2)" : "rgba(217, 119, 6, 0.08)",
      },
    },
  };
};

const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [plans, setPlans] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [activeError, setActiveError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const creatingPayment = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      subscriptionsApi.plans({ signal: controller.signal }),
      subscriptionsApi.active({ signal: controller.signal }),
    ]).then(([planResult, activeResult]) => {
      if (controller.signal.aborted) return;
      if (
        planResult.status === "fulfilled" &&
        Array.isArray(planResult.value)
      ) {
        setPlans(availablePlans(planResult.value));
        setPlansError("");
      } else {
        setPlans([]);
        setPlansError(
          planResult.status === "rejected" &&
            planResult.reason.name !== "AbortError"
            ? planResult.reason.message
            : "Dữ liệu gói thành viên không hợp lệ.",
        );
      }
      if (activeResult.status === "fulfilled") {
        setActive(activeResult.value);
        setActiveError("");
      } else if (activeResult.reason.status === 404) {
        setActive(null);
        setActiveError("");
      } else {
        setActive(null);
        setActiveError(
          activeResult.reason.name !== "AbortError"
            ? activeResult.reason.message
            : "Không thể tải gói đang dùng.",
        );
      }
      setLoading(false);
    });
    return () => controller.abort();
  }, [refresh]);

  const cancel = async () => {
    if (!canCancelSubscription(active)) return;
    setBusy(true);
    setActionError("");
    try {
      await subscriptionsApi.cancel(active.id, cancelReason.trim());
      setMessage(
        "Đã hủy gói. Quyền sử dụng gói dừng ngay; bạn có thể chọn gói mới.",
      );
      setCancelOpen(false);
      setCancelReason("");
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const createPayment = async () => {
    if (
      !paymentsEnabled ||
      !selectedPlan ||
      active ||
      activeError ||
      busy ||
      creatingPayment.current
    )
      return;
    creatingPayment.current = true;
    setBusy(true);
    setPaymentError("");
    try {
      const response = await paymentsApi.subscribe(selectedPlan.id);
      paymentSession.save(response, { kind: "membership" });
      navigate(`/user/payments/${response.paymentId}`);
    } catch (failure) {
      setPaymentError(
        failure.status === 409
          ? "Bạn đã có gói đang hoạt động. Tải lại trang để kiểm tra."
          : "Chưa thể mở đơn thanh toán. Nếu yêu cầu đã được gửi, không bấm tạo lại trước khi kiểm tra/đối soát. " +
              (failure.message || ""),
      );
    } finally {
      creatingPayment.current = false;
      setBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", pb: 6 }}>
      {/* HERO HEADER CĂN GIỮA - NỔI BẬT */}
      <Box
        sx={{
          textAlign: "center",
          pt: { xs: 2, sm: 3 },
          pb: { xs: 4, sm: 5 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Chip
          icon={
            <WorkspacePremiumRoundedIcon
              sx={{
                "&&": { color: isDark ? "#60a5fa" : "#1769ff", fontSize: 18 },
              }}
            />
          }
          label="ĐẶC QUYỀN ĐỘC GIẢ THƯ VIỆN"
          sx={{
            fontWeight: 700,
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            bgcolor: isDark
              ? "rgba(96, 165, 250, 0.16)"
              : "rgba(23, 105, 255, 0.08)",
            color: isDark ? "#93c5fd" : "#1769ff",
            border: "1px solid",
            borderColor: isDark
              ? "rgba(96, 165, 250, 0.3)"
              : "rgba(23, 105, 255, 0.2)",
            borderRadius: 99,
            px: 1,
            py: 2,
            mb: 2,
          }}
        />

        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "2rem", sm: "2.75rem", md: "3.25rem" },
            lineHeight: 1.2,
            color: isDark ? "#f8fafc" : "#0f172a",
            letterSpacing: "-0.03em",
            mb: 2,
            maxWidth: 820,
          }}
        >
          Gói thành viên độc giả
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{
            color: isDark ? "#94a3b8" : "#475569",
            fontSize: { xs: "1rem", sm: "1.15rem" },
            maxWidth: 700,
            mx: "auto",
            lineHeight: 1.6,
            mb: 2.5,
          }}
        >
          Nâng cấp quyền lợi mượn sách không giới hạn với chi phí tiết kiệm. Giá
          niêm yết bằng VND.
        </Typography>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => {
            setLoading(true);
            setRefresh((value) => value + 1);
          }}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 3,
            color: isDark ? "#cbd5e1" : "#64748b",
            borderColor: isDark ? "#334155" : "#cbd5e1",
            bgcolor: isDark ? "#111c2e" : "#ffffff",
            px: 2,
            py: 0.75,
            "&:hover": {
              borderColor: isDark ? "#60a5fa" : "#94a3b8",
              bgcolor: isDark ? "#17243a" : "#f8fafc",
            },
          }}
        >
          Làm mới dữ liệu
        </Button>
      </Box>

      {message && (
        <Alert
          severity="success"
          onClose={() => setMessage("")}
          sx={{ mb: 3, borderRadius: 3, border: "1px solid #bbf7d0" }}
        >
          {message}
        </Alert>
      )}

      {(plansError || activeError) && (
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
          sx={{ mb: 3, borderRadius: 3 }}
        >
          {[plansError, activeError].filter(Boolean).join(" ")}
        </Alert>
      )}

      {loading ? (
        <LoadingState message="Đang tải danh sách gói thành viên..." />
      ) : (
        <Stack spacing={4}>
          {/* THÔNG TIN GÓI ĐANG DÙNG */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: 4,
              border: "1px solid",
              borderColor: isDark
                ? active
                  ? "#3b82f6"
                  : "#24334a"
                : active
                  ? "#93c5fd"
                  : "#e2e8f0",
              background: isDark
                ? active
                  ? "linear-gradient(135deg, #132238 0%, #111c2e 100%)"
                  : "#111c2e"
                : active
                  ? "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)"
                  : "#ffffff",
              boxShadow: isDark
                ? active
                  ? "0 4px 20px -2px rgba(0, 0, 0, 0.4)"
                  : "0 1px 3px rgba(0, 0, 0, 0.3)"
                : active
                  ? "0 4px 20px -2px rgba(23, 105, 255, 0.08)"
                  : "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2.5,
                    bgcolor: isDark
                      ? active
                        ? "rgba(59, 130, 246, 0.2)"
                        : "rgba(148, 163, 184, 0.15)"
                      : active
                        ? "rgba(23, 105, 255, 0.12)"
                        : "rgba(100, 116, 139, 0.1)",
                    color: isDark
                      ? active
                        ? "#60a5fa"
                        : "#94a3b8"
                      : active
                        ? "#1769ff"
                        : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <WorkspacePremiumRoundedIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: isDark ? "#f8fafc" : "#0f172a",
                    }}
                  >
                    Gói thành viên hiện tại
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  >
                    {active
                      ? "Tài khoản đang có gói hiệu lực"
                      : "Chưa kích hoạt gói nào"}
                  </Typography>
                </Box>
              </Box>

              {active && (
                <Chip
                  icon={<CheckCircleRoundedIcon />}
                  label={
                    active.daysRemaining !== undefined &&
                    active.daysRemaining !== null
                      ? `Còn ${active.daysRemaining} ngày`
                      : "Đang hiệu lực"
                  }
                  color={
                    active.daysRemaining !== undefined &&
                    active.daysRemaining <= 3
                      ? "warning"
                      : "primary"
                  }
                  sx={{ fontWeight: 600, px: 0.5 }}
                />
              )}
            </Box>

            <Divider
              sx={{
                my: 2,
                borderColor: isDark
                  ? "#24334a"
                  : active
                    ? "#dbeafe"
                    : "#f1f5f9",
              }}
            />

            {activeError ? (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Chưa xác định được gói đang dùng. Hệ thống tạm khóa thao tác mua
                gói và hủy để tránh sai sót.
              </Alert>
            ) : !active ? (
              <Box sx={{ py: 2 }}>
                <Typography
                  variant="body1"
                  sx={{ color: isDark ? "#cbd5e1" : "#475569", mb: 1 }}
                >
                  Bạn chưa có gói thành viên hoạt động. Đăng ký ngay bên dưới để
                  tăng hạn mức mượn sách và thời gian lưu giữ!
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", md: "center" },
                  gap: 3,
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                    flex: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <StarsRoundedIcon
                      sx={{ color: isDark ? "#60a5fa" : "#1769ff" }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: isDark ? "#94a3b8" : "#64748b" }}
                      >
                        Tên gói
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: isDark ? "#f8fafc" : "#0f172a",
                        }}
                      >
                        {active.planName || "Gói thành viên"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CalendarTodayRoundedIcon
                      sx={{ color: isDark ? "#60a5fa" : "#1769ff" }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: isDark ? "#94a3b8" : "#64748b" }}
                      >
                        Thời hạn sử dụng
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isDark ? "#f1f5f9" : "#1e293b",
                        }}
                      >
                        {formatDateVN(active.startDate)} –{" "}
                        {formatDateVN(active.endDate)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <AutoStoriesRoundedIcon
                      sx={{ color: isDark ? "#60a5fa" : "#1769ff" }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: isDark ? "#94a3b8" : "#64748b" }}
                      >
                        Hạn mức sách cùng lúc
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isDark ? "#f1f5f9" : "#1e293b",
                        }}
                      >
                        Tối đa <strong>{active.maxBooksAllowed}</strong> cuốn
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <AccessTimeRoundedIcon
                      sx={{ color: isDark ? "#60a5fa" : "#1769ff" }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: isDark ? "#94a3b8" : "#64748b" }}
                      >
                        Thời gian mượn tối đa
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isDark ? "#f1f5f9" : "#1e293b",
                        }}
                      >
                        <strong>{active.maxDaysPerBook}</strong> ngày / mỗi cuốn
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {canCancelSubscription(active) && (
                  <Button
                    color="error"
                    variant="outlined"
                    size="small"
                    startIcon={<CancelRoundedIcon />}
                    onClick={() => {
                      setActionError("");
                      setCancelOpen(true);
                    }}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      alignSelf: { xs: "stretch", md: "center" },
                    }}
                  >
                    Hủy gói này
                  </Button>
                )}
              </Box>
            )}
          </Paper>

          {/* DANH SÁCH GÓI HIỆN CÓ */}
          <Box>
            <Box sx={{ textAlign: "center", mb: 4, mt: 1 }}>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontWeight: 800,
                  color: isDark ? "#f8fafc" : "#0f172a",
                  fontSize: { xs: "1.5rem", sm: "1.85rem" },
                  letterSpacing: "-0.02em",
                  mb: 1,
                }}
              >
                Các gói thành viên mở bán
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: isDark ? "#94a3b8" : "#64748b",
                  maxWidth: 540,
                  mx: "auto",
                }}
              >
                Đầu tư cho tri thức với mức giá tối ưu nhất – Chọn gói phù hợp
                với lộ trình học tập của bạn
              </Typography>
            </Box>

            {!plansError && plans.length === 0 ? (
              <EmptyState
                title="Chưa có gói thành viên"
                message="Hiện tại thư viện chưa mở bán gói thành viên nào. Vui lòng quay lại sau."
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  },
                  gap: 3.5,
                  alignItems: "stretch",
                }}
              >
                {plans.map((plan, index) => {
                  const planTheme = getPlanTheme(
                    plan,
                    index,
                    plans.length,
                    isDark,
                  );

                  return (
                    <Paper
                      key={plan.id}
                      elevation={0}
                      sx={{
                        p: { xs: 3, sm: 3.5 },
                        borderRadius: 4.5,
                        border: planTheme.cardBorder,
                        background: planTheme.cardBg,
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: planTheme.cardShadow,
                        transform: planTheme.isFeatured
                          ? { lg: "scale(1.025)" }
                          : "none",
                        zIndex: planTheme.isFeatured ? 2 : 1,
                        "&:hover": {
                          transform: planTheme.isFeatured
                            ? {
                                lg: "scale(1.04) translateY(-4px)",
                                xs: "translateY(-4px)",
                              }
                            : "translateY(-4px)",
                          boxShadow: planTheme.hoverShadow,
                        },
                      }}
                    >
                      {/* Header của từng thẻ gói */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            bgcolor: planTheme.iconBg,
                            color: planTheme.iconColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 4px 12px ${planTheme.iconBg}`,
                          }}
                        >
                          <WorkspacePremiumRoundedIcon fontSize="medium" />
                        </Box>

                        <Chip
                          size="small"
                          label={planTheme.badgeText}
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            letterSpacing: "0.04em",
                            borderRadius: 99,
                            background: planTheme.badgeBg,
                            color: planTheme.badgeTextColor,
                            px: 1,
                            py: 1.8,
                            border: planTheme.isFeatured
                              ? "none"
                              : `1px solid ${planTheme.cardBorder}`,
                            boxShadow: planTheme.isFeatured
                              ? "0 4px 12px rgba(124, 58, 237, 0.3)"
                              : "none",
                          }}
                        />
                      </Box>

                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          color: isDark ? "#f8fafc" : "#0f172a",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {plan.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: isDark ? "#94a3b8" : "#64748b",
                          fontWeight: 600,
                          mt: 0.5,
                          display: "block",
                        }}
                      >
                        {planTheme.tagline}
                      </Typography>

                      {/* Giá tiền */}
                      <Box
                        sx={{
                          my: 2.5,
                          pb: 1,
                          borderBottom: isDark
                            ? "1px dashed #24334a"
                            : "1px dashed #e2e8f0",
                        }}
                      >
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 900,
                            color: planTheme.priceColor,
                            lineHeight: 1.1,
                            letterSpacing: "-0.03em",
                          }}
                        >
                          {formatCurrencyVND(plan.price)}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: isDark ? "#94a3b8" : "#64748b",
                            mt: 0.75,
                            fontWeight: 500,
                          }}
                        >
                          Thời hạn sử dụng:{" "}
                          <strong>{plan.durationDays} ngày</strong>
                        </Typography>
                      </Box>

                      {/* Mô tả */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: isDark ? "#cbd5e1" : "#475569",
                          flex: 1,
                          minHeight: 44,
                          whiteSpace: "pre-line",
                          mb: 2.5,
                          lineHeight: 1.55,
                        }}
                      >
                        {plan.description ||
                          "Quyền lợi mượn sách không giới hạn theo hạn mức gói."}
                      </Typography>

                      <Divider
                        sx={{
                          mb: 2.5,
                          borderColor: isDark ? "#24334a" : "#f1f5f9",
                        }}
                      />

                      {/* Danh sách quyền lợi */}
                      <Stack spacing={1.5} sx={{ mb: 3.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                          }}
                        >
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              bgcolor: planTheme.checkIconBg,
                              color: planTheme.checkIconColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <CheckRoundedIcon sx={{ fontSize: 15 }} />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ color: isDark ? "#e2e8f0" : "#1e293b" }}
                          >
                            Tối đa <strong>{plan.maxBooksAllowed}</strong> cuốn
                            cùng lúc
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                          }}
                        >
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              bgcolor: planTheme.checkIconBg,
                              color: planTheme.checkIconColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <CheckRoundedIcon sx={{ fontSize: 15 }} />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ color: isDark ? "#e2e8f0" : "#1e293b" }}
                          >
                            Mượn tối đa <strong>{plan.maxDaysPerBook}</strong>{" "}
                            ngày / mỗi cuốn
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                          }}
                        >
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              bgcolor: planTheme.checkIconBg,
                              color: planTheme.checkIconColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <CheckRoundedIcon sx={{ fontSize: 15 }} />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ color: isDark ? "#e2e8f0" : "#1e293b" }}
                          >
                            Gia hạn online trực tiếp & ưu tiên giữ sách
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Nút hành động */}
                      <Button
                        variant={planTheme.buttonVariant}
                        fullWidth
                        disabled={Boolean(active) || Boolean(activeError)}
                        onClick={() => {
                          setPaymentError("");
                          setSelectedPlan(plan);
                        }}
                        sx={{
                          mt: "auto",
                          py: 1.3,
                          borderRadius: 3,
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          textTransform: "none",
                          transition: "all 0.2s ease",
                          ...planTheme.buttonSx,
                          ...(Boolean(active) && {
                            bgcolor: isDark
                              ? "#17243a !important"
                              : "#f1f5f9 !important",
                            color: isDark
                              ? "#64748b !important"
                              : "#94a3b8 !important",
                            borderColor: isDark
                              ? "#24334a !important"
                              : "#e2e8f0 !important",
                            boxShadow: "none !important",
                          }),
                        }}
                      >
                        {active ? "Đang có gói hoạt động" : "Đăng ký gói này"}
                      </Button>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Box>
        </Stack>
      )}

      {/* DIALOG XÁC NHẬN MỞ ĐƠN PAYOS */}
      <Dialog
        open={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3.5,
              p: 1,
              bgcolor: "background.paper",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            pb: 1,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: isDark ? "#f8fafc" : "#0f172a",
          }}
        >
          <QrCodeRoundedIcon sx={{ color: isDark ? "#60a5fa" : "#1769ff" }} />
          Xác nhận mua gói: {selectedPlan?.name}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              p: 2,
              bgcolor: isDark ? "#17243a" : "#f8fafc",
              borderRadius: 2.5,
              mb: 2,
              border: isDark ? "1px solid #24334a" : "none",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 0.5 }}
            >
              Chi tiết giao dịch:
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: isDark ? "#f8fafc" : "#0f172a",
              }}
            >
              Gói {selectedPlan?.durationDays} ngày · Giá:{" "}
              {selectedPlan ? formatCurrencyVND(selectedPlan.price) : "—"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: isDark ? "#cbd5e1" : "#475569" }}
            >
              Hạn mức: {selectedPlan?.maxBooksAllowed} sách cùng lúc,{" "}
              {selectedPlan?.maxDaysPerBook} ngày mỗi cuốn.
            </Typography>
          </Box>

          <Alert
            severity={paymentsEnabled ? "info" : "warning"}
            icon={<InfoOutlinedIcon />}
            sx={{ borderRadius: 2, mb: paymentError ? 2 : 0 }}
          >
            {paymentsEnabled
              ? "Hệ thống sẽ tạo đơn thanh toán payOS bảo mật với số tiền chính xác. Mã VietQR sẽ được cấp ngay sau đó."
              : "Tính năng thanh toán payOS đang tạm tắt ở môi trường này. Chưa có mã QR hoặc giao dịch nào được tạo."}
          </Alert>

          {paymentError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {paymentError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            disabled={busy}
            onClick={() => {
              setSelectedPlan(null);
              setPaymentError("");
            }}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: isDark ? "#cbd5e1" : "#64748b",
            }}
          >
            Đóng
          </Button>
          <Button
            variant="contained"
            disabled={!paymentsEnabled || busy}
            onClick={createPayment}
            startIcon={<QrCodeRoundedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2.5,
              px: 3,
            }}
          >
            {busy ? "Đang tạo đơn..." : "Tạo mã QR payOS"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG XÁC NHẬN HỦY GÓI */}
      <Dialog
        open={cancelOpen}
        onClose={busy ? undefined : () => setCancelOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3.5,
              p: 1,
              bgcolor: "background.paper",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: "#dc2626",
            pb: 1,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <CancelRoundedIcon />
          Xác nhận hủy gói thành viên?
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
            Quyền mượn sách theo gói sẽ <strong>dừng ngay lập tức</strong> khi
            hủy, kể cả khi gói vẫn còn ngày sử dụng. Hệ thống không tự hoàn
            tiền. Sau khi hủy, bạn có thể tự do đăng ký gói mới.
          </Alert>
          <TextField
            fullWidth
            label="Lý do hủy gói (không bắt buộc)"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            multiline
            rows={3}
            placeholder="Ví dụ: Thay đổi nhu cầu sử dụng sách..."
          />
          {actionError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {actionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            disabled={busy}
            onClick={() => setCancelOpen(false)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: isDark ? "#cbd5e1" : "#64748b",
            }}
          >
            Giữ gói
          </Button>
          <Button
            disabled={busy}
            color="error"
            variant="contained"
            onClick={cancel}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2.5,
              px: 2.5,
            }}
          >
            {busy ? "Đang xử lý..." : "Xác nhận hủy"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionsPage;
