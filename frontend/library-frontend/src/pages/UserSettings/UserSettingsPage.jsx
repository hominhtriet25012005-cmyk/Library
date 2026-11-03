import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useUserSettings } from "../../settings/useUserSettings";

export const UserSettingsPage = () => {
  const { settings, updateSettings, resetSettings, clearHistory } =
    useUserSettings();

  const [activeTab, setActiveTab] = useState("notifications");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const handleToggle = (group, key) => {
    updateSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: !prev[group][key],
      },
    }));
    setToast({
      open: true,
      message: "Đã lưu cài đặt tự động!",
      severity: "success",
    });
  };

  const handleConfirmReset = () => {
    resetSettings();
    setResetDialogOpen(false);
    setToast({
      open: true,
      message: "Đã khôi phục cài đặt về mặc định ban đầu!",
      severity: "info",
    });
  };

  const handleConfirmClearHistory = () => {
    clearHistory();
    setClearHistoryDialogOpen(false);
    setToast({
      open: true,
      message: "Đã xóa sạch lịch sử tìm kiếm trên thiết bị này!",
      severity: "success",
    });
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", pb: 6 }}>
      {/* HEADER GỌN GÀNG */}
      <PageHeader
        title="Cài đặt"
        subtitle="Quản lý tùy chọn thông báo mượn trả và trải nghiệm đọc sách của bạn"
      />

      {/* THẺ CÀI ĐẶT DUY NHẤT (APPLE / NOTION STYLE) */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3.5,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {/* THANH CHUYỂN TAB VIÊN THUỐC (SEGMENTED CONTROL) */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="fullWidth"
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "#17243a" : "#f1f5f9",
              p: 0.6,
              borderRadius: "14px",
              minHeight: 46,
              "& .MuiTabs-indicator": { display: "none" },
            }}
          >
            <Tab
              value="notifications"
              label="Thông báo mượn trả"
              icon={<NotificationsActiveRoundedIcon sx={{ fontSize: 19 }} />}
              iconPosition="start"
              sx={{
                minHeight: 38,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "text.secondary",
                transition: "all 0.2s ease",
                "&.Mui-selected": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "#0f172a" : "#ffffff",
                  color: "primary.main",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 2px 8px rgba(0,0,0,0.4)"
                      : "0 2px 8px rgba(0,0,0,0.06)",
                },
              }}
            />
            <Tab
              value="privacy"
              label="Quyền riêng tư & Đọc sách"
              icon={<SecurityRoundedIcon sx={{ fontSize: 19 }} />}
              iconPosition="start"
              sx={{
                minHeight: 38,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "text.secondary",
                transition: "all 0.2s ease",
                "&.Mui-selected": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "#0f172a" : "#ffffff",
                  color: "primary.main",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 2px 8px rgba(0,0,0,0.4)"
                      : "0 2px 8px rgba(0,0,0,0.06)",
                },
              }}
            />
          </Tabs>
        </Box>

        {/* TAB 1: THÔNG BÁO MƯỢN TRẢ */}
        {activeTab === "notifications" && (
          <Stack spacing={2.5}>
            {/* 1. Nhắc hẹn trả sách */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ pr: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.925rem" }}>
                  Nhắc hẹn trả sách sắp đến hạn
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.825rem", mt: 0.25 }}>
                  Tự động nhận email nhắc nhở trước ngày đến hạn trả sách mượn
                </Typography>
              </Box>
              <Switch
                checked={Boolean(settings.notifications?.dueReminder)}
                onChange={() => handleToggle("notifications", "dueReminder")}
                color="primary"
              />
            </Stack>

            <Divider />

            {/* 2. Sách đặt trước đã có sẵn */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ pr: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.925rem" }}>
                  Sách đặt trước đã sẵn sàng tại quầy
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.825rem", mt: 0.25 }}>
                  Thông báo ngay khi đầu sách bạn giữ chỗ đã được trả về thư viện
                </Typography>
              </Box>
              <Switch
                checked={Boolean(settings.notifications?.reservationAlert)}
                onChange={() => handleToggle("notifications", "reservationAlert")}
                color="primary"
              />
            </Stack>

            <Divider />

            {/* 3. Cảnh báo quá hạn & tiền phạt */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ pr: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.925rem" }}>
                  Cảnh báo mượn quá hạn & Tiền phạt
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.825rem", mt: 0.25 }}>
                  Nhận cảnh báo khẩn khi có sách mượn quá hạn hoặc phát sinh phí phạt
                </Typography>
              </Box>
              <Switch
                checked={Boolean(settings.notifications?.overdueAlert)}
                onChange={() => handleToggle("notifications", "overdueAlert")}
                color="primary"
              />
            </Stack>

            <Divider />

            {/* 4. Bản tin sách mới */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ pr: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.925rem" }}>
                  Bản tin sách mới cập nhật
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.825rem", mt: 0.25 }}>
                  Nhận email giới thiệu các tựa sách mới nhập và sự kiện thư viện
                </Typography>
              </Box>
              <Switch
                checked={Boolean(settings.notifications?.newsletter)}
                onChange={() => handleToggle("notifications", "newsletter")}
                color="primary"
              />
            </Stack>
          </Stack>
        )}

        {/* TAB 2: QUYỀN RIÊNG TƯ & ĐỌC SÁCH */}
        {activeTab === "privacy" && (
          <Stack spacing={2.5}>
            {/* 1. Đánh giá ẩn danh */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ pr: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.925rem" }}>
                  Ẩn danh khi viết nhận xét sách
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.825rem", mt: 0.25 }}>
                  Tên của bạn sẽ hiển thị là "Độc giả ẩn danh" trong mục đánh giá cộng đồng
                </Typography>
              </Box>
              <Switch
                checked={Boolean(settings.privacy?.anonymousReview)}
                onChange={() => handleToggle("privacy", "anonymousReview")}
                color="primary"
              />
            </Stack>

            <Divider />

            {/* 2. Lưu lịch sử tìm kiếm */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ pr: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.925rem" }}>
                  Lưu lịch sử tra cứu sách
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.825rem", mt: 0.25 }}>
                  Ghi nhớ các từ khóa bạn đã tìm kiếm để gợi ý tra cứu nhanh hơn
                </Typography>
              </Box>
              <Switch
                checked={Boolean(settings.privacy?.saveSearchHistory)}
                onChange={() => handleToggle("privacy", "saveSearchHistory")}
                color="primary"
              />
            </Stack>

            <Divider />

            {/* 3. Nút xóa lịch sử tìm kiếm */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1.5}
              sx={{
                p: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(220, 38, 38, 0.12)"
                    : "#fef2f2",
                borderRadius: 2.5,
                border: (theme) =>
                  theme.palette.mode === "dark"
                    ? "1px dashed rgba(248, 113, 113, 0.3)"
                    : "1px dashed #fecaca",
              }}
            >
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#fca5a5" : "#991b1b",
                  }}
                >
                  Xóa sạch lịch sử tra cứu đã lưu
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#f87171" : "#b91c1c",
                  }}
                >
                  Xóa vĩnh viễn các từ khóa đã tìm kiếm lưu trên trình duyệt này
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteOutlineRoundedIcon />}
                onClick={() => setClearHistoryDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(220, 38, 38, 0.18)"
                      : "#ffffff",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(248, 113, 113, 0.4)"
                      : "#fca5a5",
                  "&:hover": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(220, 38, 38, 0.28)"
                        : "#fee2e2",
                  },
                }}
              >
                Xóa lịch sử
              </Button>
            </Stack>
          </Stack>
        )}

        {/* CHÂN THẺ: TỰ ĐỘNG LƯU & KHÔI PHỤC MẶC ĐỊNH */}
        <Divider sx={{ my: 3 }} />

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1.5}
        >
          <Button
            variant="text"
            color="inherit"
            size="small"
            startIcon={<RestartAltRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={() => setResetDialogOpen(true)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "text.secondary",
              borderRadius: 2,
              px: 1.5,
              "&:hover": { color: "text.primary", bgcolor: "action.hover" },
            }}
          >
            Khôi phục mặc định
          </Button>

          <Chip
            icon={<CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#16a34a !important" }} />}
            label="Tự động lưu thay đổi"
            size="small"
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(22, 163, 74, 0.16)"
                  : "#f0fdf4",
              color: (theme) =>
                theme.palette.mode === "dark" ? "#4ade80" : "#16a34a",
              fontWeight: 600,
              fontSize: "0.75rem",
              border: (theme) =>
                theme.palette.mode === "dark"
                  ? "1px solid rgba(74, 222, 128, 0.3)"
                  : "1px solid #bbf7d0",
            }}
          />
        </Stack>
      </Paper>

      {/* CONFIRM DIALOG: KHÔI PHỤC MẶC ĐỊNH */}
      <ConfirmDialog
        open={resetDialogOpen}
        title="Khôi phục cài đặt mặc định?"
        message="Toàn bộ tùy chọn thông báo và quyền riêng tư sẽ được đưa về giá trị mặc định ban đầu. Bạn có muốn tiếp tục?"
        confirmLabel="Khôi phục"
        cancelLabel="Hủy"
        variant="warning"
        onConfirm={handleConfirmReset}
        onClose={() => setResetDialogOpen(false)}
      />

      {/* CONFIRM DIALOG: XÓA LỊCH SỬ TRA CỨU */}
      <ConfirmDialog
        open={clearHistoryDialogOpen}
        title="Xóa lịch sử tra cứu sách?"
        message="Toàn bộ từ khóa và đầu sách bạn đã tìm kiếm lưu trên trình duyệt này sẽ bị xóa sạch hoàn toàn."
        confirmLabel="Xóa ngay"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={handleConfirmClearHistory}
        onClose={() => setClearHistoryDialogOpen(false)}
      />

      {/* TOAST THÔNG BÁO TỰ ĐỘNG LƯU */}
      <Snackbar
        open={toast.open}
        autoHideDuration={2000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ borderRadius: 2.5, fontWeight: 600, fontSize: "0.825rem" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserSettingsPage;
