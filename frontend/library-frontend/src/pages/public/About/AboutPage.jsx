import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

import { api } from "../../../api/client";
import { booksApi } from "../../../api/books";
import PublicLayout from "../PublicLayout/PublicLayout";
import { publicFonts, publicPalette } from "../PublicLayout/publicTheme";

const coreValues = [
  {
    title: "Gìn giữ tri thức",
    description:
      "Hệ thống hóa thông tin thư mục rõ ràng cho từng ấn phẩm kinh điển, luật tạng, luận giải và tài liệu nghiên cứu Phật học.",
  },
  {
    title: "Tiếp cận thuận tiện",
    description:
      "Hỗ trợ bạn đọc tra cứu trực tuyến theo tên kinh, tác giả, dịch giả hoặc chủ đề và kiểm tra tình trạng bản in trước khi mượn.",
  },
  {
    title: "Tôn trọng và chia sẻ",
    description:
      "Khuyến khích ý thức bảo quản kinh sách cẩn thận, mượn trả đúng hạn để nhiều độc giả cùng có cơ hội tiếp cận nguồn tư liệu.",
  },
];

const targetAudiences = [
  {
    title: "Tăng Ni & Phật tử",
    description:
      "Tra cứu kinh tạng, luật tạng, luận tạng và các ấn phẩm hành trì, tu học hằng ngày.",
  },
  {
    title: "Sinh viên & Người nghiên cứu",
    description:
      "Tìm kiếm tài liệu lịch sử Phật giáo, triết học phương Đông, văn học và các công trình dịch thuật học thuật.",
  },
  {
    title: "Độc giả quan tâm Phật học",
    description:
      "Tiếp cận các đầu sách ứng dụng chánh niệm, đạo đức sống và văn hóa Phật giáo một cách gần gũi, rõ ràng.",
  },
];

const bibliographyFields = [
  {
    label: "Tên kinh / Tên ấn phẩm",
    detail:
      "Ghi nhận đầy đủ nhan đề chính thức giúp phân biệt các bản dịch hoặc ấn bản khác nhau.",
  },
  {
    label: "Tác giả / Dịch giả / Người biên soạn",
    detail:
      "Lưu trữ thông tin chư Tổ, dịch giả, học giả hoặc ban biên dịch thực hiện ấn phẩm.",
  },
  {
    label: "Chủ đề & Thể loại thư mục",
    detail:
      "Phân nhóm theo hệ thống danh mục thực tế trong cơ sở dữ liệu để lọc nhanh theo nhu cầu đọc.",
  },
  {
    label: "Thông tin xuất bản & Ngôn ngữ",
    detail:
      "Bao gồm nhà xuất bản, năm/ngày xuất bản, ngôn ngữ trình bày, số trang và mã ISBN (nếu có).",
  },
  {
    label: "Tình trạng bản in tại thư viện",
    detail:
      "Cập nhật số lượng bản in hiện còn sẵn sàng cho mượn và tổng số bản lưu trữ trong kho.",
  },
];

const usageSteps = [
  {
    step: "01",
    title: "Tra cứu",
    description:
      "Tìm kiếm ấn phẩm tại Trang chủ hoặc Kho kinh sách theo từ khóa, tác giả/dịch giả và chủ đề.",
  },
  {
    step: "02",
    title: "Xem chi tiết",
    description:
      "Đọc phần giới thiệu nội dung, thông tin xuất bản, đánh giá từ bạn đọc và số bản in hiện còn.",
  },
  {
    step: "03",
    title: "Đăng nhập",
    description:
      "Đăng nhập tài khoản bạn đọc để thực hiện các thao tác mượn sách, đặt giữ hoặc lưu danh sách yêu thích.",
  },
  {
    step: "04",
    title: "Gửi yêu cầu",
    description:
      "Đăng ký mượn khi sách còn bản in hoặc xếp hàng đặt giữ trực tuyến khi ấn phẩm tạm thời được mượn hết.",
  },
  {
    step: "05",
    title: "Theo dõi và trả sách",
    description:
      "Theo dõi hạn trả trong khu vực bạn đọc, gia hạn khi đủ điều kiện, hoàn trả đúng hạn và gửi đánh giá.",
  },
];

