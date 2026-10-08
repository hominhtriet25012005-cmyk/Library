import {
  AppBar,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { navigationItems, secondaryItems } from "./NavigationItems";
import { isActive, navigationPath } from "./util";
import { useLocation } from "react-router";
import MenuIcon from "@mui/icons-material/MenuRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { drawerWidth } from "./layout";

const Navbar = ({ handleDrawerToggle, preview = false }) => {
  const location = useLocation();
  const { user } = useAuth();
  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: "white",
        color: "text.primary",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, fontWeight: 600 }}
        >
          {[...navigationItems, ...secondaryItems].find((item) => isActive(navigationPath(item.path, preview), location))
            ?.title || "Tổng quan"}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
          {preview ? "Bản xem thử · dữ liệu mẫu" : "Danh mục và yêu thích: dữ liệu thật"}
        </Typography>
        {!preview && user?.role === "ROLE_ADMIN" && (
          <Button component={RouterLink} to="/admin/dashboard" size="small" startIcon={<AdminPanelSettingsRoundedIcon />} sx={{ ml: 1, whiteSpace: "nowrap" }}>
            Quản trị
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
