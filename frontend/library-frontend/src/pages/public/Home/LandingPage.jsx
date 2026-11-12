import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import BookmarkAddedOutlinedIcon from "@mui/icons-material/BookmarkAddedOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useAuth } from "../../../auth/useAuth";
import { booksApi } from "../../../api/books";
import PublicLayout from "../PublicLayout/PublicLayout";
import { publicFonts, publicPalette } from "../PublicLayout/publicTheme";

const valueHighlights = [
  {
    icon: SearchRoundedIcon,
    title: "Tra cứu tập trung",
    description:
      "Tìm kiếm kinh điển, luận giải và sách Phật học theo tên kinh, tên sách, tác giả hoặc chủ đề thư mục.",
  },
  {
    icon: FactCheckOutlinedIcon,
    title: "Theo dõi tình trạng sách",
    description:
      "Biết rõ số bản in hiện còn tại thư viện để mượn đọc hoặc đăng ký đặt giữ khi sách đang được mượn hết.",
  },
  {
    icon: BookmarkAddedOutlinedIcon,
    title: "Quản lý mượn trả thuận tiện",
    description:
      "Theo dõi tiến trình mượn đọc, thời hạn hoàn trả và lịch sử đọc sách rõ ràng ngay trong tài khoản bạn đọc.",
  },
];

const borrowSteps = [
  {
    step: "01",
    title: "Tra cứu",
    description:
      "Tìm kiếm kinh sách theo từ khóa, tên tác giả/dịch giả hoặc lọc theo chủ đề Phật học quan tâm.",
  },
  {
    step: "02",
    title: "Xem thông tin & tình trạng",
    description:
      "Đọc phần giới thiệu nội dung, thông tin xuất bản và kiểm tra số bản in hiện có tại thư viện.",
  },
  {
    step: "03",
    title: "Gửi yêu cầu mượn / đặt giữ",
    description:
      "Đăng ký mượn bản sách còn sẵn hoặc xếp hàng đặt giữ trực tuyến khi ấn phẩm tạm hết bản in.",
  },
  {
    step: "04",
    title: "Nhận, trả và theo dõi lịch sử",
    description:
      "Nhận sách, theo dõi thời hạn trả từ khu vực bạn đọc, hoàn trả đúng hạn và chia sẻ cảm nhận.",
  },
];

