import { Box } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import MenuBookIcon from "@mui/icons-material/MenuBookRounded";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import { navigationItems, secondaryItems } from "./NavigationItems";
import { isActive, navigationPath } from "./util";
import Logout from "@mui/icons-material/Logout";
import Login from "@mui/icons-material/LoginRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import { useAuth } from "../../auth/useAuth";

const SidebarDrawer = ({ onNavigate, preview = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleNavigation = (path) => {
    navigate(navigationPath(path, preview));
    onNavigate?.();
  };

  const getInitial = () => {
    const name = user?.fullName || user?.name || "U";
    return name.trim().charAt(0).toUpperCase() || "U";
  };

  return (
    <Box
      sx={{
        height: "100dvh",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "#102d62",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 1. Header Thương hiệu (Đồng bộ chuẩn Admin) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2.5,
          py: 2.5,
          flexShrink: 0,
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <Avatar
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            bgcolor: "#1769ff",
            boxShadow: "0 4px 14px rgba(23, 105, 255, 0.4)",
          }}
        >
          <MenuBookIcon sx={{ fontSize: 24 }} />
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              color: "white",
              letterSpacing: 0.5,
              fontSize: "1.0625rem",
              lineHeight: 1.2,
            }}
          >
            THƯ VIỆN SỐ
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#a9c5f4",
              fontWeight: 600,
              letterSpacing: 0.8,
              fontSize: "0.72rem",
              textTransform: "uppercase",
            }}
          >
            Cổng tra cứu & bạn đọc
          </Typography>
        </Box>
      </Box>

      {/* 2. Danh sách Chức năng chính (Kích thước to, thoáng như Admin) */}
      <Box
        component="nav"
        aria-label="Menu chức năng bạn đọc"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehaviorY: "contain",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
          px: 1.5,
          py: 2,
        }}
      >
        {/* Nhóm 1: DỊCH VỤ BẠN ĐỌC */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              px: 1.75,
              py: 0.5,
              color: "#91b2eb",
              fontWeight: 700,
              letterSpacing: 1.2,
              fontSize: "0.75rem",
            }}
          >
            DỊCH VỤ BẠN ĐỌC
          </Typography>

          <List disablePadding>
            {navigationItems.map((item, index) => {
              const active = isActive(
                navigationPath(item.path, preview),
                location,
              );
              const available =
                [
                  "/user",
                  "/user/books",
                  "/user/my-loans",
                  "/user/my-reservations",
                  "/user/wishlist",
                ].includes(item.path) ||
                (!preview &&
                  ["/user/subscriptions", "/user/my-fines"].includes(
                    item.path,
                  ));

              return (
                <ListItem key={index} disablePadding sx={{ mb: 0.6 }}>
                  <Tooltip
                    title={
                      available
                        ? item.description
                        : "Chỉ khả dụng ở tài khoản chính thức"
                    }
                    placement="right"
                    arrow
                  >
                    <ListItemButton
                      disabled={!available}
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        minHeight: 46,
                        borderRadius: 2.5,
                        px: 1.75,
                        color: active ? "#ffffff" : "#e5eeff",
                        bgcolor: active
                          ? "rgba(88, 151, 255, 0.28)"
                          : "transparent",
                        borderLeft: active
                          ? "4px solid #1769ff"
                          : "4px solid transparent",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          bgcolor: active
                            ? "rgba(88, 151, 255, 0.38)"
                            : "rgba(255, 255, 255, 0.08)",
                          transform: "translateX(3px)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: active ? "#ffffff" : "#abc7f3",
                          "& svg": { fontSize: 22 },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>

                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{
                          fontSize: "0.9375rem",
                          fontWeight: active ? 700 : 500,
                          letterSpacing: 0.2,
                        }}
                      />
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Nhóm 2: TÀI KHOẢN & CÀI ĐẶT */}
        {!preview && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="overline"
              sx={{
                display: "block",
                px: 1.75,
                pt: 1,
                pb: 0.5,
                color: "#91b2eb",
                fontWeight: 700,
                letterSpacing: 1.2,
                fontSize: "0.75rem",
              }}
            >
              TÀI KHOẢN
            </Typography>

            <List disablePadding>
              {secondaryItems.map((item, index) => {
                const active = isActive(item.path, location);
                const tooltipTitle =
                  item.path === "/user/profile"
                    ? "Thông tin tài khoản & bảo mật"
                    : "Tùy biến thông báo & giao diện";

                return (
                  <ListItem key={index} disablePadding sx={{ mb: 0.6 }}>
                    <Tooltip title={tooltipTitle} placement="right" arrow>
                      <ListItemButton
                        onClick={() => handleNavigation(item.path)}
                        sx={{
                          minHeight: 46,
                          borderRadius: 2.5,
                          px: 1.75,
                          color: active ? "#ffffff" : "#e5eeff",
                          bgcolor: active
                            ? "rgba(88, 151, 255, 0.28)"
                            : "transparent",
                          borderLeft: active
                            ? "4px solid #1769ff"
                            : "4px solid transparent",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            bgcolor: active
                              ? "rgba(88, 151, 255, 0.38)"
                              : "rgba(255, 255, 255, 0.08)",
                            transform: "translateX(3px)",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 40,
                            color: active ? "#ffffff" : "#abc7f3",
                            "& svg": { fontSize: 22 },
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>

                        <ListItemText
                          primary={item.title}
                          primaryTypographyProps={{
                            fontSize: "0.9375rem",
                            fontWeight: active ? 700 : 500,
                            letterSpacing: 0.2,
                          }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
      </Box>

      {/* 3. Footer: Thẻ người dùng + Chuyển trang Quản trị (nếu là Admin) + Đăng xuất */}
      <Box
        sx={{
          p: 1.75,
          flexShrink: 0,
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          bgcolor: "rgba(0, 0, 0, 0.18)",
        }}
      >
        {!preview && user && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 1.25,
              py: 1.25,
              mb: 1.25,
              borderRadius: 2.5,
              bgcolor: "rgba(255, 255, 255, 0.06)",
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#1769ff",
                fontSize: "0.95rem",
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(23, 105, 255, 0.4)",
              }}
            >
              {getInitial()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: 700, color: "white", fontSize: "0.875rem" }}
              >
                {user.fullName || user.name || "Bạn đọc"}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: "#a9c5f4", display: "block", fontSize: "0.75rem" }}
              >
                {user.role === "ROLE_ADMIN"
                  ? "Quản trị viên"
                  : user.email || "Độc giả thư viện"}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Nút vào trang Quản trị (Dành riêng cho Admin khi đang ở User interface) */}
        {!preview && user?.role === "ROLE_ADMIN" && (
          <ListItemButton
            component={RouterLink}
            to="/admin/dashboard"
            onClick={onNavigate}
            sx={{
              borderRadius: 2,
              color: "#a5b4fc",
              minHeight: 42,
              px: 1.5,
              mb: 0.75,
              bgcolor: "rgba(165, 180, 252, 0.08)",
              "&:hover": {
                bgcolor: "rgba(165, 180, 252, 0.18)",
                color: "#ffffff",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: "#a5b4fc" }}>
              <AdminPanelSettingsRoundedIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary="Vào trang quản trị"
              primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600 }}
            />
          </ListItemButton>
        )}

        <ListItemButton
          onClick={() => {
            if (!preview) signOut();
            navigate("/login", { replace: !preview });
            onNavigate?.();
          }}
          sx={{
            borderRadius: 2,
            color: preview ? "#93c5fd" : "#fca5a5",
            minHeight: 42,
            px: 1.5,
            "&:hover": {
              bgcolor: preview
                ? "rgba(147, 197, 253, 0.1)"
                : "rgba(239, 68, 68, 0.15)",
              color: preview ? "#ffffff" : "#f87171",
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 38,
              color: preview ? "#93c5fd" : "#fca5a5",
              "& svg": { fontSize: 20 },
            }}
          >
            {preview ? <Login /> : <Logout />}
          </ListItemIcon>
          <ListItemText
            primary={preview ? "Đăng nhập chính thức" : "Đăng xuất tài khoản"}
            primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
};

export default SidebarDrawer;