const generalRegulations = [
  "Giữ gìn kinh sách và tài liệu cẩn thận: không gấp trang, không viết vẽ, gạch xóa hoặc làm hư hại ấn phẩm trong suốt thời gian mượn.",
  "Hoàn trả đúng thời hạn quy định: theo dõi ngày hẹn trả trong mục Sách đang mượn; thực hiện gia hạn trước khi quá hạn nếu ấn phẩm chưa có bạn đọc khác đặt giữ.",
  "Đặt giữ có trách nhiệm: khi sách tạm hết bản in, bạn đọc có thể xếp hàng đặt giữ và nhận sách trong thời gian giữ chỗ khi thư viện thông báo có bản trả về.",
  "Tôn trọng không gian đọc và cộng đồng bạn đọc: chia sẻ nhận xét khách quan, văn minh sau khi hoàn tất đọc và trả sách.",
];

export const AboutPage = () => {
  const location = useLocation();
  const [liveStats, setLiveStats] = useState(null);
  const [liveGenres, setLiveGenres] = useState([]);

  useEffect(() => {
    if (location.hash === "#quy-dinh-chung") {
      const target = document.getElementById("quy-dinh-chung");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location.hash]);

  // Chỉ hiển thị số liệu nguồn tư liệu khi API thật trả về dữ liệu hợp lệ
  useEffect(() => {
    const controller = new AbortController();

    Promise.allSettled([
      api.get("/api/books/stats", { signal: controller.signal }),
      booksApi.genres({ signal: controller.signal }),
    ]).then(([statsRes, genresRes]) => {
      if (controller.signal.aborted) return;

      if (
        statsRes.status === "fulfilled" &&
        Number.isSafeInteger(statsRes.value?.totalActiveBooks) &&
        Number.isSafeInteger(statsRes.value?.totalAvailableBooks)
      ) {
        setLiveStats({
          totalActiveBooks: statsRes.value.totalActiveBooks,
          totalAvailableBooks: statsRes.value.totalAvailableBooks,
        });
      }

      if (genresRes.status === "fulfilled" && Array.isArray(genresRes.value)) {
        setLiveGenres(
          genresRes.value.filter((item) => item && item.active !== false),
        );
      }
    });

    return () => controller.abort();
  }, []);

  return (
    <PublicLayout>
      {/* 1. HERO */}
      <Box
        component="section"
        sx={{
          py: { xs: 5, md: 7.5 },
          bgcolor: publicPalette.surface,
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              maxWidth: 780,
              mx: "auto",
              textAlign: "center",
            }}
          >
            <Typography
              variant="overline"
              sx={{
                display: "inline-block",
                color: publicPalette.accentDark,
                bgcolor: publicPalette.accentLight,
                border: `1px solid ${publicPalette.border}`,
                px: 1.5,
                py: 0.35,
                borderRadius: "8px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                fontSize: "0.75rem",
                mb: 2,
              }}
            >
              GIỚI THIỆU HỆ THỐNG
            </Typography>

            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontFamily: publicFonts.serif,
                fontWeight: 700,
                color: publicPalette.textPrimary,
                fontSize: { xs: "1.95rem", sm: "2.5rem" },
                lineHeight: 1.25,
                mb: 2,
              }}
            >
              Về Thư viện Kinh sách Phật giáo
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* 2. SỨ MỆNH & 4. BA GIÁ TRỊ CỐT LÕI */}
      <Box
        component="section"
        sx={{
          py: { xs: 5.5, md: 8 },
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 3, sm: 4.5 },
              mb: 5,
              borderRadius: "16px",
              borderColor: publicPalette.accent,
              bgcolor: publicPalette.surface,
              textAlign: "center",
            }}
          >
            <AutoStoriesOutlinedIcon
              sx={{ fontSize: 38, color: publicPalette.accent, mb: 1.5 }}
            />
            <Typography
              variant="overline"
              sx={{
                display: "block",
                color: publicPalette.accentDark,
                fontWeight: 700,
                letterSpacing: "0.08em",
                mb: 1,
              }}
            >
              SỨ MỆNH HOẠT ĐỘNG
            </Typography>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontFamily: publicFonts.serif,
                fontWeight: 700,
                color: publicPalette.textPrimary,
                fontSize: { xs: "1.35rem", sm: "1.7rem" },
                lineHeight: 1.5,
                maxWidth: 780,
                mx: "auto",
              }}
            >
              “Góp phần lưu giữ, hệ thống hóa và giúp bạn đọc tiếp cận tri thức
              Phật học một cách thuận tiện, có trách nhiệm.”
            </Typography>
          </Paper>

          {/* 4. Ba giá trị */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {coreValues.map((item) => (
              <Paper
                key={item.title}
                variant="outlined"
                sx={{
                  p: 3.25,
                  borderRadius: "14px",
                  borderColor: publicPalette.border,
                  bgcolor: publicPalette.surface,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <VerifiedOutlinedIcon sx={{ color: publicPalette.primary }} />
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontFamily: publicFonts.serif,
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: publicPalette.textPrimary,
                    }}
                  >
                    {item.title}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ color: publicPalette.textSecondary, lineHeight: 1.7 }}
                >
                  {item.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* 3. ĐỐI TƯỢNG PHỤC VỤ & 5. NGUỒN TƯ LIỆU */}
      <Box
        component="section"
        sx={{
          py: { xs: 5.5, md: 8 },
          bgcolor: publicPalette.surface,
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1.15fr" },
              gap: { xs: 4, md: 6 },
              alignItems: "start",
            }}
          >
            {/* 3. Đối tượng phục vụ */}
            <Box>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <GroupsOutlinedIcon sx={{ color: publicPalette.accent }} />
                <Typography
                  variant="overline"
                  sx={{
                    color: publicPalette.accentDark,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                  }}
                >
                  BẠN ĐỌC CỦA THƯ VIỆN
                </Typography>
              </Stack>
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontFamily: publicFonts.serif,
                  fontSize: { xs: "1.5rem", md: "1.8rem" },
                  mb: 1.5,
                }}
              >
                Đối tượng phục vụ
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: publicPalette.textSecondary,
                  mb: 3,
                  lineHeight: 1.7,
                }}
              >
                Hệ thống phục vụ Tăng Ni, Phật tử, sinh viên, độc giả và người
                nghiên cứu quan tâm đến tư liệu Phật học.
              </Typography>

              <Stack spacing={2}>
                {targetAudiences.map((aud) => (
                  <Paper
                    key={aud.title}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: "12px",
                      borderColor: publicPalette.border,
                      bgcolor: publicPalette.background,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: publicPalette.textPrimary,
                        mb: 0.5,
                      }}
                    >
                      {aud.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: publicPalette.textSecondary,
                        lineHeight: 1.65,
                      }}
                    >
                      {aud.description}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* 5. Nguồn tư liệu & Thông tin thư mục */}
            <Box>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <MenuBookOutlinedIcon sx={{ color: publicPalette.accent }} />
                <Typography
                  variant="overline"
                  sx={{
                    color: publicPalette.accentDark,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                  }}
                >
                  CẤU TRÚC THƯ MỤC
                </Typography>
              </Stack>
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontFamily: publicFonts.serif,
                  fontSize: { xs: "1.5rem", md: "1.8rem" },
                  mb: 1.5,
                }}
              >
                Nguồn tư liệu và dữ liệu lưu trữ
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: publicPalette.textSecondary,
                  mb: 2.5,
                  lineHeight: 1.7,
                }}
              >
                Mỗi ấn phẩm trong thư viện được quản lý với bộ thông tin thư mục
                nhất quán để phục vụ tra cứu và theo dõi mượn trả chính xác:
              </Typography>

              {/* Chỉ hiển thị số liệu khi API thật phản hồi hợp lệ */}
              {(liveStats || liveGenres.length > 0) && (
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ mb: 2.5, flexWrap: "wrap", rowGap: 1 }}
                >
                  {liveStats && (
                    <>
                      <Chip
                        label={`${liveStats.totalActiveBooks} đầu sách đang phục vụ`}
                        sx={{
                          bgcolor: publicPalette.primaryLight,
                          color: publicPalette.primary,
                          fontWeight: 700,
                          borderRadius: "8px",
                        }}
                      />
                      <Chip
                        label={`${liveStats.totalAvailableBooks} đầu sách hiện còn bản in`}
                        sx={{
                          bgcolor: publicPalette.accentLight,
                          color: publicPalette.accentDark,
                          fontWeight: 700,
                          borderRadius: "8px",
                        }}
                      />
                    </>
                  )}
                  {liveGenres.length > 0 && (
                    <Chip
                      label={`${liveGenres.length} chủ đề phân loại`}
                      sx={{
                        bgcolor: publicPalette.surfaceMuted,
                        color: publicPalette.textPrimary,
                        fontWeight: 600,
                        borderRadius: "8px",
                      }}
                    />
                  )}
                </Stack>
              )}

              <Paper
                variant="outlined"
                sx={{
                  p: 2.75,
                  borderRadius: "14px",
                  borderColor: publicPalette.border,
                  bgcolor: publicPalette.background,
                }}
              >
                <Stack
                  spacing={2}
                  divider={
                    <Divider sx={{ borderColor: publicPalette.border }} />
                  }
                >
                  {bibliographyFields.map((field) => (
                    <Box key={field.label}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: publicPalette.primary,
                          mb: 0.35,
                        }}
                      >
                        {field.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: publicPalette.textSecondary,
                          fontSize: "0.88rem",
                        }}
                      >
                        {field.detail}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 6. HƯỚNG DẪN SỬ DỤNG */}
      <Box
        component="section"
        sx={{
          py: { xs: 5.5, md: 8 },
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ maxWidth: 640, mb: 4.5 }}>
            <Typography
              variant="overline"
              sx={{
                color: publicPalette.accentDark,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              QUY TRÌNH TRA CỨU & MƯỢN ĐỌC
            </Typography>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontFamily: publicFonts.serif,
                fontSize: { xs: "1.55rem", md: "1.9rem" },
                mt: 0.5,
                mb: 1,
              }}
            >
              Hướng dẫn sử dụng thư viện
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: publicPalette.textSecondary }}
            >
              5 bước thực hiện từ khi tra cứu danh mục công khai đến khi hoàn
              tất mượn và trả kinh sách.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(5, 1fr)",
              },
              gap: 2.5,
            }}
          >
            {usageSteps.map((item) => (
              <Paper
                key={item.step}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  borderColor: publicPalette.border,
                  bgcolor: publicPalette.surface,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: publicFonts.serif,
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: publicPalette.accent,
                    mb: 1,
                  }}
                >
                  {item.step}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: publicPalette.textPrimary,
                    mb: 0.75,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: publicPalette.textSecondary,
                    fontSize: "0.86rem",
                    lineHeight: 1.6,
                  }}
                >
                  {item.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* 7. QUY ĐỊNH CHUNG (#quy-dinh-chung) & 8. CTA */}
      <Box
        id="quy-dinh-chung"
        component="section"
        sx={{
          py: { xs: 5.5, md: 8 },
          bgcolor: publicPalette.surface,
          scrollMarginTop: "80px",
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 3, sm: 4.5 },
              mb: 5,
              borderRadius: "16px",
              borderColor: publicPalette.border,
              bgcolor: publicPalette.background,
            }}
          >
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{ mb: 1.5 }}
            >
              <GavelOutlinedIcon sx={{ color: publicPalette.primary }} />
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  fontFamily: publicFonts.serif,
                  fontSize: { xs: "1.4rem", sm: "1.65rem" },
                }}
              >
                Quy định chung khi mượn và sử dụng kinh sách
              </Typography>
            </Stack>

            <Typography
              variant="body2"
              sx={{
                color: publicPalette.textSecondary,
                mb: 2.5,
                lineHeight: 1.7,
              }}
            >
              Để nguồn tư liệu Phật học luôn được bảo quản nguyên vẹn và phục vụ
              lâu dài cho cộng đồng bạn đọc, thư viện đề nghị bạn đọc lưu ý các
              nguyên tắc sau:
            </Typography>

            <Stack spacing={1.75}>
              {generalRegulations.map((rule) => (
                <Stack
                  key={rule}
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                >
                  <CheckCircleOutlineRoundedIcon
                    sx={{
                      color: publicPalette.primary,
                      fontSize: 20,
                      mt: 0.3,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: publicPalette.textPrimary,
                      lineHeight: 1.65,
                    }}
                  >
                    {rule}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* 8. CTA: Khám phá kho kinh sách */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3.5, sm: 5 },
              borderRadius: "16px",
              bgcolor: publicPalette.primary,
              color: "#FAF8F3",
              textAlign: "center",
              border: `1px solid ${publicPalette.accent}`,
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontFamily: publicFonts.serif,
                color: "#FAF8F3",
                fontSize: { xs: "1.45rem", sm: "1.8rem" },
                mb: 1.25,
              }}
            >
              Sẵn sàng tra cứu tư liệu Phật học?
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(250, 248, 243, 0.86)",
                maxWidth: 540,
                mx: "auto",
                mb: 3,
              }}
            >
              Truy cập danh mục kinh sách để tìm kiếm theo chủ đề, xem thông tin
              xuất bản và kiểm tra tình trạng bản in hiện có.
            </Typography>
            <Button
              component={RouterLink}
              to="/books"
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                px: 3.5,
                py: 1.25,
                bgcolor: "#FAF8F3",
                color: publicPalette.primary,
                fontWeight: 700,
                "&:hover": {
                  bgcolor: "#FFFFFF",
                },
              }}
            >
              Khám phá kho kinh sách
            </Button>
          </Paper>
        </Container>
      </Box>
    </PublicLayout>
  );
};

export default AboutPage;
