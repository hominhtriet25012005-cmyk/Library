import { useState } from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popover,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { navigationItems, secondaryItems } from "./NavigationItems";
import { isActive, navigationPath } from "./util";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import MenuIcon from "@mui/icons-material/MenuRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";

import { useAuth } from "../../auth/useAuth";
import { useUserSettings } from "../../settings/useUserSettings";
import { drawerWidth } from "./layout";

const Navbar = ({ handleDrawerToggle, preview = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, updateSettings } = useUserSettings();

  const [searchQuery, setSearchQuery] = useState("");
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [unreadCount, setUnreadCount] = useState(3);

  const currentItem = [...navigationItems, ...secondaryItems].find((item) =>
    isActive(navigationPath(item.path, preview), location)
  );

  const isDark = settings?.appearance?.theme === "dark";

  const handleToggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    updateSettings((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme: nextTheme,
      },
    }));
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim();
    if (clean) {
      navigate(`/user/books?q=${encodeURIComponent(clean)}`);
    } else {
      navigate("/user/books");
    }
  };

  const handleOpenNotifications = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setNotificationAnchor(null);
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  const notifications = [
    {
      id: 1,
      title: "Sắp đến hạn trả sách",
      desc: "Sách 'Domain-Driven Design' cần trả trước ngày 01/11/2026.",
      time: "2 giờ trước",
      icon: <AutoStoriesRoundedIcon sx={{ fontSize: 20, color: "#1d4ed8" }} />,
      bg: "#eff6ff",
      link: "/user/my-loans",
    },
    {
      id: 2,
      title: "Sách đặt trước đã có sẵn",
      desc: "Đầu sách 'Refactoring' đã về quầy và sẵn sàng để bạn mượn.",
      time: "Hôm qua",
      icon: <EventAvailableRoundedIcon sx={{ fontSize: 20, color: "#059669" }} />,
      bg: "#ecfdf5",
      link: "/user/my-reservations",
    },
    {
      id: 3,
      title: "Gia hạn sách thành công",
      desc: "Lượt mượn sách của bạn đã được gia hạn thêm 14 ngày an toàn.",
      time: "3 ngày trước",
      icon: (
        <CheckCircleOutlineRoundedIcon
          sx={{ fontSize: 20, color: "#d97706" }}
        />
      ),
      bg: "#fef3c7",
      link: "/user/my-loans",
    },
  ];

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: isDark ? "#0f172a" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        color: isDark ? "#f8fafc" : "#1e293b",
        borderBottom: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}
    >
      <Toolbar sx={{ height: 64, px: { xs: 2, sm: 3 } }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Tiêu đề trang bên trái */}
        <Box sx={{ flexGrow: 1, minWidth: 0, pr: 2 }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 750,
              color: isDark ? "#60a5fa" : "#102d62",
              fontSize: "1.125rem",
            }}
          >
            {currentItem?.title || "Tổng quan bạn đọc"}
          </Typography>
          {(preview || currentItem?.description) && (
            <Typography
              variant="caption"
              sx={{
                color: isDark ? "#94a3b8" : "#64748b",
                display: { xs: "none", sm: "block" },
              }}
            >
              {preview
                ? "Chế độ xem trước (Dữ liệu thử nghiệm)"
                : currentItem.description}
            </Typography>
          )}
        </Box>

        {/* KHU VỰC CÔNG CỤ TOOLBAR BÊN PHẢI (Thứ tự: Tìm kiếm -> Thông báo -> Đèn sáng tối -> Avatar) */}
        <Stack direction="row" spacing={1.25} alignItems="center">
          {/* 1. CÔNG CỤ TÌM KIẾM SÁCH */}
          <Paper
            component="form"
            onSubmit={handleSearchSubmit}
            elevation={0}
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              width: { sm: 190, md: 230, lg: 260 },
              height: 38,
              bgcolor: isDark ? "#1e293b" : "#f1f5f9",
              borderRadius: "20px",
              px: 1.5,
              border: isDark ? "1px solid #334155" : "1px solid transparent",
              transition: "all 0.2s ease",
              "&:focus-within": {
                borderColor: "#1769ff",
                bgcolor: isDark ? "#0f172a" : "#ffffff",
                boxShadow: "0 0 0 3px rgba(23, 105, 255, 0.15)",
              },
            }}
          >
            <SearchRoundedIcon
              sx={{
                fontSize: 19,
                color: isDark ? "#94a3b8" : "#64748b",
                mr: 0.75,
              }}
            />
            <InputBase
              placeholder="Tìm kiếm sách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                fontSize: "0.85rem",
                flex: 1,
                color: isDark ? "#f8fafc" : "#1e293b",
                "& input": { p: 0 },
              }}
            />
          </Paper>

          {/* 2. NÚT THÔNG BÁO */}
          <Tooltip title="Thông báo" arrow>
            <IconButton
              onClick={handleOpenNotifications}
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(15, 23, 42, 0.04)",
                color: isDark ? "#e2e8f0" : "#475569",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(15, 23, 42, 0.08)",
                },
              }}
            >
              <Badge badgeContent={unreadCount} color="error" variant="standard">
                <NotificationsNoneRoundedIcon sx={{ fontSize: 21 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* 3. NÚT ĐIỀU CHỈNH ĐÈN SÁNG TỐI */}
          <Tooltip
            title={
              isDark ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"
            }
            arrow
          >
            <IconButton
              onClick={handleToggleTheme}
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(15, 23, 42, 0.04)",
                color: isDark ? "#f59e0b" : "#64748b",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(15, 23, 42, 0.08)",
                },
              }}
            >
              {isDark ? (
                <LightModeRoundedIcon sx={{ fontSize: 20 }} />
              ) : (
                <DarkModeRoundedIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>

          {/* 4. KHU VỰC TÀI KHOẢN (AVATAR) */}
          {preview ? (
            <Chip
              label="Bản xem thử"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: "0.75rem" }}
            />
          ) : (
            user && (
              <Tooltip title="Xem hồ sơ cá nhân" arrow>
                <Button
                  component={RouterLink}
                  to="/user/profile"
                  size="small"
                  sx={{
                    textTransform: "none",
                    color: isDark ? "#f1f5f9" : "#334155",
                    px: 1.25,
                    py: 0.5,
                    borderRadius: "20px",
                    bgcolor: isDark
                      ? "rgba(255, 255, 255, 0.06)"
                      : "rgba(15, 23, 42, 0.04)",
                    "&:hover": {
                      bgcolor: isDark
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(15, 23, 42, 0.08)",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      mr: 1,
                      bgcolor: "#1769ff",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                    }}
                  >
                    {user?.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : user?.name
                      ? user.name.charAt(0).toUpperCase()
                      : "U"}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      display: { xs: "none", md: "inline" },
                      maxWidth: 140,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user?.fullName || user?.name || "Bạn đọc"}
                  </Typography>
                </Button>
              </Tooltip>
            )
          )}

          {/* Phím tắt Admin nếu là Admin */}
          {!preview && user?.role === "ROLE_ADMIN" && (
            <Button
              component={RouterLink}
              to="/admin/dashboard"
              size="small"
              variant="outlined"
              startIcon={<AdminPanelSettingsRoundedIcon />}
              sx={{
                display: { xs: "none", lg: "inline-flex" },
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8125rem",
                borderColor: "#1769ff",
                color: "#1769ff",
                "&:hover": { bgcolor: "rgba(23,105,255,0.06)" },
              }}
            >
              Vào quản trị
            </Button>
          )}
        </Stack>
      </Toolbar>

      {/* POPOVER DANH SÁCH THÔNG BÁO */}
      <Popover
        open={Boolean(notificationAnchor)}
        anchorEl={notificationAnchor}
        onClose={handleCloseNotifications}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxWidth: "90vw",
              mt: 1.5,
              borderRadius: 3,
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 750, color: "#0f172a" }}>
              Thông báo
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} mới`}
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
              />
            )}
          </Stack>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={handleMarkAllRead}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                color: "#64748b",
                fontWeight: 600,
                "&:hover": { color: "#1769ff" },
              }}
            >
              Đã đọc
            </Button>
          )}
        </Box>

        <Divider />

        <List disablePadding sx={{ maxHeight: 360, overflowY: "auto" }}>
          {notifications.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => {
                handleCloseNotifications();
                navigate(item.link);
              }}
              sx={{
                p: 2,
                borderBottom: "1px solid #f1f5f9",
                alignItems: "flex-start",
                gap: 1.5,
                "&:hover": { bgcolor: "#f8fafc" },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: item.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {item.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.875rem" }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: "0.8rem",
                    lineHeight: 1.4,
                    mt: 0.25,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.desc}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#94a3b8", display: "block", mt: 0.5 }}
                >
                  {item.time}
                </Typography>
              </Box>
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ p: 1.5, bgcolor: "#f8fafc", textAlign: "center" }}>
          <Button
            size="small"
            onClick={() => {
              handleCloseNotifications();
              navigate("/user/my-loans");
            }}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              color: "#1769ff",
            }}
          >
            Xem tất cả sách đang mượn →
          </Button>
        </Box>
      </Popover>
    </AppBar>
  );
};

export default Navbar;
