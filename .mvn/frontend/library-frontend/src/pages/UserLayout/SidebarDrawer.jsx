import { Box } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import MenuBookIcon from "@mui/icons-material/MenuBookRounded";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import { useLocation } from "react-router-dom";
import { navigationItems } from "./NavigationItems";
import { secondaryItems } from "./NavigationItems";
import { useNavigate } from "react-router-dom";
import { isActive, navigationPath } from "./util";
import Logout from "@mui/icons-material/Logout";
import Login from "@mui/icons-material/LoginRounded";
import { useAuth } from "../../auth/useAuth";

const SidebarDrawer = ({ onNavigate, preview = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleNavigation = (path) => {
    navigate(navigationPath(path, preview));
    onNavigate?.();
  };
  return (
    <Box
      sx={{
        height: "100dvh",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #123c88 0%, #0c2558 100%)",
        color: "white",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "300px",
          background:
            "radial-gradient(circle at 50% 0%, rgba(101, 165, 255, 0.28) 0%, transparent 100%)",
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        <Box>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              background: "linear-gradient(135deg, #1769ff 0%, #0d4ed3 100%)",
              fontWeight: "bold",
              fontSize: "1.3rem",
              boxShadow: "0 8px 24px rgba(23, 105, 255, 0.35)",
            }}
          >
            <MenuBookIcon />
          </Avatar>
        </Box>

        <Box>
          <Typography
            variant="h6"
            sx={{
              color: "white",
              letterSpacing: 0.5,
              background: "linear-gradient(135deg, #ffffff 0%, #d8e8ff 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Thư viện
          </Typography>
          <Typography
            variant="caption"
            sx={{
              opacity: 0.7,
              fontWeight: 500,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Quản lý sách
          </Typography>
        </Box>
      </Box>

      {/* Main Navigation Items */}

      <List
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          py: 1,
          position: "relative",
        }}
      >
        {navigationItems.map((item, index) => {
          const active = isActive(navigationPath(item.path, preview), location);
          const available = ["/user", "/user/books", "/user/my-loans", "/user/my-reservations", "/user/wishlist"].includes(item.path)
            || (!preview && ["/user/subscriptions", "/user/my-fines"].includes(item.path));
          return (
            <ListItem key={index} disablePadding sx={{ px: 1, py: 0.25, flexShrink: 0 }}>
              <Tooltip title={available ? item.description : "Sẽ triển khai ở giai đoạn sau"} placement="right">
                <ListItemButton
                  disabled={!available}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2.5,
                    py: 1,
                    px: 1.5,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    bgcolor: active ? "rgba(101, 165, 255, 0.22)" : "transparent",
                    border: active
                      ? "1px solid rgba(101, 165, 255, 0.5)"
                      : "1px solid transparent",
                    backdropFilter: active ? "blur(10px)" : "none",
                    "&:hover": {
                      bgcolor: active
                        ? alpha("#1769ff", 0.3)
                        : "rgba(255, 255, 255, 0.05)",
                      transform: "translateX(6px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    },
                    "&::before": active
                      ? {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 4,
                          height: "70%",
                          borderRadius: "0 4px 4px 0",
                          background:
                            "linear-gradient(135deg, #65a5ff 0%, #1769ff 100%)",
                          boxShadow: "0 0 12px rgba(23, 105, 255, 0.5)",
                        }
                      : {},
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: active ? "#9cc5ff" : "rgba(255, 255, 255, 0.7)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {item.title}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
        {/* secondaryItems */}
        {!preview && secondaryItems.map((item, index) => {
          const active = isActive(item.path, location);
          const available = item.path === "/user/profile";
          return (
            <ListItem key={index} disablePadding sx={{ px: 1, py: 0.25, flexShrink: 0 }}>
              <Tooltip title={available ? "Thông tin tài khoản" : "Chưa triển khai"} placement="right">
                <ListItemButton
                  disabled={!available}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2.5,
                    py: 1,
                    px: 1.5,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    bgcolor: active ? "rgba(101, 165, 255, 0.22)" : "transparent",
                    border: active
                      ? "1px solid rgba(101, 165, 255, 0.5)"
                      : "1px solid transparent",
                    backdropFilter: active ? "blur(10px)" : "none",
                    "&:hover": {
                      bgcolor: active
                        ? alpha("#1769ff", 0.3)
                        : "rgba(255, 255, 255, 0.05)",
                      transform: "translateX(6px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    },
                    "&::before": active
                      ? {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 4,
                          height: "70%",
                          borderRadius: "0 4px 4px 0",
                          background:
                            "linear-gradient(135deg, #65a5ff 0%, #1769ff 100%)",
                          boxShadow: "0 0 12px rgba(23, 105, 255, 0.5)",
                        }
                      : {},
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: active ? "#9cc5ff" : "rgba(255, 255, 255, 0.7)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {item.title}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}

      </List>
      <Box sx={{ px: 1.5, py: 1, flexShrink: 0, borderTop: "1px solid rgba(255, 255, 255, 0.12)", position: "relative" }}>
        <ListItemButton onClick={() => { if (!preview) signOut(); navigate("/login", { replace: !preview }); onNavigate?.(); }} sx={{ borderRadius: 2, color: "white", py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40, color: "white" }}>{preview ? <Login /> : <Logout />}</ListItemIcon>
          {preview ? "Đăng nhập" : "Đăng xuất"}
        </ListItemButton>
        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "rgba(255,255,255,0.55)" }}>
          © 2026 Hệ thống quản lý thư viện.
        </Typography>
      </Box>
    </Box>
  );
};
export default SidebarDrawer;
