import { useEffect, useState } from "react";
import { Alert, Button } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBookRounded";
import { Link, useParams } from "react-router-dom";
import { booksApi } from "../../api/books";
import { formatDate } from "../../display";
import WishlistButton from "../../wishlist/WishlistButton";
import WishlistStatus from "../../wishlist/WishlistStatus";
import CheckoutAction from "./CheckoutAction.jsx";
import ReservationAction from "./ReservationAction.jsx";
import BookReviewsSection from "./BookReviewsSection.jsx";

const BookDetailContent = ({ id }) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coverFailed, setCoverFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const validId = /^[1-9]\d*$/.test(id);

  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();
    booksApi
      .detail(id, { signal: controller.signal })
      .then(setBook)
      .catch((failure) => {
        if (failure.name !== "AbortError") {
          setError(
            failure.status === 404
              ? "Không tìm thấy sách này hoặc sách đã ngừng hiển thị."
              : failure.message,
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, validId, refresh]);

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Button component={Link} to="/user/books">
          ← Trở về danh mục sách
        </Button>
        <div className="mt-4">
          <WishlistStatus />
        </div>
        {!validId || error ? (
          <Alert severity="error" className="mt-5">
            {error || "Mã sách không hợp lệ."}
          </Alert>
        ) : loading ? (
          <p role="status" className="mt-5 rounded-xl bg-white p-6">
            Đang tải chi tiết sách...
          </p>
        ) : (
          book && (
            <article className="mt-5 grid gap-8 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-[260px_1fr]">
              <div className="flex min-h-80 items-center justify-center overflow-hidden rounded-xl bg-blue-100">
                {book.coverImageUrl && !coverFailed ? (
                  <img
                    src={book.coverImageUrl}
                    alt={`Bìa sách ${book.title}`}
                    onError={() => setCoverFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <MenuBookIcon
                    sx={{ fontSize: 90, color: "#1769ff" }}
                    aria-label="Chưa có ảnh bìa"
                  />
                )}
              </div>
              <div>
                <h1 className="mb-3 text-3xl font-bold text-slate-900">
                  {book.title}
                </h1>
                <p className="mb-5 text-lg text-slate-600">{book.author}</p>
                <dl className="grid gap-3 text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold">Thể loại</dt>
                    <dd>{book.genreName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">ISBN</dt>
                    <dd>{book.isbn}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Nhà xuất bản</dt>
                    <dd>{book.publisher || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Ngày xuất bản</dt>
                    <dd>{formatDate(book.publicationDate)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Ngôn ngữ</dt>
                    <dd>{book.language || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Số trang</dt>
                    <dd>{book.pages ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Tình trạng</dt>
                    <dd>
                      {book.availableCopies > 0
                        ? `Còn ${book.availableCopies}/${book.totalCopies} bản`
                        : "Đã hết sách"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Giá</dt>
                    <dd>
                      {book.price == null
                        ? "—"
                        : new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(book.price)}
                    </dd>
                  </div>
                </dl>
                <h2 className="mt-7 mb-2 text-xl font-semibold text-slate-900">
                  Giới thiệu
                </h2>
                <p className="whitespace-pre-line text-slate-700">
                  {book.description || "Chưa có mô tả."}
                </p>
                <div className="mt-7">
                  <WishlistButton bookId={book.id} withNotes />
                </div>
                <CheckoutAction
                  book={book}
                  onSuccess={() => setRefresh((value) => value + 1)}
                />
                <ReservationAction book={book} />
              </div>
            </article>
          )
        )}
        {book && !loading && !error && <BookReviewsSection bookId={book.id} />}
      </div>
    </div>
  );
};

const BookDetailPage = () => {
  const { id } = useParams();
  return <BookDetailContent key={id} id={id} />;
};

export default BookDetailPage;
