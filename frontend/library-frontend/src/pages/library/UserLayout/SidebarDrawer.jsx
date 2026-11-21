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
import { isActive } from "./util";
import Logout from "@mui/icons-material/Logout";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import { useAuth } from "../../../auth/useAuth";

const SidebarDrawer = ({ onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
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
        bgcolor: "#1e3a30",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 1. Header Thương hiệu (Bấm vào để quay về Trang chủ Public) */}
      <Tooltip
        title="Về trang chủ Thư viện Kinh sách Phật giáo"
        placement="bottom-start"
        arrow
      >
        <Box
          component={RouterLink}
          to="/"
          onClick={onNavigate}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2.5,
            py: 2.5,
            flexShrink: 0,
            textDecoration: "none",
            color: "inherit",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.08)",
              "& .brand-avatar": {
                transform: "scale(1.05)",
                borderColor: "#d4bc8b",
                boxShadow: "0 6px 18px rgba(169, 130, 71, 0.45)",
              },
              "& .brand-title": {
                color: "#d4bc8b",
              },
            },
          }}
        >
          <Avatar
            className="brand-avatar"
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              bgcolor: "#315B4C",
              border: "1px solid #A98247",
              boxShadow: "0 4px 14px rgba(49, 91, 76, 0.4)",
              transition: "all 0.2s ease-in-out",
            }}
          >
            <MenuBookIcon sx={{ fontSize: 24 }} />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              className="brand-title"
              sx={{
                fontWeight: 800,
                color: "white",
                letterSpacing: 0.5,
                fontSize: "1.0625rem",
                lineHeight: 1.2,
                transition: "color 0.2s ease-in-out",
              }}
            >
              THƯ VIỆN SỐ
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#c8dcd3",
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
      </Tooltip>

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
              color: "#d4bc8b",
              fontWeight: 700,
              letterSpacing: 1.2,
              fontSize: "0.75rem",
            }}
          >
            DỊCH VỤ BẠN ĐỌC
          </Typography>

          <List disablePadding>
            {navigationItems.map((item, index) => {
              const active = isActive(item.path, location);

              return (
                <ListItem key={index} disablePadding sx={{ mb: 0.6 }}>
                  <Tooltip title={item.title || item.description} placement="right" arrow>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        minHeight: 46,
                        borderRadius: 2.5,
                        px: 1.75,
                        color: active ? "#ffffff" : "#e5eeff",
                        bgcolor: active
                          ? "rgba(169, 130, 71, 0.22)"
                          : "transparent",
                        borderLeft: active
                          ? "4px solid #A98247"
                          : "4px solid transparent",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          bgcolor: active
                            ? "rgba(169, 130, 71, 0.32)"
                            : "rgba(255, 255, 255, 0.08)",
                          transform: "translateX(3px)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: active ? "#ffffff" : "#c4dbd0",
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
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="overline"
              sx={{
                display: "block",
                px: 1.75,
                pt: 1,
                pb: 0.5,
                color: "#d4bc8b",
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
                            ? "rgba(169, 130, 71, 0.22)"
                            : "transparent",
                          borderLeft: active
                            ? "4px solid #A98247"
                            : "4px solid transparent",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            bgcolor: active
                              ? "rgba(169, 130, 71, 0.32)"
                              : "rgba(255, 255, 255, 0.08)",
                            transform: "translateX(3px)",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 40,
                            color: active ? "#ffffff" : "#c4dbd0",
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
        {user && (
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
                bgcolor: "#315B4C",
                border: "1px solid #A98247",
                fontSize: "0.95rem",
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(49, 91, 76, 0.4)",
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
                sx={{ color: "#c8dcd3", display: "block", fontSize: "0.75rem" }}
              >
                {user.role === "ROLE_ADMIN"
                  ? "Quản trị viên"
                  : user.email || "Độc giả thư viện"}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Nút vào trang Quản trị (Dành riêng cho Admin khi đang ở User interface) */}
        {user?.role === "ROLE_ADMIN" && (
          <ListItemButton
            component={RouterLink}
            to="/admin/dashboard"
            onClick={onNavigate}
            sx={{
              borderRadius: 2,
              color: "#d4bc8b",
              minHeight: 42,
              px: 1.5,
              mb: 0.75,
              bgcolor: "rgba(169, 130, 71, 0.12)",
              "&:hover": {
                bgcolor: "rgba(169, 130, 71, 0.22)",
                color: "#ffffff",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: "#d4bc8b" }}>
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
            signOut();
            navigate("/login", { replace: true });
            onNavigate?.();
          }}
          sx={{
            borderRadius: 2,
            color: "#fca5a5",
            minHeight: 42,
            px: 1.5,
            "&:hover": {
              bgcolor: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 38,
              color: "#fca5a5",
              "& svg": { fontSize: 20 },
            }}
          >
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Đăng xuất tài khoản"
            primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
};

export default SidebarDrawer;
