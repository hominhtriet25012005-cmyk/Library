import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Pagination,
  Paper,
  Rating,
  TextField,
  Typography,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { useAuth } from "../../auth/useAuth.js";
import { useUserSettings } from "../../settings/useUserSettings.js";
import { loansApi, loadLoanPages } from "../../api/loans.js";
import { reviewsApi, loadReviewPages } from "../../api/reviews.js";
import { formatDateVN } from "../../utils/formatters.js";
import { canCreateReview, ownReview, validateReview } from "./reviewRules.js";
import { ConfirmDialog, EmptyState } from "../../components/common";

const pageSize = 5;
const emptyForm = { rating: 5, title: "", reviewText: "" };

const BookReviewsSection = ({ bookId }) => {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const [reviews, setReviews] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [error, setError] = useState("");
  const [eligibilityError, setEligibilityError] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletedThisSession, setDeletedThisSession] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadReviewPages(
      (index, size, options) => reviewsApi.list(bookId, index, size, options),
      { signal: controller.signal },
    )
      .then((entries) => {
        if (!controller.signal.aborted) {
          setReviews(entries);
          setError("");
        }
      })
      .catch((failure) => {
        if (failure.name !== "AbortError") setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [bookId, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    loadLoanPages(loansApi.list, { signal: controller.signal })
      .then((entries) => {
        if (!controller.signal.aborted) {
          setLoans(entries);
          setEligibilityError("");
        }
      })
      .catch((failure) => {
        if (failure.name !== "AbortError") setEligibilityError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setEligibilityLoading(false);
      });
    return () => controller.abort();
  }, [bookId]);

  const mine = ownReview(reviews, user?.id);
  const activeLoan = useMemo(() => {
    return loans.find(
      (loan) =>
        Number(loan.bookId) === Number(bookId) &&
        (loan.status === "CHECKED_OUT" || loan.status === "OVERDUE") &&
        !loan.returnDate,
    );
  }, [loans, bookId]);

  const canCreate =
    !loading &&
    !eligibilityLoading &&
    !error &&
    !eligibilityError &&
    !deletedThisSession &&
    canCreateReview(loans, bookId, reviews, user?.id);

  const totalPages = Math.ceil(reviews.length / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const visible = reviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const openForm = (review = null) => {
    setEditing(review);
    setForm(
      review
        ? {
            rating: review.rating,
            title: review.title || "",
            reviewText: review.reviewText,
          }
        : emptyForm,
    );
    setFormError("");
    setFormOpen(true);
  };

  const save = async () => {
    const values = {
      rating: form.rating,
      title: form.title.trim(),
      reviewText: form.reviewText.trim(),
    };
    const validation = validateReview(values);
    if (validation) {
      setFormError(validation);
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      if (editing) await reviewsApi.update(editing.id, values);
      else await reviewsApi.create(bookId, values);
      setMessage(
        editing
          ? "Đã cập nhật bài đánh giá."
          : "Đã đăng bài đánh giá thành công.",
      );
      setFormOpen(false);
      setPage(1);
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (failure) {
      setFormError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!mine) return;
    setBusy(true);
    setDeleteError("");
    try {
      await reviewsApi.remove(mine.id);
      setDeletedThisSession(true);
      setMessage("Đã xóa bài đánh giá khỏi hệ thống.");
      setDeleteOpen(false);
      setPage(1);
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (failure) {
      setDeleteError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby="book-reviews-title"
      sx={{
        p: { xs: 2.5, sm: 4 },
        borderRadius: 3,
        borderColor: "#e2e8f0",
        bgcolor: "#fff",
      }}
    >
      {/* Header đánh giá */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            id="book-reviews-title"
            variant="h5"
            sx={{ fontWeight: 800, color: "#102d62", mb: 0.5 }}
          >
            Đánh giá từ bạn đọc
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {reviews.length > 0 && (
              <>
                <Rating
                  value={Number(averageRating) || 0}
                  precision={0.1}
                  readOnly
                  size="small"
                  sx={{ color: "#f59e0b" }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 750, color: "#b45309" }}
                >
                  {averageRating}/5
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  •
                </Typography>
              </>
            )}
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              {loading ? "Đang tải…" : `${reviews.length} nhận xét`}
            </Typography>
          </Box>
        </Box>

        {/* Nút hành động cho người dùng */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {mine && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditRoundedIcon />}
                onClick={() => openForm(mine)}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Chỉnh sửa nhận xét
              </Button>
              <Button
                color="error"
                variant="outlined"
                size="small"
                startIcon={<DeleteOutlineRoundedIcon />}
                onClick={() => {
                  setFormError("");
                  setDeleteOpen(true);
                }}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Xóa
              </Button>
            </>
          )}
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<RateReviewRoundedIcon />}
              onClick={() => openForm()}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                px: 2.5,
              }}
            >
              Viết đánh giá
            </Button>
          )}
          {!mine && !canCreate && (
            <Button
              variant="outlined"
              disabled
              startIcon={<RateReviewRoundedIcon />}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                px: 2.5,
                borderColor: "#cbd5e1 !important",
                color: "#94a3b8 !important",
                bgcolor: "#f8fafc",
              }}
            >
              Viết đánh giá
            </Button>
          )}
        </Box>
      </Box>

      {/* Thông báo thông điệp */}
      {message && (
        <Alert
          severity="success"
          sx={{ mb: 2.5, borderRadius: 2 }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setLoading(true);
                setRefresh((value) => value + 1);
              }}
            >
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {eligibilityError && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
          Không kiểm tra được điều kiện viết đánh giá: {eligibilityError}
        </Alert>
      )}
      {!eligibilityLoading &&
        !eligibilityError &&
        !mine &&
        !canCreate &&
        !deletedThisSession &&
        !loading &&
        !error && (
          <Paper
            variant="outlined"
            sx={{
              mb: 2.5,
              p: 2,
              borderRadius: 2.5,
              borderColor: activeLoan ? "#bfdbfe" : "#e2e8f0",
              bgcolor: activeLoan ? "rgba(239, 246, 255, 0.7)" : "#f8fafc",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  bgcolor: activeLoan ? "#dbeafe" : "#e2e8f0",
                  color: activeLoan ? "#1d4ed8" : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                <RateReviewRoundedIcon fontSize="small" />
              </Box>
              <Box>
                {activeLoan ? (
                  <>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 750, color: "#1e3a8a", mb: 0.25 }}
                    >
                      Bạn hiện đang mượn cuốn sách này (Mã mượn: #
                      {activeLoan.id})
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#2563eb", fontSize: "0.85rem" }}
                    >
                      Để đảm bảo tính khách quan của cộng đồng độc giả, tính
                      năng viết đánh giá sẽ mở khóa ngay sau khi bạn hoàn tất
                      đọc và trả sách về thư viện.
                    </Typography>
                  </>
                ) : user ? (
                  <>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 750, color: "#1e293b", mb: 0.25 }}
                    >
                      Bạn muốn chia sẻ cảm nhận về cuốn sách này?
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#64748b", fontSize: "0.85rem" }}
                    >
                      Để đảm bảo tính khách quan của cộng đồng, bạn cần hoàn tất
                      mượn và trả cuốn sách này trước khi viết đánh giá.
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 750, color: "#1e293b", mb: 0.25 }}
                    >
                      Đăng nhập để tham gia đánh giá sách
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#64748b", fontSize: "0.85rem" }}
                    >
                      Vui lòng đăng nhập tài khoản và hoàn tất mượn trả cuốn
                      sách này để gửi đánh giá nhận xét.
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            {activeLoan ? (
              <Button
                component={Link}
                to="/user/my-loans"
                variant="contained"
                size="small"
                sx={{
                  whiteSpace: "nowrap",
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#2563eb",
                  "&:hover": { bgcolor: "#1d4ed8" },
                  boxShadow: "none",
                  px: 2,
                  py: 0.8,
                  flexShrink: 0,
                  alignSelf: { xs: "stretch", sm: "center" },
                }}
              >
                Đến trang Trả sách →
              </Button>
            ) : !user ? (
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="small"
                sx={{
                  whiteSpace: "nowrap",
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 700,
                  flexShrink: 0,
                  alignSelf: { xs: "stretch", sm: "center" },
                }}
              >
                Đăng nhập
              </Button>
            ) : null}
          </Paper>
        )}
      {deletedThisSession && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
          Bạn đã xóa bài đánh giá cho cuốn sách này.
        </Alert>
      )}

      {/* Danh sách bài đánh giá */}
      {loading ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Đang tải nhận xét từ độc giả...
          </Typography>
        </Box>
      ) : !error && reviews.length === 0 ? (
        <EmptyState
          icon={RateReviewRoundedIcon}
          title="Chưa có đánh giá nào"
          description="Hãy là người đầu tiên chia sẻ cảm nhận sau khi mượn và đọc cuốn sách này nhé!"
        />
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {visible.map((review) => {
            const isMe = Number(review.userId) === Number(user?.id);
            const isAnonymous = isMe && settings?.privacy?.anonymousReview;
            const authorInitial = isAnonymous
              ? "?"
              : review.userName
                ? review.userName.charAt(0).toUpperCase()
                : "U";
            const authorDisplayName = isAnonymous
              ? "Độc giả ẩn danh (Đánh giá của bạn)"
              : isMe
                ? `${review.userName || "Bạn"} (Đánh giá của bạn)`
                : review.userName || "Độc giả";

            return (
              <Paper
                key={review.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  borderColor: isMe ? "rgba(23,105,255,0.3)" : "#e2e8f0",
                  bgcolor: isMe ? "rgba(23,105,255,0.02)" : "#fff",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: isAnonymous
                          ? "#475569"
                          : isMe
                            ? "#1769ff"
                            : "#64748b",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                      }}
                    >
                      {authorInitial}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: "#1e293b" }}
                      >
                        {authorDisplayName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        {formatDateVN(review.createdAt?.replace(" ", "T"))}
                      </Typography>
                    </Box>
                  </Box>

                  <Rating
                    value={review.rating || 0}
                    readOnly
                    size="small"
                    sx={{ color: "#f59e0b" }}
                  />
                </Box>

                {review.title && (
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 750, color: "#102d62", mb: 0.5 }}
                  >
                    {review.title}
                  </Typography>
                )}

                {review.reviewText && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#334155",
                      lineHeight: 1.6,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {review.reviewText}
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Phân trang đánh giá */}
      {totalPages > 1 && (
        <Box sx={{ mt: 3.5, display: "flex", justifyContent: "center" }}>
          <Pagination
            color="primary"
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setPage(value)}
            sx={{
              "& .MuiPaginationItem-root": {
                borderRadius: "8px",
                fontWeight: 600,
              },
            }}
          />
        </Box>
      )}

      {/* Modal Viết / Sửa đánh giá */}
      <Dialog
        open={formOpen}
        onClose={busy ? undefined : () => setFormOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 750, color: "#102d62" }}>
            {editing ? "Chỉnh sửa đánh giá" : "Viết đánh giá nhận xét"}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setFormOpen(false)}
            disabled={busy}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5 }}>
          <Box sx={{ display: "grid", gap: 2.5 }}>
            {!editing && (
              <Alert
                severity="info"
                sx={{ borderRadius: 2, fontSize: "0.8125rem" }}
              >
                Mỗi tài khoản chỉ gửi một đánh giá cho từng cuốn sách. Hãy chia
                sẻ nhận xét hữu ích giúp độc giả khác lựa chọn nhé!
              </Alert>
            )}

            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontWeight: 600,
                  display: "block",
                  mb: 0.75,
                }}
              >
                Mức độ hài lòng của bạn
              </Typography>
              <Rating
                value={form.rating}
                onChange={(_, value) =>
                  setForm((current) => ({ ...current, rating: value }))
                }
                size="large"
                sx={{ color: "#f59e0b" }}
              />
            </Box>

            <TextField
              fullWidth
              size="small"
              label="Tiêu đề tóm tắt (không bắt buộc)"
              placeholder="VD: Cuốn sách rất bổ ích và sâu sắc..."
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              slotProps={{ htmlInput: { maxLength: 200 } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />

            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Nội dung nhận xét chi tiết (không bắt buộc)"
              placeholder="Chia sẻ cảm nhận, kiến thức học được hoặc điểm bạn tâm đắc nhất..."
              value={form.reviewText}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reviewText: event.target.value,
                }))
              }
              helperText="Tối đa 2000 ký tự (không bắt buộc)"
              slotProps={{ htmlInput: { maxLength: 2000 } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />

            {formError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {formError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            disabled={busy}
            onClick={() => setFormOpen(false)}
            sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
          >
            Hủy
          </Button>
          <Button
            disabled={busy}
            variant="contained"
            onClick={save}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
            }}
          >
            {busy ? "Đang xử lý…" : editing ? "Lưu thay đổi" : "Gửi đánh giá"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal xác nhận xóa đánh giá */}
      <ConfirmDialog
        open={deleteOpen}
        title="Xóa đánh giá của bạn?"
        message="Bài nhận xét này sẽ được gỡ khỏi danh sách hiển thị trên website thư viện. Bạn có chắc chắn muốn xóa không?"
        confirmLabel="Xác nhận xóa"
        cancelLabel="Giữ lại"
        variant="danger"
        loading={busy}
        error={deleteError}
        onConfirm={remove}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteError("");
        }}
      />
    </Paper>
  );
};

export default BookReviewsSection;
