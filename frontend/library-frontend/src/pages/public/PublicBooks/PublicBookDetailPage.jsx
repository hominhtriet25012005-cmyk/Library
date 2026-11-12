import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Pagination,
  Paper,
  Rating,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  Link as RouterLink,
  useLocation,
  useParams,
} from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { useAuth } from "../../../auth/useAuth";
import { booksApi } from "../../../api/books";
import { reviewsApi, loadReviewPages } from "../../../api/reviews";
import { loansApi } from "../../../api/loans";
import { reservationsApi } from "../../../api/reservations";
import {
  formatCurrencyVND,
  formatDateVN,
  formatPublicationInfo,
} from "../../../utils/formatters";
import { cleanReviewText } from "../../library/Book/reviewRules";
import CheckoutAction from "../../library/Book/CheckoutAction";
import ReservationAction from "../../library/Book/ReservationAction";
import PublicLayout from "../PublicLayout/PublicLayout";
import { publicFonts, publicPalette } from "../PublicLayout/publicTheme";

const REVIEWS_PER_PAGE = 5;

export const PublicBookDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const validId = /^[1-9]\d*$/.test(String(id ?? ""));

  const [book, setBook] = useState(null);
  const [bookLoading, setBookLoading] = useState(true);
  const [bookError, setBookError] = useState("");
  const [coverFailed, setCoverFailed] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewPage, setReviewPage] = useState(1);

  const [userLoans, setUserLoans] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [refreshCount, setRefreshCount] = useState(0);

  const loadPublicBookData = useCallback(
    (signal) => {
      if (!validId) {
        setBookLoading(false);
        setReviewsLoading(false);
        setBookError("Mã định danh kinh sách không hợp lệ.");
        return;
      }

      setBookLoading(true);
      setReviewsLoading(true);
      setBookError("");
      setReviewsError("");

      booksApi
        .detail(id, { signal })
        .then((data) => {
          if (signal?.aborted) return;
          setBook(data);
        })
        .catch((failure) => {
          if (signal?.aborted || failure?.name === "AbortError") return;
          setBook(null);
          setBookError(
            failure?.status === 404
              ? "Không tìm thấy cuốn kinh sách này hoặc ấn phẩm đã tạm ngừng hiển thị."
              : failure?.message || "Không thể tải thông tin chi tiết kinh sách.",
          );
        })
        .finally(() => {
          if (!signal?.aborted) setBookLoading(false);
        });

      loadReviewPages(
        (pageIndex, size, options) =>
          reviewsApi.list(id, pageIndex, size, options),
        { signal },
      )
        .then((entries) => {
          if (signal?.aborted) return;
          setReviews(entries);
        })
        .catch((failure) => {
          if (signal?.aborted || failure?.name === "AbortError") return;
          setReviewsError(
            failure?.message || "Chưa tải được danh sách đánh giá từ bạn đọc.",
          );
        })
        .finally(() => {
          if (!signal?.aborted) setReviewsLoading(false);
        });
    },
    [id, validId],
  );

  useEffect(() => {
    const controller = new AbortController();
    setCoverFailed(false);
    setReviewPage(1);
    loadPublicBookData(controller.signal);
    return () => controller.abort();
  }, [loadPublicBookData, refreshCount]);

  // Chỉ kiểm tra trạng thái mượn/đặt giữ cá nhân khi đã đăng nhập với vai trò ROLE_USER
  useEffect(() => {
    if (!validId || !user || user.role !== "ROLE_USER") {
      setUserLoans([]);
      setUserReservations([]);
      return undefined;
    }

    const controller = new AbortController();
    Promise.allSettled([
      loansApi.list(0, 50, { signal: controller.signal }),
      reservationsApi.list(0, 50, { signal: controller.signal }),
    ]).then(([loanRes, resvRes]) => {
      if (controller.signal.aborted) return;
      if (
        loanRes.status === "fulfilled" &&
        Array.isArray(loanRes.value?.content)
      ) {
        setUserLoans(loanRes.value.content);
      }
      if (
        resvRes.status === "fulfilled" &&
        Array.isArray(resvRes.value?.content)
      ) {
        setUserReservations(resvRes.value.content);
      }
    });

    return () => controller.abort();
  }, [id, validId, user, refreshCount]);

  const activeLoan = useMemo(() => {
    if (!userLoans.length || !id) return null;
    return userLoans.find(
      (loan) =>
        Number(loan.bookId) === Number(id) &&
        (loan.status === "CHECKED_OUT" || loan.status === "OVERDUE") &&
        !loan.returnDate,
    );
  }, [userLoans, id]);

  const activeReservation = useMemo(() => {
    if (!userReservations.length || !id) return null;
    return userReservations.find(
      (resv) =>
        Number(resv.bookId) === Number(id) &&
        (resv.status === "PENDING" || resv.status === "AVAILABLE"),
    );
  }, [userReservations, id]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce(
      (acc, item) => acc + (Number(item.rating) || 0),
      0,
    );
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const availableCopies = Number(book?.availableCopies ?? 0);
  const totalCopies = Number(book?.totalCopies ?? 0);
  const isAvailable = availableCopies > 0;
  const statusStyle = isAvailable
    ? publicPalette.status.available
    : publicPalette.status.unavailable;

  const returnPath = location.pathname + location.search;

  const totalReviewPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const currentReviewPage = Math.min(
    reviewPage,
    Math.max(totalReviewPages, 1),
  );
  const visibleReviews = reviews.slice(
    (currentReviewPage - 1) * REVIEWS_PER_PAGE,
    currentReviewPage * REVIEWS_PER_PAGE,
  );

  // 4.4 Hiển thị cụm hành động theo đúng vai trò (Guest / USER / ADMIN)
  const renderRoleActions = () => {
    if (!book) return null;

    // 1. Khách chưa đăng nhập (Guest)
    if (!user) {
      return (
        <Stack spacing={1.5}>
          <Button
            component={RouterLink}
            to="/login"
            state={{ from: returnPath }}
            variant="contained"
            color="primary"
            startIcon={<LoginRoundedIcon />}
            fullWidth
            sx={{
              py: 1.25,
              borderRadius: "10px",
              bgcolor: publicPalette.primary,
              color: "#FFFFFF",
              fontWeight: 700,
            }}
          >
            {isAvailable
              ? "Đăng nhập để mượn sách"
              : "Đăng nhập để đặt giữ sách"}
          </Button>
          <Typography
            variant="caption"
            sx={{
              color: publicPalette.textSecondary,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Sau khi đăng nhập, hệ thống sẽ đưa bạn quay lại đúng trang kinh sách
            này để tiếp tục thao tác.
          </Typography>
        </Stack>
      );
    }

    // 2. Quản trị viên (ROLE_ADMIN): không hiển thị nút mượn/đặt giữ của bạn đọc
    if (user.role === "ROLE_ADMIN") {
      return (
        <Stack spacing={1.25}>
          <Button
            component={RouterLink}
            to="/admin/books"
            variant="outlined"
            color="primary"
            startIcon={<AdminPanelSettingsOutlinedIcon />}
            fullWidth
            sx={{
              py: 1.15,
              borderRadius: "10px",
              borderColor: publicPalette.primary,
              color: publicPalette.primary,
              fontWeight: 600,
            }}
          >
            Quản lý trong kho sách Quản trị
          </Button>
          <Typography
            variant="caption"
            sx={{
              color: publicPalette.textSecondary,
              textAlign: "center",
            }}
          >
            Đang xem với quyền Quản trị viên (không áp dụng thao tác mượn đọc cá
            nhân).
          </Typography>
        </Stack>
      );
    }

    // 3. Bạn đọc (ROLE_USER): hiển thị đúng luồng mượn hoặc đặt giữ thật
    return (
      <Stack spacing={1.5}>
        {activeLoan ? (
          <Button
            component={RouterLink}
            to="/user/my-loans"
            variant="contained"
            startIcon={<CheckCircleOutlineRoundedIcon />}
            fullWidth
            sx={{
              py: 1.15,
              borderRadius: "10px",
              bgcolor: publicPalette.primary,
              color: "#FFFFFF",
              fontWeight: 700,
            }}
          >
            Bạn đang mượn sách này · Xem lượt mượn
          </Button>
        ) : activeReservation ? (
          <Button
            component={RouterLink}
            to="/user/my-reservations"
            variant="contained"
            startIcon={<AccessTimeRoundedIcon />}
            fullWidth
            sx={{
              py: 1.15,
              borderRadius: "10px",
              bgcolor: publicPalette.accent,
              color: "#FFFFFF",
              fontWeight: 700,
            }}
          >
            Đã đặt giữ · Xem hàng đợi
          </Button>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 1.25,
              "& button": { width: "100%" },
            }}
          >
            <CheckoutAction
              book={book}
              onSuccess={() => setRefreshCount((value) => value + 1)}
            />
            <ReservationAction book={book} />
          </Box>
        )}

        <Button
          component={RouterLink}
          to={`/user/books/${encodeURIComponent(book.id)}`}
          variant="outlined"
          endIcon={<OpenInNewRoundedIcon fontSize="small" />}
          fullWidth
          sx={{
            py: 0.95,
            borderRadius: "10px",
            borderColor: publicPalette.border,
            color: publicPalette.textPrimary,
            fontSize: "0.85rem",
          }}
        >
          Mở trong khu vực bạn đọc (Lưu yêu thích & Đánh giá)
        </Button>
      </Stack>
    );
  };

  return (
    <PublicLayout>
      {/* Điều hướng quay lại */}
      <Box
        sx={{
          py: 2,
          bgcolor: publicPalette.surface,
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Button
            component={RouterLink}
            to="/books"
            size="small"
            startIcon={<ArrowBackRoundedIcon />}
            sx={{ color: publicPalette.primary, fontWeight: 600 }}
          >
            Trở về kho kinh sách
          </Button>
        </Container>
      </Box>

      {/* Nội dung chính */}
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3, md: 4 } }}
      >
        {bookLoading ? (
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2.5, sm: 4 },
              borderRadius: "16px",
              borderColor: publicPalette.border,
              bgcolor: publicPalette.surface,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "290px 1fr" },
              gap: 4,
            }}
          >
            <Skeleton
              variant="rounded"
              height={400}
              sx={{ borderRadius: "14px" }}
            />
            <Stack spacing={2}>
              <Skeleton variant="text" width="75%" height={44} />
              <Skeleton variant="text" width="45%" height={28} />
              <Skeleton variant="rounded" width={180} height={36} />
              <Skeleton variant="rounded" height={120} />
              <Skeleton variant="rounded" height={160} />
            </Stack>
          </Paper>
        ) : bookError ? (
          <Alert
            severity="error"
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={() => setRefreshCount((value) => value + 1)}
                >
                  Thử lại
                </Button>
                <Button
                  component={RouterLink}
                  to="/books"
                  color="inherit"
                  size="small"
                >
                  Về kho kinh sách
                </Button>
              </Stack>
            }
            sx={{ borderRadius: "12px" }}
          >
            {bookError}
          </Alert>
        ) : (
          book && (
            <Stack spacing={4}>
              {/* Khối thông tin thư mục chi tiết */}
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 2.5, sm: 4, md: 4.5 },
                  borderRadius: "16px",
                  borderColor: publicPalette.border,
                  bgcolor: publicPalette.surface,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "290px 1fr" },
                  gap: { xs: 3.5, md: 5 },
                  alignItems: "start",
                }}
              >
                {/* Cột trái: Ảnh bìa + Hành động theo quyền */}
                <Box>
                  <Box
                    sx={{
                      width: "100%",
                      height: { xs: 360, sm: 400 },
                      borderRadius: "14px",
                      overflow: "hidden",
                      bgcolor: publicPalette.surfaceMuted,
                      border: `1px solid ${publicPalette.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2.5,
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
                        spacing={1.25}
                        sx={{ px: 3, textAlign: "center" }}
                      >
                        <MenuBookOutlinedIcon
                          sx={{ fontSize: 64, color: publicPalette.accent }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: publicPalette.textSecondary,
                            fontWeight: 600,
                          }}
                        >
                          Ấn phẩm Phật học
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  {renderRoleActions()}
                </Box>

                {/* Cột phải: Thông tin thư mục và giới thiệu nội dung */}
                <Box>
                  {book.genreName && (
                    <Chip
                      component={RouterLink}
                      to={
                        book.genreId
                          ? `/books?genreId=${encodeURIComponent(book.genreId)}`
                          : "/books"
                      }
                      clickable
                      size="small"
                      label={book.genreName}
                      sx={{
                        mb: 1.5,
                        bgcolor: publicPalette.primaryLight,
                        color: publicPalette.primary,
                        fontWeight: 700,
                        borderRadius: "6px",
                        textDecoration: "none",
                      }}
                    />
                  )}

                  <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                      fontFamily: publicFonts.serif,
                      fontWeight: 700,
                      color: publicPalette.textPrimary,
                      fontSize: { xs: "1.65rem", sm: "2.15rem" },
                      lineHeight: 1.28,
                      mb: 1.25,
                    }}
                  >
                    {book.title}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1.75, color: publicPalette.textSecondary }}
                  >
                    <PersonOutlineRoundedIcon sx={{ fontSize: 20 }} />
                    <Typography variant="body1">
                      Tác giả / Dịch giả:{" "}
                      <Box
                        component="strong"
                        sx={{ color: publicPalette.textPrimary }}
                      >
                        {book.author || "Chưa cập nhật"}
                      </Box>
                    </Typography>
                  </Stack>

                  {/* Điểm đánh giá & Tình trạng bản in */}
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    sx={{ mb: 2.5 }}
                  >
                    <Chip
                      icon={
                        isAvailable ? (
                          <CheckCircleOutlineRoundedIcon
                            sx={{
                              "&&": { color: statusStyle.text, fontSize: 18 },
                            }}
                          />
                        ) : (
                          <AccessTimeRoundedIcon
                            sx={{
                              "&&": { color: statusStyle.text, fontSize: 18 },
                            }}
                          />
                        )
                      }
                      label={
                        isAvailable
                          ? `Còn sách (${availableCopies}/${totalCopies} bản sẵn sàng)`
                          : "Tạm hết sách · Có thể đăng ký đặt giữ"
                      }
                      sx={{
                        bgcolor: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`,
                        fontWeight: 700,
                        borderRadius: "8px",
                        py: 0.5,
                      }}
                    />

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Rating
                        value={Number(averageRating)}
                        precision={0.5}
                        readOnly
                        size="small"
                        sx={{ color: publicPalette.accent }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: publicPalette.textPrimary,
                        }}
                      >
                        {averageRating}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: publicPalette.textSecondary }}
                      >
                        ({reviews.length} nhận xét)
                      </Typography>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 2.5, borderColor: publicPalette.border }} />

                  {/* Lưới thông tin thư mục */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                      },
                      gap: 2.25,
                      mb: 2.5,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <CategoryOutlinedIcon
                        sx={{ color: publicPalette.primary, mt: 0.3 }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: publicPalette.textSecondary,
                            display: "block",
                          }}
                        >
                          Chủ đề / Thể loại
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: publicPalette.textPrimary,
                          }}
                        >
                          {book.genreName || "Đang cập nhật"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <BusinessOutlinedIcon
                        sx={{ color: publicPalette.primary, mt: 0.3 }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: publicPalette.textSecondary,
                            display: "block",
                          }}
                        >
                          Nhà xuất bản
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: publicPalette.textPrimary,
                          }}
                        >
                          {book.publisher || "Đang cập nhật"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <CalendarTodayOutlinedIcon
                        sx={{ color: publicPalette.primary, mt: 0.3 }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: publicPalette.textSecondary,
                            display: "block",
                          }}
                        >
                          Ngày / Năm xuất bản
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: publicPalette.textPrimary,
                          }}
                        >
                          {formatPublicationInfo(
                            book.publicationDate,
                            book.publicationYear,
                          )}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <TranslateRoundedIcon
                        sx={{ color: publicPalette.primary, mt: 0.3 }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: publicPalette.textSecondary,
                            display: "block",
                          }}
                        >
                          Ngôn ngữ
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: publicPalette.textPrimary,
                          }}
                        >
                          {book.language || "Tiếng Việt"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <TagRoundedIcon
                        sx={{ color: publicPalette.primary, mt: 0.3 }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: publicPalette.textSecondary,
                            display: "block",
                          }}
                        >
                          Mã ISBN
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: publicPalette.textPrimary,
                          }}
                        >
                          {book.isbn || "Không có mã ISBN"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <AutoStoriesOutlinedIcon
                        sx={{ color: publicPalette.primary, mt: 0.3 }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: publicPalette.textSecondary,
                            display: "block",
                          }}
                        >
                          Quy cách & Giá tham chiếu
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: publicPalette.textPrimary,
                          }}
                        >
                          {book.pages ? `${book.pages} trang` : "Đang cập nhật"}
                          {book.price != null &&
                            ` · ${formatCurrencyVND(book.price)}`}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Divider sx={{ my: 2.5, borderColor: publicPalette.border }} />

                  {/* Nội dung giới thiệu kinh sách */}
                  <Box>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{
                        fontFamily: publicFonts.serif,
                        fontWeight: 700,
                        color: publicPalette.textPrimary,
                        fontSize: "1.18rem",
                        mb: 1.25,
                      }}
                    >
                      Giới thiệu nội dung kinh sách
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: publicPalette.textSecondary,
                        lineHeight: 1.8,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {book.description ||
                        "Chưa có nội dung giới thiệu chi tiết cho ấn phẩm này."}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Khối Đánh giá từ bạn đọc (Công khai cho cả Guest xem) */}
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 2.5, sm: 4 },
                  borderRadius: "16px",
                  borderColor: publicPalette.border,
                  bgcolor: publicPalette.surface,
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1.5}
                  sx={{ mb: 3 }}
                >
                  <Box>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{
                        fontFamily: publicFonts.serif,
                        fontWeight: 700,
                        color: publicPalette.textPrimary,
                        fontSize: "1.35rem",
                        mb: 0.5,
                      }}
                    >
                      Cảm nhận & Đánh giá từ bạn đọc
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: publicPalette.textSecondary }}
                    >
                      {reviewsLoading
                        ? "Đang tải nhận xét..."
                        : `${reviews.length} nhận xét từ bạn đọc đã mượn và hoàn trả sách`}
                    </Typography>
                  </Box>

                  {!user ? (
                    <Button
                      component={RouterLink}
                      to="/login"
                      state={{ from: returnPath }}
                      variant="outlined"
                      size="small"
                      startIcon={<RateReviewOutlinedIcon />}
                      sx={{
                        borderColor: publicPalette.border,
                        color: publicPalette.textPrimary,
                      }}
                    >
                      Đăng nhập để gửi đánh giá
                    </Button>
                  ) : user.role === "ROLE_USER" ? (
                    <Button
                      component={RouterLink}
                      to={`/user/books/${encodeURIComponent(book.id)}`}
                      variant="outlined"
                      size="small"
                      startIcon={<RateReviewOutlinedIcon />}
                      sx={{
                        borderColor: publicPalette.primary,
                        color: publicPalette.primary,
                      }}
                    >
                      Viết hoặc quản lý đánh giá của bạn
                    </Button>
                  ) : null}
                </Stack>

                {reviewsLoading ? (
                  <Stack spacing={2}>
                    {[1, 2].map((item) => (
                      <Skeleton
                        key={item}
                        variant="rounded"
                        height={100}
                        sx={{ borderRadius: "12px" }}
                      />
                    ))}
                  </Stack>
                ) : reviewsError ? (
                  <Alert severity="warning" sx={{ borderRadius: "12px" }}>
                    {reviewsError}
                  </Alert>
                ) : reviews.length === 0 ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 4,
                      textAlign: "center",
                      borderRadius: "12px",
                      borderColor: publicPalette.border,
                      bgcolor: publicPalette.background,
                    }}
                  >
                    <RateReviewOutlinedIcon
                      sx={{ fontSize: 38, color: publicPalette.accent, mb: 1 }}
                    />
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: publicPalette.textPrimary,
                        mb: 0.5,
                      }}
                    >
                      Chưa có nhận xét nào cho ấn phẩm này
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: publicPalette.textSecondary }}
                    >
                      Nhận xét được gửi bởi các bạn đọc đã hoàn tất mượn và trả
                      sách tại thư viện.
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={2}>
                    {visibleReviews.map((review) => {
                      const displayReviewText = cleanReviewText(
                        review.reviewText,
                      );
                      const authorName = review.userName || "Bạn đọc thư viện";
                      const initial = authorName.charAt(0).toUpperCase();

                      return (
                        <Paper
                          key={review.id}
                          variant="outlined"
                          sx={{
                            p: 2.5,
                            borderRadius: "12px",
                            borderColor: publicPalette.border,
                            bgcolor: publicPalette.background,
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={2}
                            sx={{ mb: displayReviewText ? 1.25 : 0 }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                            >
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  bgcolor: publicPalette.primaryLight,
                                  color: publicPalette.primary,
                                  fontWeight: 700,
                                  fontSize: "0.9rem",
                                }}
                              >
                                {initial}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 700,
                                    color: publicPalette.textPrimary,
                                  }}
                                >
                                  {authorName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: publicPalette.textSecondary }}
                                >
                                  {formatDateVN(
                                    review.createdAt?.replace(" ", "T"),
                                  )}
                                </Typography>
                              </Box>
                            </Stack>

                            <Rating
                              value={Number(review.rating) || 0}
                              readOnly
                              size="small"
                              sx={{ color: publicPalette.accent }}
                            />
                          </Stack>

                          {displayReviewText && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: publicPalette.textPrimary,
                                lineHeight: 1.65,
                                whiteSpace: "pre-line",
                              }}
                            >
                              {displayReviewText}
                            </Typography>
                          )}
                        </Paper>
                      );
                    })}

                    {totalReviewPages > 1 && (
                      <Box
                        sx={{
                          pt: 2,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Pagination
                          color="primary"
                          count={totalReviewPages}
                          page={currentReviewPage}
                          onChange={(_, value) => setReviewPage(value)}
                        />
                      </Box>
                    )}
                  </Stack>
                )}
              </Paper>
            </Stack>
          )
        )}
      </Container>
    </PublicLayout>
  );
};

export default PublicBookDetailPage;
