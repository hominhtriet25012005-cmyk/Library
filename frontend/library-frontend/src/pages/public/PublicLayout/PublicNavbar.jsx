import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useAuth } from "../../../auth/useAuth";
import {
  isPublicNavActive,
  publicFonts,
  publicNavigationItems,
  publicPalette,
} from "./publicTheme";

const LotusMark = () => (
  <Box
    component="svg"
    viewBox="0 0 24 24"
    aria-hidden="true"
    sx={{ width: 22, height: 22, fill: "none", stroke: "currentColor" }}
  >
    <path
      d="M12 3.5C10.2 6.4 9.2 9.2 9.2 11.8C9.2 14.1 10.4 15.9 12 17C13.6 15.9 14.8 14.1 14.8 11.8C14.8 9.2 13.8 6.4 12 3.5Z"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.1 11.2C6.8 10.6 4.7 11.5 3.5 13.5C5.5 15.6 8.2 16.8 11.3 17"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.9 11.2C17.2 10.6 19.3 11.5 20.5 13.5C18.5 15.6 15.8 16.8 12.7 17"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M6.5 19.5H17.5" strokeWidth="1.5" strokeLinecap="round" />
  </Box>
);

const PublicNavbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [mobileQuery, setMobileQuery] = useState("");

  const isAdmin = user?.role === "ROLE_ADMIN";
  const accountMenuOpen = Boolean(accountAnchor);

  const handleCloseAccountMenu = () => {
    setAccountAnchor(null);
  };

  const handleNavigate = (path) => {
    handleCloseAccountMenu();
    setMobileOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    handleCloseAccountMenu();
    setMobileOpen(false);
    signOut();
    navigate("/", { replace: true });
  };

  const handleMobileSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = mobileQuery.trim();
    setMobileOpen(false);
    if (trimmed) {
      navigate(`/books?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/books");
    }
  };

  const userInitial =
    user?.fullName?.trim()?.[0]?.toUpperCase() ||
    user?.email?.trim()?.[0]?.toUpperCase() ||
    "B";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(250, 248, 243, 0.94)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${publicPalette.border}`,
        color: publicPalette.textPrimary,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 66, md: 76 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* 1. LOGO & TÊN THƯ VIỆN */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              textDecoration: "none",
              color: "inherit",
              "&:focus-visible": {
                outline: `2px solid ${publicPalette.accent}`,
                outlineOffset: 4,
                borderRadius: 1.5,
              },
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                bgcolor: publicPalette.primary,
                color: "#FAF8F3",
                border: `1px solid ${publicPalette.accent}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <LotusMark />
            </Box>
            <Box>
              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontFamily: publicFonts.serif,
                  fontWeight: 700,
                  fontSize: { xs: "1.02rem", sm: "1.12rem" },
                  color: publicPalette.textPrimary,
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                Thư viện Kinh sách Phật giáo
              </Typography>
            </Box>
          </Box>

          {/* 2. MENU ĐIỀU HƯỚNG DESKTOP (4 MỤC) */}
          <Stack
            component="nav"
            aria-label="Điều hướng chính"
            direction="row"
            spacing={0.75}
            sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}
          >
            {publicNavigationItems.map((item) => {
              const active = isPublicNavActive(item.path, location.pathname);
              return (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: "10px",
                    fontSize: "0.9375rem",
                    fontWeight: active ? 700 : 500,
                    color: active
                      ? publicPalette.primary
                      : publicPalette.textPrimary,
                    bgcolor: active
                      ? publicPalette.primaryLight
                      : "transparent",
                    position: "relative",
                    "&::after": active
                      ? {
                          content: '""',
                          position: "absolute",
                          left: 16,
                          right: 16,
                          bottom: 5,
                          height: 2,
                          borderRadius: 1,
                          bgcolor: publicPalette.accent,
                        }
                      : undefined,
                    "&:hover": {
                      bgcolor: publicPalette.primaryLight,
                      color: publicPalette.primary,
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          {/* 3. KHU VỰC HÀNH ĐỘNG & TÀI KHOẢN BÊN PHẢI */}
          <Stack direction="row" spacing={1.25} alignItems="center">
            {!user ? (
              <Stack
                direction="row"
                spacing={1}
                sx={{ display: { xs: "none", md: "flex" } }}
              >
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  color="primary"
                  sx={{
                    px: 2,
                    py: 0.8,
                    fontSize: "0.875rem",
                    borderColor: publicPalette.primary,
                    color: publicPalette.primary,
                  }}
                >
                  Đăng nhập
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="primary"
                  sx={{
                    px: 2.25,
                    py: 0.8,
                    fontSize: "0.875rem",
                    bgcolor: publicPalette.primary,
                    color: "#FFFFFF",
                    "&:hover": {
                      bgcolor: publicPalette.primaryDark,
                    },
                  }}
                >
                  Đăng ký
                </Button>
              </Stack>
            ) : (
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Button
                  id="public-account-button"
                  aria-controls={
                    accountMenuOpen ? "public-account-menu" : undefined
                  }
                  aria-haspopup="true"
                  aria-expanded={accountMenuOpen ? "true" : undefined}
                  onClick={(event) => setAccountAnchor(event.currentTarget)}
                  endIcon={<KeyboardArrowDownRoundedIcon />}
                  sx={{
                    pl: 1,
                    pr: 1.5,
                    py: 0.6,
                    borderRadius: "24px",
                    border: `1px solid ${publicPalette.border}`,
                    bgcolor: publicPalette.surface,
                    color: publicPalette.textPrimary,
                    "&:hover": {
                      borderColor: publicPalette.primary,
                      bgcolor: publicPalette.primaryLight,
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      mr: 1,
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      bgcolor: publicPalette.primary,
                      color: "#FFFFFF",
                    }}
                  >
                    {userInitial}
                  </Avatar>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      maxWidth: 140,
                      fontWeight: 600,
                      color: publicPalette.textPrimary,
                    }}
                  >
                    {user.fullName || user.email}
                  </Typography>
                </Button>

                <Menu
                  id="public-account-menu"
                  anchorEl={accountAnchor}
                  open={accountMenuOpen}
                  onClose={handleCloseAccountMenu}
                  MenuListProps={{
                    "aria-labelledby": "public-account-button",
                  }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1,
                        minWidth: 215,
                        borderRadius: "12px",
                        border: `1px solid ${publicPalette.border}`,
                        boxShadow: "0 10px 28px rgba(38, 51, 45, 0.1)",
                      },
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.25 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: publicPalette.textPrimary,
                      }}
                      noWrap
                    >
                      {user.fullName || "Tài khoản thư viện"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: publicPalette.textSecondary }}
                      noWrap
                    >
                      {user.email}
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: publicPalette.border }} />

                  {isAdmin ? (
                    <MenuItem
                      onClick={() => handleNavigate("/admin/dashboard")}
                      sx={{ py: 1.1, gap: 1.25, fontWeight: 500 }}
                    >
                      <AdminPanelSettingsOutlinedIcon
                        fontSize="small"
                        sx={{ color: publicPalette.primary }}
                      />
                      Khu quản trị
                    </MenuItem>
                  ) : (
                    [
                      <MenuItem
                        key="reader-area"
                        onClick={() => handleNavigate("/user")}
                        sx={{ py: 1.1, gap: 1.25, fontWeight: 500 }}
                      >
                        <SpaceDashboardOutlinedIcon
                          fontSize="small"
                          sx={{ color: publicPalette.primary }}
                        />
                        Khu vực bạn đọc
                      </MenuItem>,
                      <MenuItem
                        key="reader-profile"
                        onClick={() => handleNavigate("/user/profile")}
                        sx={{ py: 1.1, gap: 1.25, fontWeight: 500 }}
                      >
                        <PersonOutlineRoundedIcon
                          fontSize="small"
                          sx={{ color: publicPalette.primary }}
                        />
                        Tài khoản
                      </MenuItem>,
                    ]
                  )}

                  <Divider sx={{ borderColor: publicPalette.border }} />
                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      py: 1.1,
                      gap: 1.25,
                      color: publicPalette.status.error.text,
                      fontWeight: 600,
                    }}
                  >
                    <LogoutRoundedIcon fontSize="small" />
                    Đăng xuất
                  </MenuItem>
                </Menu>
              </Box>
            )}

            {/* NÚT MỞ DRAWER TRÊN MOBILE */}
            <IconButton
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu điều hướng"
              sx={{
                display: { xs: "inline-flex", md: "none" },
                borderRadius: "10px",
                border: `1px solid ${publicPalette.border}`,
                color: publicPalette.textPrimary,
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </Container>

      {/* DRAWER TRÊN ĐIỆN THOẠI / TABLET NHỎ */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "86vw", sm: 340 },
              maxWidth: 360,
              bgcolor: publicPalette.background,
              color: publicPalette.textPrimary,
              p: 2.5,
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                bgcolor: publicPalette.primary,
                color: "#FAF8F3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AutoStoriesOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography
              sx={{
                fontFamily: publicFonts.serif,
                fontWeight: 700,
                fontSize: "0.98rem",
                color: publicPalette.textPrimary,
              }}
            >
              Thư viện Kinh sách
            </Typography>
          </Stack>
          <IconButton
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
            size="small"
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        {/* Ô tìm kiếm nhanh trên mobile */}
        <Box
          component="form"
          onSubmit={handleMobileSearchSubmit}
          sx={{ mb: 2 }}
        >
          <TextField
            fullWidth
            size="small"
            value={mobileQuery}
            onChange={(event) => setMobileQuery(event.target.value)}
            placeholder="Tìm kinh sách, tác giả..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon
                    sx={{ fontSize: 19, color: publicPalette.textSecondary }}
                  />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider sx={{ borderColor: publicPalette.border, mb: 1.5 }} />

        <List disablePadding sx={{ flexGrow: 1 }}>
          {publicNavigationItems.map((item) => {
            const active = isPublicNavActive(item.path, location.pathname);
            return (
              <ListItemButton
                key={item.path}
                component={RouterLink}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                selected={active}
                sx={{
                  borderRadius: "10px",
                  mb: 0.5,
                  py: 1.15,
                  "&.Mui-selected": {
                    bgcolor: publicPalette.primaryLight,
                    color: publicPalette.primary,
                    "&:hover": {
                      bgcolor: publicPalette.primaryLight,
                    },
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.95rem",
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ borderColor: publicPalette.border, my: 2 }} />

        {!user ? (
          <Stack spacing={1.25}>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              fullWidth
              onClick={() => setMobileOpen(false)}
              sx={{
                py: 1,
                borderColor: publicPalette.primary,
                color: publicPalette.primary,
              }}
            >
              Đăng nhập
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              fullWidth
              onClick={() => setMobileOpen(false)}
              sx={{
                py: 1,
                bgcolor: publicPalette.primary,
                color: "#FFFFFF",
              }}
            >
              Đăng ký tài khoản
            </Button>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "10px",
                bgcolor: publicPalette.surface,
                border: `1px solid ${publicPalette.border}`,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {user.fullName || "Tài khoản thư viện"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: publicPalette.textSecondary }}
                noWrap
              >
                {user.email}
              </Typography>
            </Box>

            {isAdmin ? (
              <Button
                variant="contained"
                fullWidth
                startIcon={<AdminPanelSettingsOutlinedIcon />}
                onClick={() => handleNavigate("/admin/dashboard")}
                sx={{ bgcolor: publicPalette.primary }}
              >
                Khu quản trị
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<SpaceDashboardOutlinedIcon />}
                  onClick={() => handleNavigate("/user")}
                  sx={{ bgcolor: publicPalette.primary }}
                >
                  Khu vực bạn đọc
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PersonOutlineRoundedIcon />}
                  onClick={() => handleNavigate("/user/profile")}
                  sx={{
                    borderColor: publicPalette.primary,
                    color: publicPalette.primary,
                  }}
                >
                  Tài khoản
                </Button>
              </>
            )}

            <Button
              variant="text"
              fullWidth
              startIcon={<LogoutRoundedIcon />}
              onClick={handleLogout}
              sx={{ color: publicPalette.status.error.text, fontWeight: 600 }}
            >
              Đăng xuất
            </Button>
          </Stack>
        )}
      </Drawer>
    </AppBar>
  );
};

export default PublicNavbar;
