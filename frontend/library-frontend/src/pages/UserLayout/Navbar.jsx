import { useEffect, useMemo, useState } from "react";
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
  Paper,
  Popover,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { navigationItems, secondaryItems } from "./NavigationItems";
import { isActive, navigationPath } from "./util";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import MenuIcon from "@mui/icons-material/MenuRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";

import { useAuth } from "../../auth/useAuth";
import { drawerWidth } from "./layout";
import { finesApi } from "../../api/fines";
import { fineOutstanding, fineTypeLabels } from "../Fines/fineRules";
import { formatCurrencyVND, formatDateTimeVN } from "../../utils/formatters";
import {
  readNotificationIds as loadReadNotificationIds,
  writeNotificationIds,
} from "../../components/common/notificationReads";

const Navbar = ({ handleDrawerToggle, preview = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [fineNotifications, setFineNotifications] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(new Set());
  const [notificationError, setNotificationError] = useState("");
  const notificationStorageKey = user?.id
    ? `library.user.notifications.read.${user.id}`
    : null;
  const unreadCount = useMemo(
    () => fineNotifications.filter((item) => !readNotificationIds.has(item.id)).length,
    [fineNotifications, readNotificationIds],
  );

  const currentItem = [...navigationItems, ...secondaryItems].find((item) =>
    isActive(navigationPath(item.path, preview), location),
  );

  const isDark = theme.palette.mode === "dark";

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

  useEffect(() => {
    if (!notificationStorageKey) {
      setFineNotifications([]);
      setReadNotificationIds(new Set());
      return undefined;
    }

    setReadNotificationIds(loadReadNotificationIds(notificationStorageKey));
    let active = true;
    let requestController;
    const loadNotifications = async () => {
      requestController?.abort();
      requestController = new AbortController();
      try {
        const fines = await finesApi.mine({}, { signal: requestController.signal });
        if (!active) return;
        if (!Array.isArray(fines)) throw new Error("Dữ liệu tiền phạt không hợp lệ.");
        setFineNotifications(
          fines
            .filter((fine) =>
              ["PENDING", "PARTIALLY_PAID"].includes(fine.status) &&
              fineOutstanding(fine) > 0,
            )
            .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0))
            .map((fine) => {
              const outstanding = fineOutstanding(fine);
              const typeLabel = fineTypeLabels[fine.type] || "Khoản phạt";
              return {
                id: `fine-${fine.id}`,
                title: fine.status === "PARTIALLY_PAID"
                  ? "Khoản phạt còn dư nợ"
                  : "Khoản phạt cần thanh toán",
                desc: `${fine.bookTitle || "Sách thư viện"} · ${typeLabel}: còn nợ ${formatCurrencyVND(outstanding)}.${fine.reason ? ` ${fine.reason}` : ""}`,
                time: formatDateTimeVN(fine.createdAt),
                link: "/user/my-fines",
              };
            }),
        );
        setNotificationError("");
      } catch (error) {
        if (!active || error.name === "AbortError") return;
        setNotificationError(error.message || "Không tải được thông báo tiền phạt.");
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") loadNotifications();
    };
    window.addEventListener("focus", loadNotifications);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadNotifications);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      requestController?.abort();
    };
  }, [notificationStorageKey]);

  const markNotificationsRead = (ids) => {
    const next = new Set(readNotificationIds);
    ids.forEach((id) => next.add(id));
    setReadNotificationIds(next);
    writeNotificationIds(notificationStorageKey, next);
  };

  const handleMarkAllRead = () =>
    markNotificationsRead(fineNotifications.map((item) => item.id));

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: isDark ? "background.default" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        color: "text.primary",
        borderBottom: "1px solid",
        borderColor: "divider",
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
              color: isDark ? "primary.light" : "secondary.main",
              fontSize: "1.125rem",
            }}
          >
            {currentItem?.title || "Tổng quan bạn đọc"}
          </Typography>
          {(preview || currentItem?.description) && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
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
              bgcolor: "action.hover",
              borderRadius: "20px",
              px: 1.5,
              border: "1px solid",
              borderColor: isDark ? "divider" : "transparent",
              transition: "all 0.2s ease",
              "&:focus-within": {
                borderColor: "primary.main",
                bgcolor: "background.paper",
                boxShadow: "0 0 0 3px rgba(23, 105, 255, 0.15)",
              },
            }}
          >
            <SearchRoundedIcon
              sx={{
                fontSize: 19,
                color: "text.secondary",
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
                color: "text.primary",
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
                bgcolor: "action.hover",
                color: "text.secondary",
                "&:hover": {
                  bgcolor: "action.selected",
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                variant="standard"
              >
                <NotificationsNoneRoundedIcon sx={{ fontSize: 21 }} />
              </Badge>
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
                    color: "text.primary",
                    px: 1.25,
                    py: 0.5,
                    borderRadius: "20px",
                    bgcolor: "action.hover",
                    "&:hover": {
                      bgcolor: "action.selected",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      mr: 1,
                      bgcolor: "primary.main",
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
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": { bgcolor: "action.hover" },
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
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: "action.hover",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 750, color: "text.primary" }}
            >
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
                color: "text.secondary",
                fontWeight: 600,
                "&:hover": { color: "primary.main" },
              }}
            >
              Đã đọc
            </Button>
          )}
        </Box>

        <Divider />

        <List disablePadding sx={{ maxHeight: 360, overflowY: "auto" }}>
          {notificationError ? (
            <Typography color="error" variant="body2" sx={{ p: 2, textAlign: "center" }}>
              {notificationError}
            </Typography>
          ) : fineNotifications.length === 0 ? (
            <Typography color="text.secondary" variant="body2" sx={{ p: 2.5, textAlign: "center" }}>
              Bạn chưa có khoản phạt cần thanh toán.
            </Typography>
          ) : fineNotifications.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => {
                markNotificationsRead([item.id]);
                handleCloseNotifications();
                navigate(item.link);
              }}
              sx={{
                p: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
                alignItems: "flex-start",
                gap: 1.5,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: isDark ? "rgba(23, 105, 255, 0.16)" : "primary.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                <ReceiptLongRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    fontSize: "0.875rem",
                  }}
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
                  sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
                >
                  {item.time}
                </Typography>
              </Box>
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ p: 1.5, bgcolor: "action.hover", textAlign: "center" }}>
          <Button
            size="small"
            onClick={() => {
              handleCloseNotifications();
              navigate("/user/my-fines");
            }}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              color: "primary.main",
            }}
          >
            Xem các khoản phạt →
          </Button>
        </Box>
      </Popover>
    </AppBar>
  );
};

export default Navbar;
