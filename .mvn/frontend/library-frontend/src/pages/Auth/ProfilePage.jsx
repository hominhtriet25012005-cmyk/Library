import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

import { useAuth } from "../../auth/useAuth";
import { formatDateTimeVN } from "../../utils/formatters.js";
import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(-2)
      .join("")
      .toUpperCase();
  };

  const isAdmin = user?.role === "ROLE_ADMIN";

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", pb: 6 }}>
      <PageHeader
        title="Hồ sơ tài khoản"
        subtitle="Xem thông tin chi tiết bạn đọc, quản lý bảo mật và phiên đăng nhập hệ thống thư viện."
        icon={PersonRoundedIcon}
      />

      <Stack spacing={3}>
        {/* BANNER THÔNG TIN NGƯỜI DÙNG */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #132238 0%, #111c2e 100%)"
                : "linear-gradient(135deg, #eff6ff 0%, #ffffff 60%)",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 4px 20px -2px rgba(0, 0, 0, 0.4)"
                : "0 4px 20px -2px rgba(23, 105, 255, 0.06)",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "center", sm: "flex-start" },
            gap: 3,
            textAlign: { xs: "center", sm: "left" },
          }}
        >
            <Avatar
              sx={{
                width: 88,
                height: 88,
                bgcolor: isAdmin ? "#102d62" : "#1769ff",
                fontSize: 32,
                fontWeight: 700,
                boxShadow: "0 8px 16px rgba(23, 105, 255, 0.2)",
              }}
            >
              {getInitials(user?.fullName)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                  justifyContent: { xs: "center", sm: "flex-start" },
                }}
              >
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, color: "#0f172a" }}
                >
                  {user?.fullName || "Bạn đọc Thư viện"}
                </Typography>
                <Chip
                  label={isAdmin ? "Quản trị viên" : "Bạn đọc"}
                  color={isAdmin ? "secondary" : "primary"}
                  size="small"
                  sx={{ fontWeight: 700, borderRadius: 2 }}
                />
              </Box>

              <Typography
                variant="body2"
                sx={{ color: "#64748b", mt: 0.5, mb: 2 }}
              >
                {user?.email}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.5,
                  justifyContent: { xs: "center", sm: "flex-start" },
                }}
              >
                <Button
                  component={Link}
                  to="/user/my-loans"
                  variant="outlined"
                  size="small"
                  startIcon={<AutoStoriesRoundedIcon />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  Sách đang mượn
                </Button>
                <Button
                  component={Link}
                  to="/user/subscriptions"
                  variant="outlined"
                  size="small"
                  startIcon={<WorkspacePremiumRoundedIcon />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  Gói thành viên
                </Button>
                <Button
                  component={Link}
                  to="/user/my-fines"
                  variant="outlined"
                  size="small"
                  startIcon={<ReceiptLongRoundedIcon />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  Khoản phạt
                </Button>
              </Box>
            </Box>

            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<LogoutRoundedIcon />}
              onClick={() => setLogoutOpen(true)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                alignSelf: { xs: "stretch", sm: "flex-start" },
              }}
            >
              Đăng xuất
            </Button>
          </Paper>

          {/* TABS ĐIỀU HƯỚNG PROFILE */}
          <Box sx={{ borderBottom: "1px solid #e2e8f0" }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  minHeight: 44,
                  px: 3,
                  color: "#64748b",
                  "&.Mui-selected": { color: "#1769ff" },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#1769ff",
                  height: 3,
                },
              }}
            >
              <Tab
                label="Thông tin cá nhân"
                value="info"
                icon={<PersonRoundedIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
              />
              <Tab
                label="Bảo mật tài khoản"
                value="security"
                icon={<SecurityRoundedIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === "info" && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 4,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#0f172a", mb: 3 }}
              >
                Dữ liệu tài khoản bạn đọc
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 3,
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "#f1f5f9",
                      color: "#1769ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mt: 0.25,
                    }}
                  >
                    <PersonRoundedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Họ và tên
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: "#1e293b" }}
                    >
                      {user?.fullName || "—"}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "#f1f5f9",
                      color: "#1769ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mt: 0.25,
                    }}
                  >
                    <EmailRoundedIcon fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Địa chỉ Email
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: "#1e293b",
                        wordBreak: "break-all",
                      }}
                    >
                      {user?.email}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "#f1f5f9",
                      color: "#1769ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mt: 0.25,
                    }}
                  >
                    <PhoneRoundedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Số điện thoại
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: "#1e293b" }}
                    >
                      {user?.phone || "Chưa cập nhật"}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "#f1f5f9",
                      color: "#1769ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mt: 0.25,
                    }}
                  >
                    <AdminPanelSettingsRoundedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Vai trò hệ thống
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: "#1e293b" }}
                    >
                      {isAdmin ? "Quản trị viên (Admin)" : "Bạn đọc (User)"}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "#f1f5f9",
                      color: "#1769ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mt: 0.25,
                    }}
                  >
                    <AccessTimeRoundedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Đăng nhập lần cuối
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: "#1e293b" }}
                    >
                      {formatDateTimeVN(user?.lastLogin)}
                    </Typography>
                  </Box>
                </Box>

                {user?.id && (
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        bgcolor: "#f1f5f9",
                        color: "#1769ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mt: 0.25,
                      }}
                    >
                      <BadgeRoundedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        Mã độc giả
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, color: "#1e293b" }}
                      >
                        #{user.id}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          )}

          {/* TAB 2: BẢO MẬT */}
          {activeTab === "security" && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 4,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#0f172a", mb: 1 }}
              >
                Bảo mật tài khoản
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
                Hệ thống hiện hỗ trợ đặt lại mật khẩu qua email đã đăng ký.
              </Typography>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                Mở trang đặt lại mật khẩu, nhập email của bạn và làm theo liên
                kết được gửi tới hộp thư. Mật khẩu hiện tại sẽ chỉ thay đổi sau
                khi bạn hoàn tất bước xác nhận qua email.
              </Alert>
              <Button
                component={Link}
                to="/forgot-password"
                variant="contained"
                sx={{ textTransform: "none" }}
              >
                Đặt lại mật khẩu qua email
              </Button>
            </Paper>
          )}
        </Stack>

      {/* CONFIRM LOGOUT DIALOG */}
      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Đăng xuất khỏi tài khoản?"
        content="Bạn có chắc chắn muốn kết thúc phiên đăng nhập này không? Để tiếp tục sử dụng đầy đủ các dịch vụ thư viện, bạn sẽ cần đăng nhập lại."
        confirmText="Đăng xuất"
        cancelText="Ở lại"
        variant="warning"
      />
    </Box>
  );
};

export default ProfilePage;
