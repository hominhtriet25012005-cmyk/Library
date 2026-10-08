import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Pagination,
  Rating,
  TextField,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import { useAuth } from "../../auth/useAuth.js";
import { loansApi, loadLoanPages } from "../../api/loans.js";
import { reviewsApi, loadReviewPages } from "../../api/reviews.js";
import { formatDate } from "../../display.js";
import { canCreateReview, ownReview, validateReview } from "./reviewRules.js";

const pageSize = 5;
const emptyForm = { rating: 5, title: "", reviewText: "" };

const BookReviewsSection = ({ bookId }) => {
  const { user } = useAuth();
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
      setMessage(editing ? "Đã cập nhật đánh giá." : "Đã đăng đánh giá.");
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
    setFormError("");
    try {
      await reviewsApi.remove(mine.id);
      setDeletedThisSession(true);
      setMessage("Đã xóa đánh giá khỏi danh sách hiển thị.");
      setDeleteOpen(false);
      setPage(1);
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (failure) {
      setFormError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="mt-8 rounded-2xl bg-white p-6 shadow-sm"
      aria-labelledby="book-reviews-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="book-reviews-title"
            className="text-2xl font-bold text-slate-900"
          >
            Đánh giá sách
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {loading ? "Đang tải..." : `${reviews.length} đánh giá`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mine && (
            <>
              <Button variant="outlined" onClick={() => openForm(mine)}>
                Sửa đánh giá của tôi
              </Button>
              <Button
                color="error"
                onClick={() => {
                  setFormError("");
                  setDeleteOpen(true);
                }}
              >
                Xóa đánh giá của tôi
              </Button>
            </>
          )}
          {canCreate && (
            <Button variant="contained" onClick={() => openForm()}>
              Viết đánh giá
            </Button>
          )}
        </div>
      </div>
      {message && (
        <Alert severity="success" sx={{ mt: 3 }} onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          action={
            <Button
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
        <Alert severity="warning" sx={{ mt: 3 }}>
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
          <p className="mt-4 text-sm text-slate-600">
            Bạn cần hoàn tất một lượt mượn sách này trước khi viết đánh giá.
          </p>
        )}
      {deletedThisSession && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Đánh giá đã xóa mềm. Backend hiện chỉ cho mỗi tài khoản đánh giá sách
          này một lần nên không thể đăng lại.
        </Alert>
      )}
      {loading ? (
        <p role="status" className="mt-5 text-slate-600">
          Đang tải đánh giá...
        </p>
      ) : !error && reviews.length === 0 ? (
        <p className="mt-5 text-slate-600">Sách này chưa có đánh giá.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {visible.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div>
                <h3 className="font-semibold text-slate-900">
                  {review.title || "Đánh giá sách"}
                </h3>
                <p className="text-sm text-slate-600">
                  {Number(review.userId) === Number(user?.id)
                    ? "Bạn"
                    : review.userName || "Người đọc"}{" "}
                  · {formatDate(review.createdAt?.replace(" ", "T"))}
                </p>
              </div>
              <Rating
                value={review.rating || 0}
                readOnly
                icon={<StarRoundedIcon fontSize="inherit" />}
                emptyIcon={<StarBorderRoundedIcon fontSize="inherit" />}
                aria-label={`${review.rating} trên 5 sao`}
              />
              <p className="mt-2 whitespace-pre-line text-slate-700">
                {review.reviewText}
              </p>
            </article>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            color="primary"
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setPage(value)}
          />
        </div>
      )}

      <Dialog
        open={formOpen}
        onClose={busy ? undefined : () => setFormOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editing ? "Sửa đánh giá" : "Viết đánh giá"}</DialogTitle>
        <DialogContent className="space-y-4">
          {!editing && (
            <Alert severity="info">
              Mỗi tài khoản chỉ đánh giá một lần cho mỗi sách. Đánh giá đã xóa
              không thể đăng lại theo quy tắc backend hiện tại.
            </Alert>
          )}
          <div>
            <p className="mb-1 text-sm text-slate-600">Điểm đánh giá</p>
            <Rating
              value={form.rating}
              onChange={(_, value) =>
                setForm((current) => ({ ...current, rating: value }))
              }
              icon={<StarRoundedIcon fontSize="inherit" />}
              emptyIcon={<StarBorderRoundedIcon fontSize="inherit" />}
            />
          </div>
          <TextField
            fullWidth
            label="Tiêu đề (không bắt buộc)"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            slotProps={{ htmlInput: { maxLength: 200 } }}
          />
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Nội dung đánh giá"
            value={form.reviewText}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                reviewText: event.target.value,
              }))
            }
            helperText="Từ 10 đến 2000 ký tự"
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />
          {formError && <Alert severity="error">{formError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setFormOpen(false)}>
            Hủy
          </Button>
          <Button disabled={busy} variant="contained" onClick={save}>
            {busy
              ? "Đang xử lý..."
              : editing
                ? "Lưu thay đổi"
                : "Đăng đánh giá"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteOpen}
        onClose={busy ? undefined : () => setDeleteOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Xóa đánh giá?</DialogTitle>
        <DialogContent>
          <p>
            Đánh giá sẽ không còn hiển thị. Backend hiện không cho tạo lại đánh
            giá khác cho cùng sách sau khi xóa.
          </p>
          {formError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setDeleteOpen(false)}>
            Giữ lại
          </Button>
          <Button
            disabled={busy}
            color="error"
            variant="contained"
            onClick={remove}
          >
            {busy ? "Đang xử lý..." : "Xóa đánh giá"}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
};

export default BookReviewsSection;
