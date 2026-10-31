import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Pagination,
  Paper,
  Typography,
} from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import MenuBookIcon from "@mui/icons-material/MenuBookRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Link } from "react-router-dom";
import { formatDateVN } from "../../utils/formatters";
import WishlistStatus from "../../wishlist/WishlistStatus";
import { useWishlist } from "../../wishlist/useWishlist";
import { PageHeader, EmptyState } from "../../components/common";

const pageSize = 9;

const WishlistCover = ({ book }) => {
  const [failed, setFailed] = useState(false);
  return book?.coverImageUrl && !failed ? (
    <Box
      component="img"
      src={book.coverImageUrl}
      alt={`Bìa sách ${book.title}`}
      onError={() => setFailed(true)}
      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  ) : (
    <MenuBookIcon
      sx={{ fontSize: 56, color: "#94a3b8" }}
      aria-label="Chưa có ảnh bìa"
    />
  );
};

const WishlistContent = ({
  entries,
  loading,
  error,
  busyBookId,
  remove,
  preview = false,
}) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil((entries?.length ?? 0) / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const visibleEntries =
    entries?.slice((currentPage - 1) * pageSize, currentPage * pageSize) ?? [];

  return (
    <Box
      component="section"
      aria-label="Danh sách sách yêu thích"
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
        pb: 4,
      }}
    >
      {/* Header */}
      <PageHeader
        title="Sách yêu thích của tôi"
        subtitle={
          preview
            ? "Bản xem thử với dữ liệu mẫu, không làm thay đổi danh sách yêu thích thật."
            : "Những cuốn sách bạn đã lưu lại để tra cứu và mượn đọc sau này."
        }
        icon={FavoriteRoundedIcon}
        badge={entries?.length ? `${entries.length} cuốn đã lưu` : undefined}
      />

      {!preview && (
        <Box sx={{ mb: 2.5 }}>
          <WishlistStatus />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!error && !loading && entries?.length === 0 ? (
        <EmptyState
          icon={FavoriteRoundedIcon}
          title="Bạn chưa lưu cuốn sách nào"
          description="Khám phá ngay kho sách phong phú và nhấn lưu các cuốn sách bạn muốn đọc sau này."
          actionText="Khám phá danh mục sách"
          actionTo={preview ? "/demo/books" : "/user/books"}
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2.5,
          }}
        >
          {visibleEntries.map((entry) => {
            const book = entry.book;
            return (
              <Paper
                key={entry.id}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: "#e2e8f0",
                  bgcolor: "#fff",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "#cbd5e1",
                    boxShadow: "0 6px 16px rgba(15,23,42,0.06)",
                  },
                }}
              >
                {/* Bìa sách */}
                <Box
                  sx={{
                    height: 180,
                    bgcolor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <WishlistCover book={book} />
                  <Chip
                    label={`Đã lưu ${formatDateVN(entry.addedAt)}`}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      bgcolor: "rgba(15,23,42,0.75)",
                      color: "#fff",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      backdropFilter: "blur(4px)",
                    }}
                  />
                </Box>

                {/* Nội dung sách */}
                <Box
                  sx={{
                    p: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    title={book?.title}
                    sx={{
                      fontWeight: 750,
                      color: "#1e293b",
                      lineHeight: 1.3,
                      mb: 0.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "2.6em",
                    }}
                  >
                    {book?.title || "Sách không còn khả dụng"}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "#64748b", mb: 1.5 }}
                  >
                    Tác giả: <strong>{book?.author || "—"}</strong>
                  </Typography>

                  {entry.notes && (
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        bgcolor: "#f8fafc",
                        border: "1px dashed #cbd5e1",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "#475569", fontStyle: "italic" }}
                      >
                        Ghi chú: {entry.notes}
                      </Typography>
                    </Box>
                  )}

                  {/* Nút hành động */}
                  <Box
                    sx={{
                      mt: "auto",
                      pt: 2,
                      borderTop: "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    {book?.active ? (
                      <Button
                        component={Link}
                        to={preview ? "/demo/books" : `/user/books/${book.id}`}
                        variant="outlined"
                        size="small"
                        endIcon={<ArrowForwardRoundedIcon />}
                        sx={{
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        {preview ? "Xem danh mục" : "Xem chi tiết"}
                      </Button>
                    ) : (
                      <Chip label="Đã ngừng phát hành" size="small" />
                    )}

                    {!preview && (
                      <Button
                        color="error"
                        size="small"
                        startIcon={<DeleteOutlineRoundedIcon />}
                        disabled={busyBookId !== null || loading || !book?.id}
                        onClick={() => remove(book.id).catch(() => {})}
                        sx={{
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        {busyBookId === book?.id ? "Đang gỡ…" : "Bỏ lưu"}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
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
    </Box>
  );
};

const WishlistPage = () => {
  const wishlist = useWishlist();
  return <WishlistContent {...wishlist} />;
};

export const WishlistPreviewPage = () => (
  <WishlistContent
    preview
    loading={false}
    error=""
    busyBookId={null}
    entries={[
      {
        id: 1,
        book: {
          id: 12,
          title: "Refactoring",
          author: "Martin Fowler",
          active: true,
          coverImageUrl:
            "http://res.cloudinary.com/dxoqwusir/image/upload/v1761368807/refactoring.jpg",
        },
        notes: "Đọc sau khi hoàn thành cuốn sách đang mượn.",
        addedAt: "2025-12-23T12:30:55",
      },
    ]}
  />
);

export default WishlistPage;
