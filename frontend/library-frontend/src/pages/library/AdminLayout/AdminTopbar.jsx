import { useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
  Button,
  Box,
  Chip,
  Divider,
  IconButton,
  ListSubheader,
  List,
  ListItemButton,
  Menu,
  MenuItem,
  Popover,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../../auth/useAuth";
import { adminPageForPath } from "./adminNavigation";
import { adminDrawerWidth } from "./AdminSidebar";
import { formatDateTimeVN } from "../../../utils/formatters";
import { useNotifications } from "../../../notifications/useNotifications.js";
import { notificationPath } from "../../../api/notifications.js";

const AdminTopbar = ({ onMenuClick, density, onDensityChange }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const {
    notifications,
    unreadCount: unreadNotificationCount,
    error: notificationError,
    loading: notificationsLoading,
    refresh: refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    enabled: Boolean(user?.id),
    scope: `${user?.id || "guest"}:${user?.role || "ADMIN"}`,
  });
  const page = adminPageForPath(location.pathname);

  const go = (path) => {
    setAccountAnchor(null);
    setSettingsAnchor(null);
    navigate(path);
  };
  const logout = () => {
    setAccountAnchor(null);
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${adminDrawerWidth}px)` },
        ml: { md: `${adminDrawerWidth}px` },
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Toolbar sx={{ gap: 1.25 }}>
        <IconButton
          aria-label="Mở menu quản trị"
          onClick={onMenuClick}
          sx={{ display: { md: "none" } }}
        >
          <MenuRoundedIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            component="h1"
            noWrap
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            {page?.title ?? "Quản trị thư viện"}
          </Typography>
        </Box>

        <Tooltip title="Về trang chủ Thư viện Kinh sách Phật giáo">
          <IconButton
            component={RouterLink}
            to="/"
            aria-label="Về trang chủ Thư viện Kinh sách"
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              color: "text.secondary",
              mr: 0.5,
              transition: "all 0.2s ease",
              "&:hover": {
                color: "primary.main",
                bgcolor: "action.hover",
              },
            }}
          >
            <HomeRoundedIcon sx={{ fontSize: 21 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Thông báo">
          <IconButton
            aria-label={`Thông báo${unreadNotificationCount ? `, ${unreadNotificationCount} chưa đọc` : ""}`}
            onClick={(event) => setNotificationAnchor(event.currentTarget)}
          >
            <Badge
              badgeContent={unreadNotificationCount}
              color="error"
              max={99}
            >
              <NotificationsNoneRoundedIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        <Popover
          open={Boolean(notificationAnchor)}
          anchorEl={notificationAnchor}
          onClose={() => setNotificationAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: { width: 380, maxWidth: "92vw", mt: 1, borderRadius: 2.5 },
            },
          }}
        >
          <Box
            sx={{
              p: 1.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography fontWeight={700}>Thông báo quản trị</Typography>
              {unreadNotificationCount > 0 && (
                <Chip
                  label={`${unreadNotificationCount} mới`}
                  size="small"
                  color="primary"
                />
              )}
            </Stack>
            {unreadNotificationCount > 0 && (
              <Button
                size="small"
                startIcon={<DoneAllRoundedIcon />}
                onClick={() => void markAllAsRead()}
              >
                Đã đọc
              </Button>
            )}
          </Box>
          <Divider />
          {notificationError ? (
            <Alert severity="error" sx={{ m: 1.5 }}>
              {notificationError}
            </Alert>
          ) : notificationsLoading && notifications.length === 0 ? (
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ p: 2.5, textAlign: "center" }}
            >
              Đang tải thông báo…
            </Typography>
          ) : notifications.length === 0 ? (
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ p: 2.5, textAlign: "center" }}
            >
              Hiện chưa có thông báo mới.
            </Typography>
          ) : (
            <List disablePadding sx={{ maxHeight: 360, overflowY: "auto" }}>
              {notifications.map((item) => {
                const unread = !item.readAt;
                return (
                  <ListItemButton
                    key={item.id}
                    onClick={async () => {
                      const marked = await markAsRead(item.id);
                      if (!marked) return;
                      setNotificationAnchor(null);
                      navigate(notificationPath(item.actionUrl, user?.role));
                    }}
                    sx={{
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      px: 2,
                      bgcolor: unread ? "action.hover" : "transparent",
                    }}
                  >
                    <NotificationsNoneRoundedIcon
                      color="primary"
                      sx={{ mt: 0.25 }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={unread ? 700 : 500}
                      >
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTimeVN(item.createdAt)}
                      </Typography>
                    </Box>
                  </ListItemButton>
                );
              })}
            </List>
          )}
          <Divider />
          <Box sx={{ p: 1, textAlign: "center" }}>
            <Button size="small" onClick={() => void refreshNotifications()}>
              Làm mới thông báo
            </Button>
          </Box>
        </Popover>
        <Tooltip title="Cài đặt">
          <IconButton
            aria-label="Mở cài đặt"
            onClick={(event) => setSettingsAnchor(event.currentTarget)}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
        >
          <MenuItem onClick={() => go("/user/profile")}>Hồ sơ của tôi</MenuItem>
          <Divider />
          <ListSubheader>Mật độ hiển thị ADMIN</ListSubheader>
          <MenuItem
            selected={density === "comfortable"}
            onClick={() => {
              onDensityChange("comfortable");
              setSettingsAnchor(null);
            }}
          >
            Thoáng
          </MenuItem>
          <MenuItem
            selected={density === "compact"}
            onClick={() => {
              onDensityChange("compact");
              setSettingsAnchor(null);
            }}
          >
            Gọn
          </MenuItem>
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Chỉ lưu trên trình duyệt này.
            </Typography>
          </Box>
        </Menu>

        <Tooltip title="Tài khoản">
          <IconButton
            aria-label="Mở menu tài khoản"
            onClick={(event) => setAccountAnchor(event.currentTarget)}
            sx={{ ml: 0.5 }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: "primary.main",
                fontSize: 15,
              }}
            >
              {user?.fullName?.trim()?.[0]?.toUpperCase() ?? "A"}
            </Avatar>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={accountAnchor}
          open={Boolean(accountAnchor)}
          onClose={() => setAccountAnchor(null)}
        >
          <Box sx={{ px: 2, py: 1, maxWidth: 220 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {user?.fullName || "Quản trị viên"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => go("/user")}>
            <SwapHorizRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
            Giao diện người dùng
          </MenuItem>
          <MenuItem onClick={() => go("/user/profile")}>
            <AccountCircleRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
            Hồ sơ của tôi
          </MenuItem>
          <Divider />
          <MenuItem onClick={logout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            Đăng xuất
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default AdminTopbar;
