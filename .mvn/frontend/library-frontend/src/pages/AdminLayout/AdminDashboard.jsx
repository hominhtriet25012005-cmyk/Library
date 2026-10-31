import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import LocalLibraryRoundedIcon from "@mui/icons-material/LocalLibraryRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";

import { adminDashboardApi } from "../../api/adminDashboard";
import { PageHeader, StatCard, StatCardGrid } from "../../components/common";

const shortcutIcons = {
  "/admin/books": <AutoStoriesRoundedIcon />,
  "/admin/genres": <CategoryRoundedIcon />,
  "/admin/users": <PeopleRoundedIcon />,
  "/admin/loans": <LocalLibraryRoundedIcon />,
  "/admin/reservations": <EventAvailableRoundedIcon />,
  "/admin/subscriptions": <WorkspacePremiumRoundedIcon />,
  "/admin/fines": <ReceiptLongRoundedIcon />,
  "/admin/payments": <PaymentsRoundedIcon />,
  "/admin/reviews": <RateReviewRoundedIcon />,
};

const shortcuts = [
  {
    title: "Quản lý sách",
    description: "Tra cứu, thêm/sửa và quản lý trạng thái đầu sách",
    path: "/admin/books",
    color: "#1769ff",
  },
  {
    title: "Mượn – trả sách",
    description: "Cấp sách tại quầy, xử lý trả, gia hạn và cập nhật quá hạn",
    path: "/admin/loans",
    color: "#0284c7",
  },
  {
    title: "Đặt giữ sách",
    description: "Theo dõi danh sách đặt trước, hàng đợi và xác nhận giao",
    path: "/admin/reservations",
    color: "#d97706",
  },
  {
    title: "Gói thành viên",
    description: "Quản lý các gói đăng ký mượn và danh sách hội viên",
    path: "/admin/subscriptions",
    color: "#16a34a",
  },
  {
    title: "Quản lý tiền phạt",
    description: "Theo dõi các khoản phạt trễ hạn, hư hỏng và miễn nợ",
    path: "/admin/fines",
    color: "#dc2626",
  },
  {
    title: "Thanh toán & Đối soát",
    description:
      "Tra cứu giao dịch và đối soát thanh toán trực tuyến qua payOS",
    path: "/admin/payments",
    color: "#7c3aed",
  },
];

const AdminDashboard = () => {
  const [reload, setReload] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [loanState, setLoanState] = useState({
    loading: true,
    data: null,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    adminDashboardApi
      .bookStats({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ loading: false, data, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setState({
            loading: false,
            data: null,
            error: error.message || "Không thể tải thống kê sách.",
          });
        }
      });

    adminDashboardApi
      .loanSummary({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setLoanState({ loading: false, data, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setLoanState({
            loading: false,
            data: null,
            error: error.message || "Không thể tải thống kê mượn sách.",
          });
        }
      });

    return () => controller.abort();
  }, [reload]);

  const retry = () => {
    setState({ loading: true, data: null, error: "" });
    setLoanState({ loading: true, data: null, error: "" });
    setReload((value) => value + 1);
  };

  const totalActive = state.data?.totalActiveBooks ?? 0;
  const totalAvailable = state.data?.totalAvailableBooks ?? 0;
  const availabilityRate =
    totalActive > 0 ? Math.round((totalAvailable / totalActive) * 100) : 0;

  return (
    <Box
      component="section"
      aria-label="Dashboard quản trị"
      sx={{ maxWidth: 1240, mx: "auto", py: { xs: 2.5, sm: 3.5 } }}
    >
      <PageHeader
        title="Tổng quan thư viện"
        subtitle="Số liệu vận hành đầu sách, lượt mượn và các lối tắt quản trị nghiệp vụ."
      />

      {state.error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={retry}>
              Thử lại
            </Button>
          }
        >
          Không thể tải thống kê sách: {state.error}
        </Alert>
      )}

      {loanState.error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={retry}>
              Thử lại
            </Button>
          }
        >
          Không thể tải thống kê mượn sách: {loanState.error}
        </Alert>
      )}

      {/* Thẻ thống kê 4 ô chính */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Đầu sách đang hiển thị"
          value={state.data?.totalActiveBooks?.toLocaleString("vi-VN") ?? null}
          detail="Các đầu sách đang ở trạng thái hoạt động"
          icon={<AutoStoriesRoundedIcon />}
          color="#1769ff"
          loading={state.loading}
        />
        <StatCard
          title="Đầu sách còn bản"
          value={
            state.data?.totalAvailableBooks?.toLocaleString("vi-VN") ?? null
          }
          detail="Đầu sách có ít nhất một bản sẵn sàng cho mượn"
          icon={<LibraryBooksRoundedIcon />}
          color="#16a34a"
          loading={state.loading}
        />
        <StatCard
          title="Tổng lượt mượn"
          value={loanState.data?.totalLoans?.toLocaleString("vi-VN") ?? null}
          detail="Bao gồm cả các lượt mượn đã hoàn tất trả"
          icon={<LocalLibraryRoundedIcon />}
          color="#0284c7"
          loading={loanState.loading}
        />
        <StatCard
          title="Lượt mượn quá hạn"
          value={loanState.data?.overdueLoans?.toLocaleString("vi-VN") ?? null}
          detail="Chưa trả và đã quá thời hạn quy định"
          icon={<EventBusyRoundedIcon />}
          color="#dc2626"
          loading={loanState.loading}
        />
      </StatCardGrid>

      {/* Widget Tỷ lệ sẵn sàng phục vụ sách */}
      {!state.loading && state.data && (
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            bgcolor: "#ffffff",
            borderColor: "#e2e8f0",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ sm: "center" }}
            spacing={1}
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "#102d62" }}
              >
                Tỷ lệ sẵn sàng phục vụ sách
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalAvailable} trên {totalActive} đầu sách hiện có bản sẵn tại
                thư viện
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#16a34a" }}>
              {availabilityRate}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={availabilityRate}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "#f1f5f9",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                bgcolor: availabilityRate > 50 ? "#16a34a" : "#d97706",
              },
            }}
          />
        </Paper>
      )}

      {/* Lối tắt quản trị */}
      <Paper
        variant="outlined"
        sx={{
          borderColor: "#e2e8f0",
          borderRadius: 3,
          p: { xs: 2.5, sm: 3 },
          bgcolor: "#ffffff",
          mb: 3,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#102d62" }}>
            Lối tắt nghiệp vụ
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Truy cập nhanh vào các phân hệ quản lý chính của thư viện
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {shortcuts.map((item) => (
            <Paper
              key={item.path}
              component={RouterLink}
              to={item.path}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2.5,
                textDecoration: "none",
                borderColor: "#e2e8f0",
                bgcolor: "#ffffff",
                transition: "all 0.2s ease-in-out",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 1.5,
                "&:hover": {
                  borderColor: item.color,
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: `${item.color}14`,
                    color: item.color,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    "& svg": { fontSize: 20 },
                  }}
                >
                  {shortcutIcons[item.path]}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: "#0f172a" }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  color: item.color,
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  pt: 0.5,
                }}
              >
                <span>Mở trang</span>
                <ArrowForwardRoundedIcon sx={{ fontSize: 16, ml: 0.5 }} />
              </Box>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
