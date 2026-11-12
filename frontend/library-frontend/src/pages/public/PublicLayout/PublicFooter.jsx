import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import {
  publicFonts,
  publicNavigationItems,
  publicPalette,
} from "./publicTheme";

const footerReaderLinks = [
  { label: "Hướng dẫn mượn sách", to: "/#huong-dan-muon" },
  { label: "Quy định mượn trả", to: "/about#quy-dinh-chung" },
  { label: "Câu hỏi thường gặp", to: "/contact#faq" },
];

const linkSx = {
  color: publicPalette.textSecondary,
  textDecoration: "none",
  fontSize: "0.9rem",
  lineHeight: 1.6,
  transition: "color 0.2s ease",
  "&:hover": {
    color: publicPalette.primary,
  },
  "&:focus-visible": {
    outline: `2px solid ${publicPalette.accent}`,
    outlineOffset: 2,
    borderRadius: 1,
  },
};

const PublicFooter = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        bgcolor: publicPalette.surfaceMuted,
        borderTop: `1px solid ${publicPalette.border}`,
        color: publicPalette.textPrimary,
        pt: { xs: 6, md: 8 },
        pb: { xs: 4, md: 5 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "1.5fr 1fr 1fr 1.2fr",
            },
            gap: { xs: 4, md: 5 },
            mb: { xs: 4, md: 6 },
          }}
        >
          {/* CỘT 1: THƯƠNG HIỆU & MÔ TẢ */}
          <Box>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  bgcolor: publicPalette.primary,
                  color: "#FAF8F3",
                  border: `1px solid ${publicPalette.accent}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AutoStoriesOutlinedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography
                sx={{
                  fontFamily: publicFonts.serif,
                  fontWeight: 700,
                  fontSize: "1.08rem",
                  color: publicPalette.textPrimary,
                }}
              >
                Thư viện Kinh sách Phật giáo
              </Typography>
            </Stack>

            <Typography
              variant="body2"
              sx={{
                color: publicPalette.textSecondary,
                lineHeight: 1.7,
                maxWidth: 340,
              }}
            >
              Nền tảng lưu giữ, hệ thống hóa và hỗ trợ bạn đọc tra cứu, tiếp cận
              kinh điển cùng tài liệu Phật học một cách thuận tiện, có trách
              nhiệm.
            </Typography>
          </Box>

          {/* CỘT 2: ĐIỀU HƯỚNG CHÍNH */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: publicPalette.textPrimary,
                mb: 2,
                letterSpacing: "0.02em",
              }}
            >
              Điều hướng
            </Typography>
            <Stack spacing={1.15}>
              {publicNavigationItems.map((item) => (
                <Box
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  sx={linkSx}
                >
                  {item.label}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* CỘT 3: HƯỚNG DẪN & QUY ĐỊNH */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: publicPalette.textPrimary,
                mb: 2,
                letterSpacing: "0.02em",
              }}
            >
              Thông tin bạn đọc
            </Typography>
            <Stack spacing={1.15}>
              {footerReaderLinks.map((item) => (
                <Box
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  sx={linkSx}
                >
                  {item.label}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* CỘT 4: THÔNG TIN LIÊN HỆ XÁC THỰC / ĐANG CẬP NHẬT */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: publicPalette.textPrimary,
                mb: 2,
                letterSpacing: "0.02em",
              }}
            >
              Thông tin liên hệ
            </Typography>
            <Stack spacing={1.15}>
              <Typography
                variant="body2"
                sx={{ color: publicPalette.textSecondary, fontSize: "0.88rem" }}
              >
                <Box
                  component="strong"
                  sx={{ color: publicPalette.textPrimary, fontWeight: 600 }}
                >
                  Địa điểm:{" "}
                </Box>
                Đang cập nhật
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: publicPalette.textSecondary, fontSize: "0.88rem" }}
              >
                <Box
                  component="strong"
                  sx={{ color: publicPalette.textPrimary, fontWeight: 600 }}
                >
                  Điện thoại / Email:{" "}
                </Box>
                Đang cập nhật
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: publicPalette.textSecondary, fontSize: "0.88rem" }}
              >
                <Box
                  component="strong"
                  sx={{ color: publicPalette.textPrimary, fontWeight: 600 }}
                >
                  Hỗ trợ trực tuyến:{" "}
                </Box>
                <Box
                  component={RouterLink}
                  to="/contact"
                  sx={{
                    color: publicPalette.primary,
                    fontWeight: 600,
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Gửi câu hỏi tại trang Liên hệ
                </Box>
              </Typography>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ borderColor: publicPalette.border, mb: 3 }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: publicPalette.textSecondary, fontSize: "0.82rem" }}
          >
            © 2026 Thư viện Kinh sách Phật giáo — Đồ án tốt nghiệp.
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: publicPalette.textSecondary, fontSize: "0.82rem" }}
          >
            Gìn giữ tri thức · Tiếp cận thuận tiện · Tôn trọng và chia sẻ
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicFooter;
