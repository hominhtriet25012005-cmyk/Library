import { useEffect, useMemo, useState } from "react";
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
import { useLocation, useNavigate } from "react-router-dom";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import AssignmentReturnRoundedIcon from "@mui/icons-material/AssignmentReturnRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../auth/useAuth";
import { adminPageForPath } from "./adminNavigation";
import { adminDrawerWidth } from "./AdminSidebar";
import { adminLoansApi } from "../../api/adminLoans";
import {
  readNotificationIds as loadReadNotificationIds,
  writeNotificationIds,
} from "../../components/common/notificationReads";
import { formatDateTimeVN } from "../../utils/formatters";

const AdminTopbar = ({ onMenuClick, density, onDensityChange }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [notificationError, setNotificationError] = useState("");
  const page = adminPageForPath(location.pathname);
  const notificationStorageKey = user?.id
    ? `library.admin.notifications.read.${user.id}`
    : null;
  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !readIds.has(item.id)).length,
    [notifications, readIds],
  );

  useEffect(() => {
    if (!notificationStorageKey) {
      setNotifications([]);
      setReadIds(new Set());
      return undefined;
    }

    setReadIds(loadReadNotificationIds(notificationStorageKey));
    let active = true;
    let requestController;
    const loadNotifications = async () => {
      requestController?.abort();
      requestController = new AbortController();
      try {
        const result = await adminLoansApi.returnRequests(
          { page: 0, size: 20 },
          { signal: requestController.signal },
        );
        if (!active) return;
        setNotifications(
          result.content.map((loan) => ({
            id: `return-${loan.id}-${loan.returnRequestedAt || "pending"}`,
            title: "Yêu cầu trả sách cần xác nhận",
            description: `${loan.userName || "Độc giả"} yêu cầu trả “${loan.bookTitle || "Sách"}”.`,
            time: formatDateTimeVN(loan.returnRequestedAt),
            link: "/admin/loans?tab=returnRequests",
          })),
        );
        setNotificationError("");
      } catch (error) {
        if (!active || error.name === "AbortError") return;
        setNotificationError(error.message || "Không tải được thông báo quản trị.");
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30_000);
    window.addEventListener("focus", loadNotifications);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadNotifications);
      requestController?.abort();
    };
  }, [notificationStorageKey]);

  const markNotificationsRead = (ids) => {
    const next = new Set(readIds);
    ids.forEach((id) => next.add(id));
    setReadIds(next);
    writeNotificationIds(notificationStorageKey, next);
  };

  const markAllNotificationsRead = () =>
    markNotificationsRead(notifications.map((item) => item.id));

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

        <Tooltip title="Thông báo">
          <IconButton
            aria-label={`Thông báo${unreadNotificationCount ? `, ${unreadNotificationCount} chưa đọc` : ""}`}
            onClick={(event) => setNotificationAnchor(event.currentTarget)}
          >
            <Badge badgeContent={unreadNotificationCount} color="error" max={99}>
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
          slotProps={{ paper: { sx: { width: 380, maxWidth: "92vw", mt: 1, borderRadius: 2.5 } } }}
        >
          <Box sx={{ p: 1.75, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography fontWeight={700}>Thông báo quản trị</Typography>
              {unreadNotificationCount > 0 && (
                <Chip label={`${unreadNotificationCount} mới`} size="small" color="primary" />
              )}
            </Stack>
            {unreadNotificationCount > 0 && (
              <Button size="small" startIcon={<DoneAllRoundedIcon />} onClick={markAllNotificationsRead}>
                Đã đọc
              </Button>
            )}
          </Box>
          <Divider />
          {notificationError ? (
            <Alert severity="error" sx={{ m: 1.5 }}>{notificationError}</Alert>
          ) : notifications.length === 0 ? (
            <Typography color="text.secondary" variant="body2" sx={{ p: 2.5, textAlign: "center" }}>
              Hiện không có yêu cầu trả sách chờ xác nhận.
            </Typography>
          ) : (
            <List disablePadding sx={{ maxHeight: 360, overflowY: "auto" }}>
              {notifications.map((item) => {
                const unread = !readIds.has(item.id);
                return (
                  <ListItemButton
                    key={item.id}
                    onClick={() => {
                      markNotificationsRead([item.id]);
                      setNotificationAnchor(null);
                      navigate(item.link);
                    }}
                    sx={{ alignItems: "flex-start", gap: 1.5, py: 1.5, px: 2, bgcolor: unread ? "action.hover" : "transparent" }}
                  >
                    <AssignmentReturnRoundedIcon color="primary" sx={{ mt: 0.25 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" fontWeight={unread ? 700 : 500}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.time}</Typography>
                    </Box>
                  </ListItemButton>
                );
              })}
            </List>
          )}
          {notifications.length > 0 && (
            <>
              <Divider />
              <Box sx={{ p: 1, textAlign: "center" }}>
                <Button size="small" onClick={() => { setNotificationAnchor(null); navigate("/admin/loans?tab=returnRequests"); }}>
                  Mở mục Mượn – trả
                </Button>
              </Box>
            </>
          )}
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
