import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import LocalLibraryRoundedIcon from "@mui/icons-material/LocalLibraryRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { adminDashboardApi } from "../../api/adminDashboard";
import { adminNavigationSections } from "./adminNavigation";

const shortcutPaths = new Set([
  "/admin/books", "/admin/loans", "/admin/reservations",
  "/admin/subscriptions", "/admin/fines", "/admin/payments",
]);
const shortcuts = adminNavigationSections.flatMap((section) => section.items)
  .filter((item) => shortcutPaths.has(item.path));

const StatCard = ({ title, value, detail, icon }) => (
  <Paper variant="outlined" sx={{ p: 3, borderColor: "#dce7f8", borderRadius: 3, bgcolor: "white", minHeight: 158 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
      <Box>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>{title}</Typography>
        <Typography variant="h3" sx={{ fontWeight: 800, color: "#173d80", lineHeight: 1.1 }}>{value === null ? "—" : value.toLocaleString("vi-VN")}</Typography>
      </Box>
      <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: "#e8f0ff", color: "#1769ff", display: "grid", placeItems: "center" }}>
        {icon}
      </Box>
    </Box>
    <Typography color="text.secondary" variant="caption" sx={{ display: "block", mt: 2 }}>{detail}</Typography>
  </Paper>
);

const AdminDashboard = () => {
  const [reload, setReload] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [loanState, setLoanState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    adminDashboardApi.bookStats({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setState({ loading: false, data, error: "" }); })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setState({ loading: false, data: null, error: error.message || "Không thể tải thống kê sách." });
        }
      });
    adminDashboardApi.loanSummary({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setLoanState({ loading: false, data, error: "" }); })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setLoanState({ loading: false, data: null, error: error.message || "Không thể tải thống kê mượn sách." });
        }
      });
    return () => controller.abort();
  }, [reload]);

  const retry = () => {
    setState({ loading: true, data: null, error: "" });
    setLoanState({ loading: true, data: null, error: "" });
    setReload((value) => value + 1);
  };

  return (
    <Box component="section" aria-label="Dashboard quản trị" sx={{ maxWidth: 1120, mx: "auto", py: { xs: 3, sm: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="overline" sx={{ color: "#1769ff", fontWeight: 800, letterSpacing: 1.2 }}>ADMIN</Typography>
        <Chip label="AD1" size="small" color="primary" variant="outlined" />
      </Stack>
      <Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: "#172b4d", mb: 1 }}>Tổng quan thư viện</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Số liệu sách và lượt mượn được lấy trực tiếp từ hệ thống; các chức năng khác truy cập qua lối tắt bên dưới.
      </Typography>

      {state.error && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" onClick={retry}>Thử lại</Button>}>
          Không thể tải thống kê sách: {state.error}
        </Alert>
      )}
      {loanState.error && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" onClick={retry}>Thử lại</Button>}>
          Không thể tải thống kê mượn sách: {loanState.error}
        </Alert>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 1.5 }}>
        {state.loading ? <Skeleton role="status" aria-label="Đang tải tổng đầu sách" variant="rounded" height={158} sx={{ borderRadius: 3 }} />
          : <StatCard title="Đầu sách đang hiển thị" value={state.data?.totalActiveBooks ?? null} detail={state.error ? "Chưa tải được số liệu" : "Đầu sách có trạng thái hoạt động"} icon={<AutoStoriesRoundedIcon />} />}
        {state.loading ? <Skeleton role="status" aria-label="Đang tải đầu sách còn bản" variant="rounded" height={158} sx={{ borderRadius: 3 }} />
          : <StatCard title="Đầu sách còn bản" value={state.data?.totalAvailableBooks ?? null} detail={state.error ? "Chưa tải được số liệu" : "Đầu sách hoạt động có ít nhất một bản sẵn"} icon={<LibraryBooksRoundedIcon />} />}
        {loanState.loading ? <Skeleton role="status" aria-label="Đang tải tổng lượt mượn" variant="rounded" height={158} sx={{ borderRadius: 3 }} />
          : <StatCard title="Tổng lượt mượn" value={loanState.data?.totalLoans ?? null} detail={loanState.error ? "Chưa tải được số liệu" : "Bao gồm cả lịch sử đã trả"} icon={<LocalLibraryRoundedIcon />} />}
        {loanState.loading ? <Skeleton role="status" aria-label="Đang tải lượt quá hạn" variant="rounded" height={158} sx={{ borderRadius: 3 }} />
          : <StatCard title="Đang quá hạn" value={loanState.data?.overdueLoans ?? null} detail={loanState.error ? "Chưa tải được số liệu" : "Chưa trả và đã qua ngày hạn"} icon={<EventBusyRoundedIcon />} />}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 3 }}>
        Nguồn: GET /api/books/stats và totalElements từ POST /api/book-loans/search. Số sách là số đầu sách, không phải tổng số bản.
      </Typography>
      {state.data?.totalActiveBooks === 0 && <Alert severity="info" sx={{ mb: 3 }}>Hiện chưa có đầu sách hoạt động.</Alert>}
      {loanState.data?.totalLoans === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>Hiện chưa có lượt mượn nào.</Alert>
      )}

      <Paper variant="outlined" sx={{ borderColor: "#dce7f8", borderRadius: 3, p: { xs: 2.5, sm: 3 }, bgcolor: "white", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Lối tắt quản trị</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Các trang nghiệp vụ sẽ được nối dữ liệu lần lượt ở AD2–AD8.
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
          {shortcuts.map((item) => (
            <Button
              key={item.path}
              component={RouterLink}
              to={item.path}
              variant="outlined"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{ justifyContent: "space-between", textAlign: "left", textTransform: "none", borderColor: "#dce7f8", color: "#173d80", p: 1.5 }}
            >
              <span>{item.title} · {item.stage}</span>
            </Button>
          ))}
        </Box>
      </Paper>

      <Typography color="text.secondary" variant="body2">
        Tổng người dùng, tiền phạt và doanh thu chưa hiển thị vì Dashboard chưa có API tổng hợp đã nghiệm thu cho các chỉ số đó.
      </Typography>
    </Box>
  );
};

export default AdminDashboard;