const ScriptureShelfIllustration = () => (
  <Paper
    variant="outlined"
    sx={{
      p: { xs: 3, sm: 4 },
      borderRadius: "16px",
      bgcolor: publicPalette.surface,
      borderColor: publicPalette.border,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 12px 32px rgba(38, 51, 45, 0.05)",
    }}
  >
    {/* Họa tiết hoa sen nét mảnh trang trí góc */}
    <Box
      component="svg"
      viewBox="0 0 120 120"
      aria-hidden="true"
      sx={{
        position: "absolute",
        top: -16,
        right: -16,
        width: 140,
        height: 140,
        opacity: 0.12,
        stroke: publicPalette.accent,
        fill: "none",
      }}
    >
      <circle cx="60" cy="60" r="46" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="32" strokeWidth="1" strokeDasharray="3 3" />
      <path
        d="M60 18C52 34 48 46 48 58C48 68 53 76 60 82C67 76 72 68 72 58C72 46 68 34 60 18Z"
        strokeWidth="1.4"
      />
    </Box>

    <Stack spacing={2.5}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          alignSelf: "flex-start",
          px: 1.5,
          py: 0.5,
          borderRadius: "8px",
          bgcolor: publicPalette.accentLight,
          color: publicPalette.accentDark,
          fontSize: "0.78rem",
          fontWeight: 700,
        }}
      >
        <AutoStoriesOutlinedIcon sx={{ fontSize: 16 }} />
        Thư mục kinh điển & Phật học
      </Box>

      {/* Hình vẽ kệ kinh sách bằng SVG thanh nhã */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: "12px",
          bgcolor: publicPalette.background,
          border: `1px solid ${publicPalette.border}`,
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 360 175"
          role="img"
          aria-label="Minh họa kệ kinh sách Phật giáo"
          sx={{ width: "100%", height: "auto", display: "block" }}
        >
          {/* Kệ gỗ trên */}
          <rect x="16" y="148" width="328" height="8" rx="4" fill="#A98247" />
          <rect x="28" y="156" width="304" height="4" rx="2" fill="#E7E4DB" />

          {/* Các gáy sách kinh xếp ngay ngắn */}
          <g>
            <rect x="34" y="42" width="28" height="106" rx="4" fill="#315B4C" />
            <line
              x1="40"
              y1="56"
              x2="56"
              y2="56"
              stroke="#FAF8F3"
              strokeWidth="1.5"
            />
            <line
              x1="40"
              y1="132"
              x2="56"
              y2="132"
              stroke="#A98247"
              strokeWidth="1.5"
            />

            <rect x="66" y="32" width="32" height="116" rx="4" fill="#466D5E" />
            <rect
              x="73"
              y="48"
              width="18"
              height="46"
              rx="2"
              fill="#FAF8F3"
              opacity="0.88"
            />
            <line
              x1="72"
              y1="134"
              x2="92"
              y2="134"
              stroke="#FAF8F3"
              strokeWidth="1.5"
            />

            <rect
              x="102"
              y="48"
              width="26"
              height="100"
              rx="4"
              fill="#A98247"
            />
            <line
              x1="108"
              y1="62"
              x2="122"
              y2="62"
              stroke="#FAF8F3"
              strokeWidth="1.5"
            />
            <line
              x1="108"
              y1="134"
              x2="122"
              y2="134"
              stroke="#FAF8F3"
              strokeWidth="1.5"
            />

            <rect
              x="132"
              y="28"
              width="36"
              height="120"
              rx="4"
              fill="#26473B"
            />
            <circle
              cx="150"
              cy="68"
              r="9"
              stroke="#A98247"
              strokeWidth="1.5"
              fill="none"
            />
            <line
              x1="140"
              y1="130"
              x2="160"
              y2="130"
              stroke="#A98247"
              strokeWidth="1.5"
            />

            <rect
              x="172"
              y="44"
              width="28"
              height="104"
              rx="4"
              fill="#5A7D6F"
            />
            <line
              x1="178"
              y1="58"
              x2="194"
              y2="58"
              stroke="#FAF8F3"
              strokeWidth="1.5"
            />

            {/* Cuốn sách nghiêng nhẹ */}
            <g transform="rotate(-8 218 96)">
              <rect
                x="206"
                y="42"
                width="30"
                height="104"
                rx="4"
                fill="#315B4C"
              />
              <line
                x1="212"
                y1="56"
                x2="230"
                y2="56"
                stroke="#A98247"
                strokeWidth="1.5"
              />
              <line
                x1="212"
                y1="130"
                x2="230"
                y2="130"
                stroke="#FAF8F3"
                strokeWidth="1.5"
              />
            </g>

            {/* Hoa sen nét mảnh bên cạnh kệ sách */}
            <g transform="translate(268, 72)">
              <ellipse cx="30" cy="68" rx="26" ry="6" fill="#E7E4DB" />
              <path
                d="M30 16C22 30 18 42 18 52C18 60 23 66 30 70C37 66 42 60 42 52C42 42 38 30 30 16Z"
                stroke="#315B4C"
                strokeWidth="1.8"
                fill="#EBF1EE"
              />
              <path
                d="M18 48C9 46 3 50 0 58C7 66 17 70 28 70"
                stroke="#A98247"
                strokeWidth="1.6"
                fill="none"
              />
              <path
                d="M42 48C51 46 57 50 60 58C53 66 43 70 32 70"
                stroke="#A98247"
                strokeWidth="1.6"
                fill="none"
              />
            </g>
          </g>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderRadius: "10px",
            bgcolor: publicPalette.primaryLight,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: publicPalette.primary,
              fontWeight: 700,
              mb: 0.25,
            }}
          >
            Phân loại rõ ràng
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: publicPalette.textSecondary, lineHeight: 1.45 }}
          >
            Kinh điển, luận giải, thiền học và sách nghiên cứu Phật học.
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: "10px",
            bgcolor: publicPalette.surfaceMuted,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: publicPalette.textPrimary,
              fontWeight: 700,
              mb: 0.25,
            }}
          >
            Tra cứu thuận tiện
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: publicPalette.textSecondary, lineHeight: 1.45 }}
          >
            Kiểm tra bản sách còn sẵn trước khi đến nhận hoặc đặt giữ.
          </Typography>
        </Box>
      </Box>
    </Stack>
  </Paper>
);

