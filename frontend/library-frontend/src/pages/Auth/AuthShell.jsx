import { Box, Paper, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";

const AuthShell = ({ title, subtitle, children, maxWidth = 480 }) => (
  <Box
    component="main"
    sx={{
      minHeight: "100vh",
      bgcolor: (theme) =>
        theme.palette.mode === "dark" ? "#090d16" : "#f1f5f9",
      background: (theme) =>
        theme.palette.mode === "dark"
          ? "radial-gradient(circle at 50% 15%, #111827 0%, #090d16 100%)"
          : "radial-gradient(circle at 50% 15%, #e0e7ff 0%, #f1f5f9 55%, #e2e8f0 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      px: { xs: 2, sm: 3 },
      py: { xs: 4, sm: 6 },
    }}
  >
    <Paper
      elevation={0}
      component="section"
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", sm: maxWidth },
        borderRadius: 4,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 20px 45px -10px rgba(0, 0, 0, 0.7)"
            : "0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)",
        p: { xs: 3, sm: 4.5 },
      }}
    >
      {/* Logo Thư viện số căn giữa */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          pt: { xs: 0.5, sm: 1 },
          mb: 2,
        }}
      >
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.5,
            textDecoration: "none",
            mb: 1,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              bgcolor: "primary.main",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(23, 105, 255, 0.35)",
            }}
          >
            <AutoStoriesRoundedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              letterSpacing: 0.5,
              color: "text.primary",
              fontSize: "1.25rem",
            }}
          >
            THƯ VIỆN SỐ
          </Typography>
        </Box>

        {title && (
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              mt: 0.5,
              mb: 0.5,
              fontSize: { xs: "1.35rem", sm: "1.5rem" },
            }}
          >
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              maxWidth: 400,
              lineHeight: 1.5,
              fontSize: "0.875rem",
              mt: 0.5,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Nội dung Form */}
      {children}
    </Paper>

    <Box sx={{ mt: 3, textAlign: "center" }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        © 2026 Thư viện số · Hệ thống quản lý thư viện hiện đại
      </Typography>
    </Box>
  </Box>
);

export default AuthShell;
