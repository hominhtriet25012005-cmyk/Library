import { useEffect, useState, useRef } from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  ClickAwayListener,
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
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";

import { useAuth } from "../../../auth/useAuth";
import { drawerWidth } from "./layout";
import { formatDateTimeVN } from "../../../utils/formatters";
import { useNotifications } from "../../../notifications/useNotifications.js";
import { notificationPath } from "../../../api/notifications.js";

const Navbar = ({ handleDrawerToggle, preview = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const {
    notifications,
    unreadCount,
    error: notificationError,
    loading: notificationsLoading,
    refresh: refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    enabled: Boolean(user?.id) && !preview,
    scope: `${user?.id || "guest"}:${user?.role || "USER"}`,
  });

  const currentItem = [...navigationItems, ...secondaryItems].find((item) =>
    isActive(navigationPath(item.path, preview), location),
  );

  const isDark = theme.palette.mode === "dark";

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("q");
    if (q) {
      setSearchQuery(q);
      setSearchOpen(true);
    }
  }, [location.search]);

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
              color: isDark ? "primary.light" : "primary.main",
              fontSize: "1.125rem",
            }}
          >
            {currentItem?.title || "Tổng quan bạn đọc"}
          </Typography>
          {preview && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: { xs: "none", sm: "block" },
              }}
            >
              Chế độ xem trước (Dữ liệu thử nghiệm)
            </Typography>
          )}
        </Box>

        {/* KHU VỰC CÔNG CỤ TOOLBAR BÊN PHẢI (Thứ tự: Tìm kiếm -> Thông báo -> Trang chủ -> Avatar -> Vào quản trị) */}
        <Stack direction="row" spacing={1.25} alignItems="center">
          {/* 1. CÔNG CỤ TÌM KIẾM SÁCH (Dạng nút Icon, bấm vào mở thanh tìm kiếm) */}
          {searchOpen ? (
            <ClickAwayListener
              onClickAway={() => {
                if (!searchQuery.trim()) setSearchOpen(false);
              }}
            >
              <Paper
                component="form"
                onSubmit={handleSearchSubmit}
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: { xs: 190, sm: 230, md: 270 },
                  height: 38,
                  bgcolor: isDark ? "background.paper" : "action.hover",
                  borderRadius: "20px",
                  px: 1.5,
                  border: "1px solid",
                  borderColor: "primary.main",
                  boxShadow: "0 0 0 3px rgba(49, 91, 76, 0.15)",
                  transition: "all 0.25s ease",
                }}
              >
                <SearchRoundedIcon
                  sx={{
                    fontSize: 19,
                    color: "primary.main",
                    mr: 0.75,
                  }}
                />
                <InputBase
                  inputRef={searchInputRef}
                  placeholder="Tìm kiếm sách..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                    }
                  }}
                  sx={{
                    fontSize: "0.85rem",
                    flex: 1,
                    color: "text.primary",
                    "& input": { p: 0 },
                  }}
                />
                <IconButton
                  size="small"
                  aria-label="Đóng tìm kiếm"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchOpen(false);
                  }}
                  sx={{ p: 0.25, color: "text.secondary", "&:hover": { color: "primary.main" } }}
                >
                  <CloseRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Paper>
            </ClickAwayListener>
          ) : (
            <Tooltip title="Tìm kiếm sách" arrow>
              <IconButton
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 80);
                }}
                aria-label="Mở tìm kiếm sách"
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  bgcolor: "action.hover",
                  color: "text.secondary",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "action.selected",
                    color: "primary.main",
                  },
                }}
              >
                <SearchRoundedIcon sx={{ fontSize: 21 }} />
              </IconButton>
            </Tooltip>
          )}

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

          {/* 3. NÚT ICON VỀ TRANG CHỦ PUBLIC */}
          <Tooltip title="Về trang chủ Thư viện Kinh sách Phật giáo" arrow>
            <IconButton
              component={RouterLink}
              to="/"
              aria-label="Về trang chủ Thư viện Kinh sách"
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: "action.hover",
                color: "text.secondary",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "action.selected",
                  color: "primary.main",
                },
              }}
            >
              <HomeRoundedIcon sx={{ fontSize: 21 }} />
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
              onClick={() => void markAllAsRead()}
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
            <Typography
              color="error"
              variant="body2"
              sx={{ p: 2, textAlign: "center" }}
            >
              {notificationError}
            </Typography>
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
              Bạn chưa có thông báo nào.
            </Typography>
          ) : (
            notifications.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={async () => {
                  const marked = await markAsRead(item.id);
                  if (!marked) return;
                  handleCloseNotifications();
                  navigate(notificationPath(item.actionUrl, user?.role));
                }}
                sx={{
                  p: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  alignItems: "flex-start",
                  gap: 1.5,
                  bgcolor: item.readAt ? "transparent" : "action.hover",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: isDark
                      ? "rgba(49, 91, 76, 0.2)"
                      : "primary.light",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <NotificationsNoneRoundedIcon
                    sx={{ fontSize: 20, color: "primary.main" }}
                  />
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
                    {item.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
                  >
                    {formatDateTimeVN(item.createdAt)}
                  </Typography>
                </Box>
              </ListItemButton>
            ))
          )}
        </List>

        <Box sx={{ p: 1.5, bgcolor: "action.hover", textAlign: "center" }}>
          <Button
            size="small"
            onClick={() => {
              void refreshNotifications();
            }}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              color: "primary.main",
            }}
          >
            Làm mới thông báo
          </Button>
        </Box>
      </Popover>
    </AppBar>
  );
};

export default Navbar;
