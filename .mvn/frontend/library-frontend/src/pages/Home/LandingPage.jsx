import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import BookmarkAddedRoundedIcon from "@mui/icons-material/BookmarkAddedRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import { useAuth } from "../../auth/useAuth";

export const LandingPage = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: SearchRoundedIcon,
      title: "Tra cứu kho sách đa chiều",
      desc: "Tìm kiếm nhanh chóng theo tên sách, tác giả, thể loại và theo dõi tình trạng còn bản in trong thời gian thực.",
      color: "#1769ff",
    },
    {
      icon: BookmarkAddedRoundedIcon,
      title: "Xếp hàng đặt giữ thông minh",
      desc: "Tự động ghi nhận thứ tự ưu tiên (Queue) khi sách đang được mượn hết. Thông báo ngay khi có độc giả trả sách.",
      color: "#0284c7",
    },
    {
      icon: QrCode2RoundedIcon,
      title: "Thanh toán VietQR PayOS",
      desc: "Nạp gói hội viên và xử lý phí vi phạm tự động qua chuẩn VietQR Napas 24/7 không cần chờ thủ thư xác nhận thủ công.",
      color: "#16a34a",
    },
    {
      icon: RateReviewRoundedIcon,
      title: "Đánh giá & Xếp hạng sách",
      desc: "Độc giả để lại cảm nhận và chấm điểm sao sau mỗi lần đọc, giúp xây dựng cộng đồng bạn đọc tích cực và văn minh.",
      color: "#f59e0b",
    },
  ];

  const workflow = [
    {
      step: "01",
      title: "Khám phá & Chọn sách",
      desc: "Duyệt danh mục tài liệu, xem tóm tắt, xếp hạng và vị trí sách trên kệ.",
    },
    {
      step: "02",
      title: "Mượn hoặc Đặt trước",
      desc: "Mượn trực tiếp tại quầy hoặc đăng ký xếp hàng trực tuyến khi hết bản in.",
    },
    {
      step: "03",
      title: "Đọc & Gia hạn online",
      desc: "Theo dõi hạn trả trong tài khoản cá nhân, xin gia hạn thêm ngày chỉ với một chạm.",
    },
    {
      step: "04",
      title: "Hoàn trả & Đánh giá",
      desc: "Trả sách đúng hạn, nâng cao điểm tín nhiệm và chia sẻ góc nhìn với độc giả khác.",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 1. TOP NAVIGATION BAR */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          color: "#0f172a",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{ height: 72, justifyContent: "space-between" }}
          >
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  bgcolor: "#1769ff",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(23, 105, 255, 0.35)",
                }}
              >
                <AutoStoriesRoundedIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, color: "#102d62", lineHeight: 1.1 }}
                >
                  THƯ VIỆN SỐ
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontWeight: 600, letterSpacing: 0.5 }}
                >
                  Library Management System
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                component={RouterLink}
                to="/demo"
                variant="outlined"
                size="small"
                sx={{
                  display: { xs: "none", sm: "inline-flex" },
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  borderColor: "#cbd5e1",
                  color: "#334155",
                }}
              >
                Bản xem thử (Demo)
              </Button>

              {user ? (
                <Button
                  component={RouterLink}
                  to={user.role === "ROLE_ADMIN" ? "/admin" : "/user"}
                  variant="contained"
                  size="small"
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2.5,
                  }}
                >
                  Vào trang{" "}
                  {user.role === "ROLE_ADMIN" ? "Quản trị" : "Bạn đọc"}
                </Button>
              ) : (
                <>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="text"
                    size="small"
                    startIcon={<LoginRoundedIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/register"
                    variant="contained"
                    size="small"
                    startIcon={<PersonAddRoundedIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 2,
                      display: { xs: "none", md: "inline-flex" },
                    }}
                  >
                    Đăng ký
                  </Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* 2. HERO SECTION */}
      <Box
        component="section"
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 10 },
          background:
            "radial-gradient(circle at 50% 0%, #eff6ff 0%, #f8fafc 70%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 840, mx: "auto", textAlign: "center" }}>
            <Chip
              icon={
                <WorkspacePremiumRoundedIcon
                  sx={{ fontSize: "16px !important" }}
                />
              }
              label="Hệ Thống Quản Lý Thư Viện Đại Học 4.0"
              color="primary"
              variant="outlined"
              sx={{
                mb: 3,
                fontWeight: 700,
                bgcolor: "rgba(23, 105, 255, 0.06)",
                border: "1px solid #bfdbfe",
                px: 1,
              }}
            />

            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 900,
                color: "#102d62",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                fontSize: { xs: "2.25rem", sm: "3.25rem", md: "3.75rem" },
                mb: 3,
              }}
            >
              Nền Tảng Quản Lý Thư Viện & Khám Phá Tri Thức Số
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: "#475569",
                fontWeight: 400,
                lineHeight: 1.6,
                fontSize: { xs: "1rem", sm: "1.2rem" },
                mb: 5,
                maxWidth: 720,
                mx: "auto",
              }}
            >
              Giải pháp toàn diện kết nối độc giả với kho tàng tri thức. Tự động
              hóa quy trình mượn trả, đặt trước sách, gói hội viên linh hoạt và
              cổng thanh toán <strong>VietQR PayOS</strong> bảo mật.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 6 }}
            >
              <Button
                component={RouterLink}
                to="/demo"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  py: 1.6,
                  px: 3.5,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  fontSize: "1rem",
                  textTransform: "none",
                  boxShadow: "0 8px 24px rgba(23, 105, 255, 0.25)",
                }}
              >
                Khám phá bản Demo ngay
              </Button>

              <Button
                component={RouterLink}
                to={
                  user
                    ? user.role === "ROLE_ADMIN"
                      ? "/admin"
                      : "/user"
                    : "/login"
                }
                variant="outlined"
                size="large"
                sx={{
                  py: 1.6,
                  px: 3.5,
                  borderRadius: 2.5,
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                  bgcolor: "#ffffff",
                  borderColor: "#cbd5e1",
                  color: "#1e293b",
                  "&:hover": { bgcolor: "#f8fafc", borderColor: "#94a3b8" },
                }}
              >
                {user ? "Truy cập tài khoản" : "Đăng nhập hệ thống"}
              </Button>
            </Stack>

            {/* Quick Metrics Bar */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 4,
                border: "1px solid #e2e8f0",
                bgcolor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.05)",
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2.5,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: "#1769ff" }}
                >
                  15,000+
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontWeight: 600 }}
                >
                  Đầu sách & Tài liệu
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: "#16a34a" }}
                >
                  100%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontWeight: 600 }}
                >
                  Số hóa Mượn & Trả
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: "#f59e0b" }}
                >
                  24/7
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontWeight: 600 }}
                >
                  Cổng VietQR Napas
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: "#0284c7" }}
                >
                  99.8%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontWeight: 600 }}
                >
                  Độc giả hài lòng
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* 3. CORE FEATURES SECTION */}
      <Box
        component="section"
        sx={{ py: { xs: 8, md: 10 }, bgcolor: "#ffffff" }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", maxWidth: 640, mx: "auto", mb: 6 }}>
            <Typography
              variant="overline"
              sx={{ color: "#1769ff", fontWeight: 700, letterSpacing: 1.5 }}
            >
              TÍNH NĂNG VƯỢT TRỘI
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, color: "#102d62", mt: 0.5, mb: 1.5 }}
            >
              Hiện Đại Hóa Toàn Diện Thư Viện
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b" }}>
              Được thiết kế tối ưu hóa trải nghiệm đọc sách cho giảng viên, sinh
              viên và đơn giản hóa quy trình nghiệp vụ của ban quản trị.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 3.5,
                    borderRadius: 3.5,
                    border: "1px solid #e2e8f0",
                    transition: "all 0.25s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 28px -6px rgba(0, 0, 0, 0.08)",
                      borderColor: item.color,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2.5,
                      bgcolor: `${item.color}15`,
                      color: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2.5,
                    }}
                  >
                    <Icon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "#0f172a", mb: 1.5 }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#64748b", lineHeight: 1.6 }}
                  >
                    {item.desc}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* 4. WORKFLOW SECTION */}
      <Box
        component="section"
        sx={{ py: { xs: 8, md: 10 }, bgcolor: "#f8fafc" }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", maxWidth: 640, mx: "auto", mb: 6 }}>
            <Typography
              variant="overline"
              sx={{ color: "#1769ff", fontWeight: 700, letterSpacing: 1.5 }}
            >
              QUY TRÌNH TINH GỌN
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, color: "#102d62", mt: 0.5, mb: 1.5 }}
            >
              4 Bước Mượn Sách Đơn Giản
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b" }}>
              Từ khâu tra cứu trực tuyến đến khi cầm tài liệu trên tay đều được
              vận hành mượt mà, minh bạch.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {workflow.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 3,
                  borderRadius: 3.5,
                  bgcolor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  position: "relative",
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    color: "rgba(23, 105, 255, 0.15)",
                    lineHeight: 1,
                    mb: 1.5,
                  }}
                >
                  {item.step}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 750, color: "#0f172a", mb: 1 }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#64748b", lineHeight: 1.6 }}
                >
                  {item.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* 5. TECH HIGHLIGHTS BANNER */}
      <Box
        component="section"
        sx={{ py: 6, bgcolor: "#102d62", color: "#ffffff" }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 4,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                Khóa Luận Tốt Nghiệp Ngành Công Nghệ Thông Tin
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "#93c5fd", maxWidth: 650 }}
              >
                Hệ thống Quản lý Thư viện – Xây dựng trên nền tảng kiến trúc
                phần mềm chuẩn mực: React 19, Vite, Material UI v6, Tailwind
                CSS, Spring Boot RESTful API và Cổng thanh toán trực tuyến
                PayOS.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/demo"
              variant="contained"
              size="large"
              sx={{
                bgcolor: "#1769ff",
                color: "#ffffff",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2.5,
                px: 3.5,
                py: 1.4,
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "#0d4ed3" },
              }}
            >
              Trải nghiệm bản Demo
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 6. FOOTER */}
      <Box
        component="footer"
        sx={{ py: 4, bgcolor: "#0b1935", color: "#94a3b8", mt: "auto" }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <Typography variant="body2">
              © 2026 <strong>Library Management System</strong>. Đề tài Khóa
              luận tốt nghiệp Kỹ thuật CNTT.
            </Typography>
            <Stack direction="row" spacing={3}>
              <RouterLink
                to="/demo"
                style={{
                  color: "#94a3b8",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                }}
              >
                Bản xem thử
              </RouterLink>
              <RouterLink
                to="/login"
                style={{
                  color: "#94a3b8",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                }}
              >
                Đăng nhập
              </RouterLink>
              <RouterLink
                to="/register"
                style={{
                  color: "#94a3b8",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                }}
              >
                Đăng ký
              </RouterLink>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
