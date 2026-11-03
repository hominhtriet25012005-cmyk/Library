import { Box, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";

const AuthShell = ({ title, subtitle, children }) => (
  <Box
    component="main"
    sx={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 10% 20%, #eff6ff 0%, #f8fafc 90%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      px: { xs: 2, sm: 3, md: 4 },
      py: { xs: 4, md: 6 },
    }}
  >
    <Paper
      elevation={0}
      component="section"
      sx={{
        width: "100%",
        maxWidth: 960,
        borderRadius: 4.5,
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
      }}
    >
      {/* CỘT TRÁI: BRANDING BANNER (Hiển thị trên Desktop / Tablet ngang) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: 5,
          background: "linear-gradient(145deg, #102d62 0%, #0d234d 100%)",
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-20%",
            right: "-20%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(23, 105, 255, 0.3) 0%, transparent 70%)",
            pointerEvents: "none",
          },
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "#1769ff",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(23, 105, 255, 0.4)",
              }}
            >
              <AutoStoriesRoundedIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.1 }}
              >
                THƯ VIỆN SỐ
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.65)", fontWeight: 500 }}
              >
                Library Management System
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="h4"
            sx={{ fontWeight: 800, lineHeight: 1.25, mb: 2 }}
          >
            Kết Nối Tri Thức, Đồng Hành Học Tập
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.6, mb: 4 }}
          >
            Hệ thống quản lý và tra cứu tài liệu học tập dành cho sinh viên,
            giảng viên và bạn đọc đại học.
          </Typography>

          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CheckCircleRoundedIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}
              >
                Tra cứu & Mượn sách trực tuyến nhanh chóng
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <SecurityRoundedIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}
              >
                Cổng thanh toán VietQR Napas 24/7 bảo mật
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <SpeedRoundedIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}
              >
                Xếp hàng đặt giữ & Gia hạn mượn tự động
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Typography
          variant="caption"
          sx={{ color: "rgba(255, 255, 255, 0.5)", pt: 4 }}
        >
          © 2026 Library Management System. Đề tài Khóa luận tốt nghiệp CNTT.
        </Typography>
      </Box>

      {/* CỘT PHẢI: FORM CHÍNH */}
      <Box
        sx={{
          p: { xs: 3.5, sm: 5 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#64748b",
              textDecoration: "none",
              "&:hover": { color: "#1769ff" },
              transition: "color 0.2s",
            }}
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
            Trang chủ
          </Box>

          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 2,
                bgcolor: "rgba(23, 105, 255, 0.1)",
                color: "#1769ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AutoStoriesRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, color: "#102d62" }}
            >
              LMS
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: "#0f172a", mb: 0.5 }}
        >
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", mb: 3.5 }}>
          {subtitle}
        </Typography>

        {children}
      </Box>
    </Paper>
  </Box>
);

export default AuthShell;
