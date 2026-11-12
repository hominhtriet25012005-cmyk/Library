import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import LocalLibraryRoundedIcon from "@mui/icons-material/LocalLibraryRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../../auth/useAuth";
import { adminNavigationSections, isAdminNavActive } from "./adminNavigation";

export const adminDrawerWidth = 232;

const icons = {
  dashboard: <DashboardRoundedIcon />,
  books: <AutoStoriesRoundedIcon />,
  genres: <CategoryRoundedIcon />,
  users: <PeopleRoundedIcon />,
  loans: <LocalLibraryRoundedIcon />,
  reservations: <EventAvailableRoundedIcon />,
  reviews: <RateReviewRoundedIcon />,
  subscriptions: <WorkspacePremiumRoundedIcon />,
  fines: <ReceiptLongRoundedIcon />,
  payments: <PaymentsRoundedIcon />,
};

const AdminSidebarContent = ({ onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const logout = () => {
    signOut();
    onNavigate?.();
    navigate("/login", { replace: true });
  };

  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#1e3a30",
        color: "white",
      }}
    >
      {/* 1. Header Thương hiệu Admin (Bấm vào để quay về Trang chủ Public) */}
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
            gap: 1.25,
            px: 2.25,
            py: 2.5,
            flexShrink: 0,
            textDecoration: "none",
            color: "inherit",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.08)",
              "& .admin-logo-box": {
                transform: "scale(1.05)",
                borderColor: "#d4bc8b",
                boxShadow: "0 4px 16px rgba(169, 130, 71, 0.45)",
              },
              "& .admin-logo-title": {
                color: "#d4bc8b",
              },
            },
          }}
        >
          <Box
            className="admin-logo-box"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "#315B4C",
              border: "1px solid #A98247",
              transition: "all 0.2s ease-in-out",
            }}
          >
            <MenuBookRoundedIcon />
          </Box>
          <Box>
            <Typography
              className="admin-logo-title"
              sx={{
                fontWeight: 700,
                lineHeight: 1.2,
                transition: "color 0.2s ease-in-out",
              }}
            >
              Thư viện
            </Typography>
            <Typography variant="caption" sx={{ color: "#c8dcd3" }}>
              KHU QUẢN TRỊ
            </Typography>
          </Box>
        </Box>
      </Tooltip>

      <Box
        component="nav"
        aria-label="Điều hướng quản trị"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehaviorY: "contain",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
          px: 1.25,
          pb: 2,
        }}
      >
        {adminNavigationSections.map((section) => (
          <Box key={section.title} sx={{ mb: 1.5 }}>
            <Typography
              variant="overline"
              sx={{
                display: "block",
                px: 1.5,
                py: 0.5,
                color: "#d4bc8b",
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {section.title}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => (
                <ListItemButton
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  selected={isAdminNavActive(item.path, location.pathname)}
                  onClick={onNavigate}
                  sx={{
                    minHeight: 44,
                    borderRadius: 2,
                    mb: 0.5,
                    px: 1.5,
                    color: "#e5eeff",
                    "& .MuiListItemIcon-root": { color: "#c4dbd0" },
                    "&.Mui-selected, &.Mui-selected:hover": {
                      bgcolor: "rgba(169, 130, 71, 0.24)",
                      color: "white",
                    },
                    "&.Mui-selected .MuiListItemIcon-root": { color: "white" },
                    "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38 }}>
                    {icons[item.icon]}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          px: 1.25,
          py: 1.25,
          borderTop: "1px solid rgba(255,255,255,0.14)",
          flexShrink: 0,
        }}
      >
        <ListItemButton
          component={RouterLink}
          to="/user"
          onClick={onNavigate}
          sx={{ borderRadius: 2, color: "#e5eeff" }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: "#c4dbd0" }}>
            <SwapHorizRoundedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Giao diện người dùng"
            primaryTypographyProps={{ fontSize: 14 }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={logout}
          sx={{ borderRadius: 2, color: "#e5eeff" }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: "#c4dbd0" }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Đăng xuất"
            primaryTypographyProps={{ fontSize: 14 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
};

const AdminSidebar = ({ mobileOpen, onClose }) => (
  <Box
    component="aside"
    sx={{ width: { md: adminDrawerWidth }, flexShrink: { md: 0 } }}
  >
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": {
          width: adminDrawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <AdminSidebarContent onNavigate={onClose} />
    </Drawer>
    <Drawer
      variant="permanent"
      open
      sx={{
        display: { xs: "none", md: "block" },
        "& .MuiDrawer-paper": {
          width: adminDrawerWidth,
          boxSizing: "border-box",
          border: 0,
        },
      }}
    >
      <AdminSidebarContent />
    </Drawer>
  </Box>
);

export default AdminSidebar;
