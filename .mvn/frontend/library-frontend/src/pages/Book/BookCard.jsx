import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import Person from "@mui/icons-material/PersonRounded";
import MenuBook from "@mui/icons-material/MenuBookRounded";
import WishlistButton from "../../wishlist/WishlistButton";

const BookCard = ({ book, onViewDetails }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  return (
    <>
      <div
        className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all
    duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:-translate-y-1"
      >
        {/* Book Cover */}
        <div className="relative h-64 bg-gradient-to-br from-blue-100 to-sky-100 overflow-hidden flex items-center justify-center">
          {book.coverImageUrl && !coverFailed ? (
            <img
              src={book.coverImageUrl}
              alt={`Bìa sách ${book.title}`}
              onError={() => setCoverFailed(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <MenuBook
              sx={{ fontSize: 72, color: "#1769ff" }}
              aria-label="Chưa có ảnh bìa"
            />
          )}
        </div>

        {/* Book Details */}

        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
            {book.title}
          </h3>

          <div className="flex items-center space-x-2 text-gray-600 mb-3">
            <Person sx={{ fontSize: 16 }} />
            <span className="text-sm line-clamp-1">{book.author}</span>
          </div>

          {/* ISBN & Copies Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <span>ISBN: {book.isbn}</span>
            <span>
              Còn {book.availableCopies}/{book.totalCopies} bản
            </span>
          </div>

          {/* Description Preview */}
          {book.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {book.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outlined"
              fullWidth
              onClick={() =>
                onViewDetails ? onViewDetails(book.id) : setDetailsOpen(true)
              }
              sx={{
                textTransform: "none",
                borderColor: "#1769ff",
                color: "#1769ff",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#0d4ed3",
                  bgcolor: "#e8f0ff",
                },
              }}
            >
              Xem chi tiết
            </Button>
            {onViewDetails && <WishlistButton bookId={book.id} />}
          </div>
        </div>
      </div>
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{book.title}</DialogTitle>
        <DialogContent dividers>
          <p>
            <strong>Tác giả:</strong> {book.author}
          </p>
          <p>
            <strong>Thể loại:</strong> {book.genreName}
          </p>
          <p>
            <strong>ISBN:</strong> {book.isbn}
          </p>
          <p>
            <strong>Số bản còn:</strong> {book.availableCopies}/
            {book.totalCopies}
          </p>
          <p className="mt-3">{book.description}</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookCard;
