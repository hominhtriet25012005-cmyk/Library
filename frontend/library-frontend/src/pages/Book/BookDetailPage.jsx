import { useEffect, useState, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Rating,
  Typography,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBookRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";

import { Link, useParams } from "react-router-dom";
import { booksApi } from "../../api/books";
import { reviewsApi } from "../../api/reviews";
import { loansApi } from "../../api/loans";
import { reservationsApi } from "../../api/reservations";
import {
  formatDateVN,
  formatCurrencyVND,
  formatPublicationInfo,
} from "../../utils/formatters";
import WishlistButton from "../../wishlist/WishlistButton";
import WishlistStatus from "../../wishlist/WishlistStatus";
import CheckoutAction from "./CheckoutAction.jsx";
import ReservationAction from "./ReservationAction.jsx";
import BookReviewsSection from "./BookReviewsSection.jsx";

const BookDetailContent = ({ id }) => {
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userLoans, setUserLoans] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coverFailed, setCoverFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const validId = /^[1-9]\d*$/.test(id);

  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();
    Promise.allSettled([
      booksApi.detail(id, { signal: controller.signal }),
      reviewsApi.list(id, 0, 100, { signal: controller.signal }),
      loansApi.list(0, 50, { signal: controller.signal }),
      reservationsApi.list(0, 50, { signal: controller.signal }),
    ]).then(([bookRes, reviewRes, loanRes, resvRes]) => {
      if (controller.signal.aborted) return;
      if (bookRes.status === "fulfilled") {
        setBook(bookRes.value);
        setError("");
      } else {
        const failure = bookRes.reason;
        setError(
          failure.status === 404
            ? "Không tìm thấy cuốn sách này hoặc sách đã tạm ngừng hiển thị."
            : failure.message,
        );
      }
      if (
        reviewRes.status === "fulfilled" &&
        Array.isArray(reviewRes.value?.content)
      ) {
        setReviews(reviewRes.value.content);
      }
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
      setLoading(false);
    });

    return () => controller.abort();
  }, [id, validId, refresh]);

  const activeLoan = useMemo(() => {
    if (!userLoans || !id) return null;
    return userLoans.find(
      (l) =>
        Number(l.bookId) === Number(id) &&
        (l.status === "CHECKED_OUT" || l.status === "OVERDUE") &&
        !l.returnDate,
    );
  }, [userLoans, id]);

  const activeReservation = useMemo(() => {
    if (!userReservations || !id) return null;
    return userReservations.find(
      (r) =>
        Number(r.bookId) === Number(id) &&
        (r.status === "PENDING" || r.status === "AVAILABLE"),
    );
  }, [userReservations, id]);

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);
  const reviewCount = reviews.length;

  const isAvailable = Number(book?.availableCopies) > 0;

  return (
    <Box
      component="section"
      aria-label="Chi tiết cuốn sách"
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
        pb: 4,
      }}
    >
      {/* Nút quay lại */}
      <Button
        component={Link}
        to="/user/books"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{
          mb: 2,
          textTransform: "none",
          fontWeight: 600,
          color: "#475569",
          borderRadius: "10px",
          px: 2,
          "&:hover": { bgcolor: "rgba(15,23,42,0.06)" },
        }}
      >
        Trở về kho sách
      </Button>

      <Box sx={{ mb: 2 }}>
        <WishlistStatus />
      </Box>

      {!validId || error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error || "Mã định danh sách không hợp lệ."}
        </Alert>
      ) : loading ? (
        <Box
          sx={{
            py: 12,
            textAlign: "center",
            bgcolor: "#fff",
            borderRadius: 3,
            border: "1px solid #e2e8f0",
          }}
        >
          <CircularProgress size={36} />
          <Typography variant="body2" sx={{ mt: 2, color: "#64748b" }}>
            Đang tải thông tin chi tiết cuốn sách...
          </Typography>
        </Box>
      ) : (
        book && (
          <Box sx={{ display: "grid", gap: 3.5 }}>
            {/* Thẻ thông tin chính của sách */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 4, md: 4.5 },
                borderRadius: 4,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "300px 1fr" },
                gap: { xs: 3, md: 5 },
                alignItems: "start",
                boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
              }}
            >
              {/* Cột trái: Bìa sách + Cụm nút hành động bên dưới */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 300,
                    height: { xs: 380, sm: 420 },
                    borderRadius: 3.5,
                    overflow: "hidden",
                    bgcolor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 12px 30px -6px rgba(15, 23, 42, 0.16)",
                    border: "1px solid #e2e8f0",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.02)",
                    },
                  }}
                >
                  {book.coverImageUrl && !coverFailed ? (
                    <Box
                      component="img"
                      src={book.coverImageUrl}
                      alt={`Bìa sách ${book.title}`}
                      onError={() => setCoverFailed(true)}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <MenuBookIcon sx={{ fontSize: 96, color: "#94a3b8" }} />
                  )}
                </Box>

                {/* Các nút hành động nằm dưới bìa sách */}
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 300,
                    mt: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    "& button": {
                      width: "100%",
                      borderRadius: "10px",
                    },
                    "& > *": {
                      width: "100%",
                    },
                  }}
                >
                  {activeLoan ? (
                    <Button
                      component={Link}
                      to="/user/my-loans"
                      variant="contained"
                      startIcon={<CheckCircleRoundedIcon />}
                      sx={{
                        width: "100%",
                        bgcolor: "#16a34a",
                        color: "#ffffff",
                        fontWeight: 700,
                        borderRadius: "10px",
                        textTransform: "none",
                        py: 1.2,
                        boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                        "&:hover": { bgcolor: "#15803d" },
                      }}
                    >
                      Đang mượn cuốn sách này
                    </Button>
                  ) : activeReservation ? (
                    <Button
                      component={Link}
                      to="/user/my-reservations"
                      variant="contained"
                      startIcon={<CheckCircleRoundedIcon />}
                      sx={{
                        width: "100%",
                        bgcolor: "#f59e0b",
                        color: "#ffffff",
                        fontWeight: 700,
                        borderRadius: "10px",
                        textTransform: "none",
                        py: 1.2,
                        boxShadow: "0 2px 8px rgba(245, 158, 11, 0.25)",
                        "&:hover": { bgcolor: "#d97706" },
                      }}
                    >
                      Bạn đã đặt giữ sách này
                    </Button>
                  ) : (
                    <>
                      <CheckoutAction
                        book={book}
                        onSuccess={() => setRefresh((value) => value + 1)}
                      />
                      <ReservationAction book={book} />
                    </>
                  )}
                  <WishlistButton bookId={book.id} />
                </Box>
              </Box>

              {/* Cột phải: Toàn bộ thông tin chi tiết */}
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {/* 1. Tiêu đề sách */}
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    color: "#0f172a",
                    fontSize: { xs: "1.75rem", sm: "2.15rem" },
                    lineHeight: 1.25,
                    letterSpacing: "-0.02em",
                    mb: 1,
                  }}
                >
                  {book.title}
                </Typography>

                {/* 2. Tác giả */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: "#475569",
                    mb: 1.5,
                  }}
                >
                  <PersonRoundedIcon sx={{ fontSize: 20, color: "#64748b" }} />
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 500, color: "#475569" }}
                  >
                    bởi{" "}
                    <strong style={{ color: "#1e293b" }}>
                      {book.author || "Tác giả chưa cập nhật"}
                    </strong>
                  </Typography>
                </Box>

                {/* 3. Rating & Lượt đánh giá */}
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <Rating
                    value={Number(averageRating)}
                    precision={0.5}
                    readOnly
                    size="small"
                    sx={{ color: "#f59e0b" }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 800, color: "#0f172a", ml: 0.5 }}
                  >
                    {averageRating}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    ({reviewCount} đánh giá)
                  </Typography>
                </Box>

                {/* 4. Huy hiệu tình trạng (Pill Chip) */}
                <Box sx={{ mb: 2.5 }}>
                  {isAvailable ? (
                    <Chip
                      icon={
                        <CheckCircleRoundedIcon
                          sx={{ "&&": { color: "#ffffff", fontSize: 18 } }}
                        />
                      }
                      label={` Còn ${book.availableCopies}/${book.totalCopies} bản sẵn sàng`}
                      sx={{
                        bgcolor: "#16a34a",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        borderRadius: 99,
                        px: 1,
                        py: 2,
                        boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                      }}
                    />
                  ) : (
                    <Chip
                      icon={
                        <CancelRoundedIcon
                          sx={{ "&&": { color: "#ffffff", fontSize: 18 } }}
                        />
                      }
                      label="Đã mượn hết · Hết bản sẵn có"
                      sx={{
                        bgcolor: "#ef4444",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        borderRadius: 99,
                        px: 1,
                        py: 2,
                        boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
                      }}
                    />
                  )}
                </Box>

                {/* Banner trạng thái nếu độc giả đang mượn hoặc đã đặt giữ cuốn sách này */}
                {activeLoan && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.75,
                      borderRadius: "12px",
                      bgcolor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
                    >
                      <CheckCircleRoundedIcon
                        sx={{ color: "#16a34a", fontSize: 24 }}
                      />
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 800, color: "#166534" }}
                        >
                          Bạn đang mượn cuốn sách này
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#15803d", display: "block" }}
                        >
                          Ngày mượn: {formatDateVN(activeLoan.checkoutDate)} ·
                          Hạn trả:{" "}
                          <strong>{formatDateVN(activeLoan.dueDate)}</strong>
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      component={Link}
                      to="/user/my-loans"
                      size="small"
                      variant="outlined"
                      sx={{
                        color: "#16a34a",
                        borderColor: "#86efac",
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: "8px",
                        "&:hover": {
                          bgcolor: "#dcfce7",
                          borderColor: "#4ade80",
                        },
                      }}
                    >
                      Xem lượt mượn / Trả sách →
                    </Button>
                  </Box>
                )}

                {activeReservation && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.75,
                      borderRadius: "12px",
                      bgcolor: "#fffbeb",
                      border: "1px solid #fde68a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
                    >
                      <CheckCircleRoundedIcon
                        sx={{ color: "#d97706", fontSize: 24 }}
                      />
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 800, color: "#92400e" }}
                        >
                          Bạn đã đặt giữ cuốn sách này
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#b45309", display: "block" }}
                        >
                          Trạng thái: Đang xếp hàng chờ nhận sách tại thư viện.
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      component={Link}
                      to="/user/my-reservations"
                      size="small"
                      variant="outlined"
                      sx={{
                        color: "#d97706",
                        borderColor: "#fcd34d",
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: "8px",
                        "&:hover": {
                          bgcolor: "#fef3c7",
                          borderColor: "#f59e0b",
                        },
                      }}
                    >
                      Xem vị trí hàng đợi →
                    </Button>
                  </Box>
                )}

                {/* Đường kẻ phân cách 1 */}
                <Divider sx={{ my: 1.5, borderColor: "#f1f5f9" }} />

                {/* 5. Lưới Metadata 2 cột */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                    rowGap: 2.5,
                    columnGap: 4,
                    my: 2,
                  }}
                >
                  {/* Thể loại */}
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "rgba(23, 105, 255, 0.1)",
                        color: "#1769ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CategoryRoundedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 500,
                          display: "block",
                          mb: 0.25,
                        }}
                      >
                        Thể loại
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          color: "#0f172a",
                          textTransform: "uppercase",
                        }}
                      >
                        {book.genreName || "—"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Nhà xuất bản */}
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "rgba(99, 102, 241, 0.1)",
                        color: "#6366f1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <BusinessRoundedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 500,
                          display: "block",
                          mb: 0.25,
                        }}
                      >
                        Nhà xuất bản
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 700, color: "#0f172a" }}
                      >
                        {book.publisher || "—"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Mã ISBN */}
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "rgba(23, 105, 255, 0.1)",
                        color: "#1769ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <TagRoundedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 500,
                          display: "block",
                          mb: 0.25,
                        }}
                      >
                        Mã ISBN
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 700, color: "#0f172a" }}
                      >
                        {book.isbn || "—"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Ngày xuất bản */}
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "rgba(99, 102, 241, 0.1)",
                        color: "#6366f1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CalendarTodayRoundedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 500,
                          display: "block",
                          mb: 0.25,
                        }}
                      >
                        Ngày/năm xuất bản
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 700, color: "#0f172a" }}
                      >
                        {formatPublicationInfo(
                          book.publicationDate,
                          book.publicationYear,
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Ngôn ngữ */}
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "rgba(16, 185, 129, 0.1)",
                        color: "#10b981",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <TranslateRoundedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 500,
                          display: "block",
                          mb: 0.25,
                        }}
                      >
                        Ngôn ngữ
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 700, color: "#0f172a" }}
                      >
                        {book.language || "Tiếng Việt"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Quy cách & Giá bìa */}
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "rgba(245, 158, 11, 0.1)",
                        color: "#f59e0b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <AutoStoriesRoundedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontWeight: 500,
                          display: "block",
                          mb: 0.25,
                        }}
                      >
                        Quy cách & Giá tham khảo
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 700, color: "#0f172a" }}
                      >
                        {book.pages ? `${book.pages} trang` : "—"}
                        {book.price != null &&
                          ` · ${formatCurrencyVND(book.price)}`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Đường kẻ phân cách 2 */}
                <Divider sx={{ my: 2, borderColor: "#f1f5f9" }} />

                {/* 6. Về cuốn sách này */}
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: "#0f172a",
                      fontSize: "1.1rem",
                      mb: 1.5,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Về cuốn sách này
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#475569",
                      lineHeight: 1.8,
                      whiteSpace: "pre-line",
                      fontSize: "0.95rem",
                    }}
                  >
                    {book.description ||
                      "Chưa có nội dung giới thiệu chi tiết cho đầu sách này."}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Mục nhận xét & đánh giá */}
            <BookReviewsSection bookId={book.id} />
          </Box>
        )
      )}
    </Box>
  );
};

const BookDetailPage = () => {
  const { id } = useParams();
  return <BookDetailContent key={id} id={id} />;
};

export default BookDetailPage;