const HomeBookCard = ({ book, onViewDetails }) => {
  const [coverFailed, setCoverFailed] = useState(false);
  const availableCopies = Number(book.availableCopies ?? 0);
  const isAvailable = availableCopies > 0;
  const statusStyle = isAvailable
    ? publicPalette.status.available
    : publicPalette.status.unavailable;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: "14px",
        borderColor: publicPalette.border,
        bgcolor: publicPalette.surface,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: publicPalette.primary,
          boxShadow: "0 8px 24px rgba(38, 51, 45, 0.07)",
        },
      }}
    >
      {/* Ảnh bìa tỷ lệ cố định */}
      <Box
        onClick={() => onViewDetails(book.id)}
        sx={{
          position: "relative",
          height: 230,
          bgcolor: publicPalette.surfaceMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          cursor: "pointer",
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        {book.coverImageUrl && !coverFailed ? (
          <Box
            component="img"
            src={book.coverImageUrl}
            alt={`Bìa sách ${book.title}`}
            onError={() => setCoverFailed(true)}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Stack
            alignItems="center"
            spacing={1}
            sx={{ px: 2, textAlign: "center" }}
          >
            <MenuBookOutlinedIcon
              sx={{ fontSize: 44, color: publicPalette.accent }}
            />
            <Typography
              variant="caption"
              sx={{ color: publicPalette.textSecondary, fontWeight: 500 }}
            >
              Ấn phẩm Phật học
            </Typography>
          </Stack>
        )}

        <Chip
          size="small"
          label={isAvailable ? "Còn sách" : "Tạm hết sách"}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            bgcolor: statusStyle.bg,
            color: statusStyle.text,
            border: `1px solid ${statusStyle.border}`,
            fontWeight: 700,
            fontSize: "0.73rem",
            borderRadius: "8px",
          }}
        />
      </Box>

      {/* Nội dung thẻ */}
      <Box
        sx={{
          p: 2.25,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 1, flexWrap: "wrap", rowGap: 0.5 }}
        >
          {book.genreName && (
            <Chip
              size="small"
              label={book.genreName}
              sx={{
                height: 22,
                fontSize: "0.72rem",
                fontWeight: 600,
                bgcolor: publicPalette.primaryLight,
                color: publicPalette.primary,
                borderRadius: "6px",
              }}
            />
          )}
          {book.publicationYear && (
            <Typography
              variant="caption"
              sx={{ color: publicPalette.textSecondary }}
            >
              • {book.publicationYear}
            </Typography>
          )}
        </Stack>

        <Typography
          component="h3"
          title={book.title}
          onClick={() => onViewDetails(book.id)}
          sx={{
            fontWeight: 700,
            fontSize: "1rem",
            color: publicPalette.textPrimary,
            lineHeight: 1.4,
            mb: 0.75,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.8em",
            cursor: "pointer",
            "&:hover": {
              color: publicPalette.primary,
            },
          }}
        >
          {book.title}
        </Typography>

        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ mb: 2, color: publicPalette.textSecondary }}
        >
          <PersonOutlineRoundedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
          <Typography
            variant="body2"
            noWrap
            sx={{ color: publicPalette.textSecondary, fontSize: "0.85rem" }}
          >
            {book.author || "Chưa cập nhật tác giả / dịch giả"}
          </Typography>
        </Stack>

        <Box sx={{ mt: "auto" }}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={() => onViewDetails(book.id)}
            sx={{
              py: 0.85,
              borderRadius: "10px",
              borderColor: publicPalette.primary,
              color: publicPalette.primary,
              fontWeight: 600,
            }}
          >
            Xem chi tiết
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genresError, setGenresError] = useState("");

  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState("");

  const loadCatalogPreview = useCallback((signal) => {
    setGenresLoading(true);
    setBooksLoading(true);
    setGenresError("");
    setBooksError("");

    booksApi
      .genres({ signal })
      .then((list) => {
        if (signal?.aborted) return;
        const validGenres = Array.isArray(list)
          ? list.filter((item) => item && item.active !== false)
          : [];
        setGenres(validGenres);
      })
      .catch((error) => {
        if (signal?.aborted || error?.name === "AbortError") return;
        setGenresError(
          error?.message || "Chưa tải được danh mục chủ đề kinh sách.",
        );
      })
      .finally(() => {
        if (!signal?.aborted) setGenresLoading(false);
      });

    booksApi
      .search(
        {
          searchTerm: "",
          genreId: null,
          availability: "ALL",
          page: 0,
          size: 8,
          sortBy: "createdAt",
          sortDirection: "DESC",
        },
        { signal },
      )
      .then((response) => {
        if (signal?.aborted) return;
        const items = Array.isArray(response?.content) ? response.content : [];
        setBooks(items);
      })
      .catch((error) => {
        if (signal?.aborted || error?.name === "AbortError") return;
        setBooksError(
          error?.message || "Chưa tải được danh sách kinh sách mới cập nhật.",
        );
      })
      .finally(() => {
        if (!signal?.aborted) setBooksLoading(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadCatalogPreview(controller.signal);
    return () => controller.abort();
  }, [loadCatalogPreview]);

  const handleHeroSearch = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/books?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/books");
    }
  };

  const handleScrollToGuide = () => {
    const element = document.getElementById("huong-dan-muon");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleViewBookDetails = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  return (
    <PublicLayout>
      {/* KHỐI A — HERO SECTION */}
      <Box
        component="section"
        sx={{
          pt: { xs: 5, md: 9 },
          pb: { xs: 6, md: 10 },
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
              gap: { xs: 4, md: 6 },
              alignItems: "center",
            }}
          >
            {/* Cột trái: Nội dung & Tìm kiếm */}
            <Box>
              <Typography
                variant="overline"
                sx={{
                  display: "inline-block",
                  color: publicPalette.accentDark,
                  bgcolor: publicPalette.accentLight,
                  border: `1px solid ${publicPalette.border}`,
                  px: 1.5,
                  py: 0.4,
                  borderRadius: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  fontSize: "0.75rem",
                  mb: 2,
                }}
              >
                KHÔNG GIAN TRI THỨC PHẬT HỌC
              </Typography>

              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontFamily: publicFonts.serif,
                  fontWeight: 700,
                  color: publicPalette.textPrimary,
                  fontSize: { xs: "2rem", sm: "2.6rem", md: "3rem" },
                  lineHeight: 1.22,
                  mb: 2,
                }}
              >
                Khám phá kho tàng kinh sách Phật giáo
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: publicPalette.textSecondary,
                  fontSize: { xs: "1rem", sm: "1.08rem" },
                  lineHeight: 1.7,
                  mb: 3.5,
                  maxWidth: 600,
                }}
              >
                Tra cứu kinh điển, sách Phật học và tài liệu nghiên cứu trong
                một không gian đọc thuận tiện, rõ ràng và dễ tiếp cận.
              </Typography>

              {/* Hai nút CTA */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  component={RouterLink}
                  to="/books"
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    px: 3,
                    py: 1.25,
                    bgcolor: publicPalette.primary,
                    color: "#FFFFFF",
                  }}
                >
                  Khám phá kho kinh sách
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleScrollToGuide}
                  sx={{
                    px: 2.75,
                    py: 1.25,
                    borderColor: publicPalette.primary,
                    color: publicPalette.primary,
                  }}
                >
                  Hướng dẫn mượn sách
                </Button>
              </Stack>
            </Box>

            {/* Cột phải: Minh họa kệ kinh sách */}
            <Box>
              <ScriptureShelfIllustration />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* KHỐI B — GIÁ TRỊ NỔI BẬT (3 THẺ LỢI ÍCH THẬT) */}
      <Box
        component="section"
        sx={{
          py: { xs: 5, md: 7 },
          bgcolor: publicPalette.surface,
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {valueHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <Paper
                  key={item.title}
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: "14px",
                    borderColor: publicPalette.border,
                    bgcolor: publicPalette.background,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: "12px",
                      bgcolor: publicPalette.primaryLight,
                      color: publicPalette.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{
                        fontSize: "1.05rem",
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
                        lineHeight: 1.65,
                      }}
                    >
                      {item.description}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* KHỐI C — DANH MỤC KINH SÁCH (KHÁM PHÁ THEO CHỦ ĐỀ TỪ DATABASE) */}
      <Box
        component="section"
        sx={{
          py: { xs: 6, md: 9 },
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "flex-end" }}
            spacing={2}
            sx={{ mb: 4 }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: publicPalette.accentDark,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                DANH MỤC THƯ MỤC
              </Typography>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontFamily: publicFonts.serif,
                  fontSize: { xs: "1.6rem", md: "2rem" },
                  mt: 0.5,
                }}
              >
                Khám phá theo chủ đề
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/books"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{ color: publicPalette.primary, fontWeight: 600 }}
            >
              Xem tất cả chủ đề
            </Button>
          </Stack>

          {genresLoading ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2.5,
              }}
            >
              {[1, 2, 3, 4].map((index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  height={118}
                  sx={{ borderRadius: "14px" }}
                />
              ))}
            </Box>
          ) : genresError ? (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={() => loadCatalogPreview()}
                >
                  Thử lại
                </Button>
              }
              sx={{ borderRadius: "12px" }}
            >
              {genresError}
            </Alert>
          ) : genres.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: "14px",
                borderColor: publicPalette.border,
                bgcolor: publicPalette.surface,
              }}
            >
              <Typography
                variant="body1"
                sx={{ color: publicPalette.textSecondary }}
              >
                Danh mục chủ đề đang được cập nhật từ cơ sở dữ liệu thư viện.
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2.5,
              }}
            >
              {genres.slice(0, 8).map((genre) => (
                <Paper
                  key={genre.id}
                  component={RouterLink}
                  to={`/books?genreId=${encodeURIComponent(genre.id)}`}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: "14px",
                    borderColor: publicPalette.border,
                    bgcolor: publicPalette.surface,
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: publicPalette.primary,
                      bgcolor: publicPalette.primaryLight,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: publicPalette.textPrimary,
                        mb: 0.75,
                      }}
                    >
                      {genre.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: publicPalette.textSecondary,
                        fontSize: "0.84rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {genre.description ||
                        "Tra cứu các đầu kinh sách thuộc chủ đề này trong kho thư viện."}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 2,
                      color: publicPalette.primary,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    Xem kinh sách →
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      {/* KHỐI D — KINH SÁCH MỚI VÀ NỔI BẬT (DỮ LIỆU THẬT TỪ API) */}
      <Box
        component="section"
        sx={{
          py: { xs: 6, md: 9 },
          bgcolor: publicPalette.surface,
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "flex-end" }}
            spacing={2}
            sx={{ mb: 4 }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: publicPalette.accentDark,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                ẤN PHẨM MỚI CẬP NHẬT
              </Typography>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontFamily: publicFonts.serif,
                  fontSize: { xs: "1.6rem", md: "2rem" },
                  mt: 0.5,
                }}
              >
                Kinh sách dành cho bạn khám phá
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/books"
              variant="outlined"
              color="primary"
              size="small"
              endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 17 }} />}
              sx={{
                height: 36,
                minWidth: "auto",
                px: 2,
                py: 0.75,
                fontSize: "0.875rem",
                fontWeight: 600,
                borderRadius: "8px",
                whiteSpace: "nowrap",
                flexShrink: 0,
                alignSelf: { xs: "flex-start", sm: "flex-end" },
              }}
            >
              Mở toàn bộ kho kinh sách
            </Button>
          </Stack>

          {booksLoading ? (
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
              {[1, 2, 3, 4].map((index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  height={370}
                  sx={{ borderRadius: "14px" }}
                />
              ))}
            </Box>
          ) : booksError ? (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={() => loadCatalogPreview()}
                >
                  Thử lại
                </Button>
              }
              sx={{ borderRadius: "12px" }}
            >
              {booksError}
            </Alert>
          ) : books.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 5,
                textAlign: "center",
                borderRadius: "14px",
                borderColor: publicPalette.border,
                bgcolor: publicPalette.background,
              }}
            >
              <Typography
                variant="body1"
                sx={{ color: publicPalette.textSecondary }}
              >
                Hiện chưa có kinh sách nào trong danh mục hiển thị công khai.
              </Typography>
            </Paper>
          ) : (
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
              {books.slice(0, 8).map((book) => (
                <HomeBookCard
                  key={book.id}
                  book={book}
                  onViewDetails={handleViewBookDetails}
                />
              ))}
            </Box>
          )}
        </Container>
      </Box>

      {/* KHỐI E — HƯỚNG DẪN MƯỢN SÁCH (#huong-dan-muon) */}
      <Box
        id="huong-dan-muon"
        component="section"
        sx={{
          py: { xs: 6, md: 9 },
          borderBottom: `1px solid ${publicPalette.border}`,
          scrollMarginTop: "80px",
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ maxWidth: 640, mb: 5 }}>
            <Typography
              variant="overline"
              sx={{
                color: publicPalette.accentDark,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              QUY TRÌNH BẠN ĐỌC
            </Typography>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontFamily: publicFonts.serif,
                fontSize: { xs: "1.6rem", md: "2rem" },
                mt: 0.5,
                mb: 1.25,
              }}
            >
              Hướng dẫn mượn và đặt giữ kinh sách
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
            {borrowSteps.map((item) => (
              <Paper
                key={item.step}
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: "14px",
                  borderColor: publicPalette.border,
                  bgcolor: publicPalette.surface,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: publicFonts.serif,
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: publicPalette.accent,
                    mb: 1.5,
                  }}
                >
                  {item.step}
                </Typography>
                <Typography
                  variant="subtitle1"
                  component="h3"
                  sx={{
                    fontWeight: 700,
                    color: publicPalette.textPrimary,
                    mb: 1,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: publicPalette.textSecondary,
                    lineHeight: 1.65,
                  }}
                >
                  {item.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* KHỐI F — GIỚI THIỆU THƯ VIỆN */}
      <Box
        component="section"
        sx={{
          py: { xs: 6, md: 9 },
          bgcolor: publicPalette.surface,
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: "16px",
              borderColor: publicPalette.border,
              bgcolor: publicPalette.background,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
              gap: { xs: 3, md: 5 },
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: publicPalette.accentDark,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                VỀ THƯ VIỆN
              </Typography>
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontFamily: publicFonts.serif,
                  fontSize: { xs: "1.5rem", md: "1.85rem" },
                  mt: 0.5,
                  mb: 1.75,
                }}
              >
                Gìn giữ và lan tỏa nguồn tư liệu Phật học
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: publicPalette.textSecondary,
                  mb: 3,
                  lineHeight: 1.75,
                }}
              >
                Thư viện Kinh sách Phật giáo hướng đến việc hệ thống hóa danh
                mục kinh điển, luật tạng, luận giải và các công trình nghiên cứu
                Phật học, giúp Tăng Ni, Phật tử, sinh viên và độc giả tra cứu,
                mượn đọc thuận tiện, có trách nhiệm.
              </Typography>
              <Button
                component={RouterLink}
                to="/about"
                variant="outlined"
                color="primary"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                Tìm hiểu thêm
              </Button>
            </Box>

            <Stack spacing={1.75}>
              {[
                {
                  title: "Gìn giữ tri thức",
                  desc: "Lưu trữ thông tin thư mục rõ ràng về tên kinh sách, tác giả, dịch giả và nhà xuất bản.",
                },
                {
                  title: "Tiếp cận thuận tiện",
                  desc: "Tra cứu trực tuyến mọi lúc và biết trước tình trạng bản sách còn sẵn tại thư viện.",
                },
                {
                  title: "Tôn trọng và chia sẻ",
                  desc: "Khuyến khích giữ gìn ấn phẩm cẩn thận và hoàn trả đúng hạn để nhiều bạn đọc cùng tiếp cận.",
                },
              ].map((val) => (
                <Paper
                  key={val.title}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    borderColor: publicPalette.border,
                    bgcolor: publicPalette.surface,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: publicPalette.primary,
                      mb: 0.35,
                    }}
                  >
                    {val.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: publicPalette.textSecondary,
                      fontSize: "0.86rem",
                    }}
                  >
                    {val.desc}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* KHỐI G — CTA CUỐI TRANG */}
      <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 5, md: 6 },
              borderRadius: "16px",
              bgcolor: publicPalette.primary,
              color: "#FAF8F3",
              textAlign: "center",
              border: `1px solid ${publicPalette.accent}`,
            }}
          >
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontFamily: publicFonts.serif,
                color: "#FAF8F3",
                fontSize: { xs: "1.6rem", sm: "2rem" },
                mb: 1.5,
              }}
            >
              Bắt đầu hành trình khám phá kinh sách
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(250, 248, 243, 0.86)",
                maxWidth: 580,
                mx: "auto",
                mb: 3.5,
              }}
            >
              Duyệt danh mục kinh điển, tìm tài liệu phù hợp với nhu cầu nghiên
              cứu và theo dõi các lượt mượn đọc của bạn.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.75}
              sx={{
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                mx: "auto",
              }}
            >
              <Button
                component={RouterLink}
                to="/books"
                variant="contained"
                sx={{
                  px: 3.25,
                  py: 1.25,
                  bgcolor: "#FAF8F3",
                  color: publicPalette.primary,
                  fontWeight: 700,
                  "&:hover": {
                    bgcolor: "#FFFFFF",
                  },
                }}
              >
                Xem kho kinh sách
              </Button>

              {!user ? (
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="outlined"
                  sx={{
                    px: 3.25,
                    py: 1.25,
                    borderColor: "#FAF8F3",
                    color: "#FAF8F3",
                    "&:hover": {
                      borderColor: "#FFFFFF",
                      bgcolor: "rgba(250, 248, 243, 0.1)",
                    },
                  }}
                >
                  Tạo tài khoản
                </Button>
              ) : (
                <Button
                  component={RouterLink}
                  to={user.role === "ROLE_ADMIN" ? "/admin/dashboard" : "/user"}
                  variant="outlined"
                  sx={{
                    px: 3.25,
                    py: 1.25,
                    borderColor: "#FAF8F3",
                    color: "#FAF8F3",
                    "&:hover": {
                      borderColor: "#FFFFFF",
                      bgcolor: "rgba(250, 248, 243, 0.1)",
                    },
                  }}
                >
                  {user.role === "ROLE_ADMIN"
                    ? "Vào khu quản trị"
                    : "Vào khu vực bạn đọc"}
                </Button>
              )}
            </Stack>
          </Paper>
        </Container>
      </Box>
    </PublicLayout>
  );
};

export default LandingPage;
