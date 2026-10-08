import { useState } from "react";
import { Alert, Button, Pagination } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorderRounded";
import MenuBookIcon from "@mui/icons-material/MenuBookRounded";
import { Link } from "react-router-dom";
import { formatDate } from "../../display";
import WishlistStatus from "../../wishlist/WishlistStatus";
import { useWishlist } from "../../wishlist/useWishlist";

const pageSize = 9;

const WishlistCover = ({ book }) => {
  const [failed, setFailed] = useState(false);
  return book?.coverImageUrl && !failed
    ? <img src={book.coverImageUrl} alt={`Bìa sách ${book.title}`} onError={() => setFailed(true)} className="h-full w-full object-cover" />
    : <MenuBookIcon sx={{ fontSize: 64, color: "#1769ff" }} aria-label="Chưa có ảnh bìa" />;
};

const WishlistContent = ({ entries, loading, error, busyBookId, remove, preview = false }) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil((entries?.length ?? 0) / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const visibleEntries = entries?.slice((currentPage - 1) * pageSize, currentPage * pageSize) ?? [];

  return <div className="min-h-screen bg-blue-50 px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Sách yêu thích</h1>
        <p className="mt-2 text-slate-600">{preview ? "Bản xem thử với dữ liệu mẫu, không thay đổi danh sách thật." : "Những cuốn sách bạn đã lưu để xem lại."}</p>
      </div>
      {!preview && <WishlistStatus />}
      {!error && !loading && entries?.length === 0 && <Alert severity="info" icon={<FavoriteBorderIcon />}>
        Bạn chưa lưu sách nào. <Link to={preview ? "/demo/books" : "/user/books"} className="font-semibold text-blue-700 underline">Khám phá danh mục sách</Link>
      </Alert>}
      {visibleEntries.length > 0 && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visibleEntries.map((entry) => {
          const book = entry.book;
          return <article key={entry.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex h-44 items-center justify-center bg-blue-100">
              <WishlistCover book={book} />
            </div>
            <div className="space-y-3 p-5">
              <h2 className="line-clamp-2 text-lg font-bold text-slate-900">{book?.title || "Sách không còn khả dụng"}</h2>
              <p className="text-sm text-slate-600">{book?.author || "—"}</p>
              <p className="text-xs text-slate-500">Đã lưu: {formatDate(entry.addedAt)}</p>
              {entry.notes && <p className="whitespace-pre-line rounded-lg bg-blue-50 p-3 text-sm text-slate-700">Ghi chú: {entry.notes}</p>}
              <div className="flex flex-wrap gap-2">
                {book?.active && <Button component={Link} to={preview ? "/demo/books" : `/user/books/${book.id}`} variant="outlined">
                  {preview ? "Xem danh mục" : "Xem sách"}
                </Button>}
                {!preview && <Button color="error" disabled={busyBookId !== null || loading || !book?.id}
                  onClick={() => remove(book.id).catch(() => {})}>
                  {busyBookId === book?.id ? "Đang xóa..." : "Bỏ yêu thích"}
                </Button>}
              </div>
            </div>
          </article>;
        })}
      </div>}
      {totalPages > 1 && <div className="flex justify-center pt-2">
        <Pagination color="primary" count={totalPages} page={currentPage} onChange={(_, value) => setPage(value)} />
      </div>}
    </div>
  </div>;
};

const WishlistPage = () => {
  const wishlist = useWishlist();
  return <WishlistContent {...wishlist} />;
};

export const WishlistPreviewPage = () => <WishlistContent preview loading={false} error="" busyBookId={null}
  entries={[{
    id: 1,
    book: { id: 12, title: "Refactoring", author: "Martin Fowler", active: true,
      coverImageUrl: "http://res.cloudinary.com/dxoqwusir/image/upload/v1761368807/refactoring.jpg" },
    notes: "Đọc sau khi hoàn thành cuốn sách đang mượn.",
    addedAt: "2025-12-23T12:30:55",
  }]} />;

export default WishlistPage;
