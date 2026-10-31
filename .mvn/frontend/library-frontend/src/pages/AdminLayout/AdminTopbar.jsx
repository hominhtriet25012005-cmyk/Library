import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
  ListSubheader,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../auth/useAuth";
import { adminPageForPath } from "./adminNavigation";
import { adminDrawerWidth } from "./AdminSidebar";

const AdminTopbar = ({ onMenuClick, density, onDensityChange }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
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
        borderBottom: "1px solid #e2e8f0",
        bgcolor: "#ffffff",
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
            sx={{ fontWeight: 700, color: "#172b4d" }}
          >
            {page?.title ?? "Quản trị thư viện"}
          </Typography>
        </Box>

        <Tooltip title="Chưa có API thông báo; không hiển thị dữ liệu giả">
          <span>
            <IconButton aria-label="Thông báo chưa triển khai" disabled>
              <NotificationsNoneRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
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
              sx={{ width: 34, height: 34, bgcolor: "#1769ff", fontSize: 15 }}
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
