import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";

const BookCard = ({ book, onViewDetails }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  const isAvailable = Number(book.availableCopies) > 0;

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: "divider",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
          transition: "all 0.25s ease-in-out",
          position: "relative",
          "&:hover": {
            borderColor: "primary.main",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
            transform: "translateY(-4px)",
          },
        }}
      >
        {/* Book Cover Area */}
        <Box
          sx={{
            position: "relative",
            height: 240,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "#17243a" : "#f1f5f9",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
                transition: "transform 0.4s ease",
                "&:hover": { transform: "scale(1.05)" },
              }}
            />
          ) : (
            <MenuBookRoundedIcon sx={{ fontSize: 64, color: "#94a3b8" }} />
          )}

          {/* Availability Status Badge: Còn sách (vàng) / Đã mượn hết (đỏ) */}
          <Chip
            label={isAvailable ? "Còn sách" : "Đã mượn hết"}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              bgcolor: isAvailable ? "#f59e0b" : "#ef4444",
              color: "#ffffff",
              fontWeight: 750,
              fontSize: "0.72rem",
              borderRadius: "6px",
              boxShadow: isAvailable
                ? "0 2px 6px rgba(245, 158, 11, 0.35)"
                : "0 2px 6px rgba(239, 68, 68, 0.35)",
            }}
          />
        </Box>

        {/* Book Content */}
        <Box
          sx={{ p: 2.5, display: "flex", flexDirection: "column", flexGrow: 1 }}
        >
          <Typography
            variant="subtitle1"
            title={book.title}
            onClick={() =>
              onViewDetails ? onViewDetails(book.id) : setDetailsOpen(true)
            }
            sx={{
              fontWeight: 750,
              color: "text.primary",
              lineHeight: 1.3,
              mb: 0.75,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.6em",
              cursor: "pointer",
              "&:hover": { color: "#1769ff" },
            }}
          >
            {book.title}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              color: "text.secondary",
              mb: 1.5,
            }}
          >
            <PersonRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontWeight: 500 }}
              noWrap
            >
              {book.author || "Tác giả chưa cập nhật"}
            </Typography>
          </Box>

          {/* Hàng thông tin ISBN và Tổng số lượng đưa lên trên */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 1,
              px: 1.25,
              mb: 1.5,
              borderRadius: 1.5,
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "#17243a" : "#f8fafc",
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontFamily: "monospace",
                fontSize: "0.75rem",
              }}
            >
              ISBN: {book.isbn || "—"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 750,
                fontSize: "0.8rem",
                color: isAvailable ? "#b45309" : "#dc2626",
              }}
            >
              Tổng {book.availableCopies ?? 0}/{book.totalCopies ?? 0}
            </Typography>
          </Box>

          {/* Mô tả đưa xuống dưới cùng */}
          <Typography
            variant="caption"
            sx={{
              color: "#64748b",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.5,
              mb: 2,
              flexGrow: 1,
            }}
          >
            {book.description || "Không có tóm tắt nội dung."}
          </Typography>

          {/* Action button: Chỉ có Xem chi tiết */}
          <Box sx={{ mt: "auto" }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() =>
                onViewDetails ? onViewDetails(book.id) : setDetailsOpen(true)
              }
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 650,
                fontSize: "0.875rem",
                py: 0.85,
                borderColor: "#1769ff",
                color: "#1769ff",
                "&:hover": {
                  borderColor: "#1250c4",
                  bgcolor: "rgba(23, 105, 255, 0.05)",
                },
              }}
            >
              Xem chi tiết
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Preview Dialog nếu không có router navigation */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 750, color: "#102d62" }}>
          {book.title}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Typography variant="body2">
              <strong>Tác giả:</strong> {book.author}
            </Typography>
            <Typography variant="body2">
              <strong>Thể loại:</strong> {book.genreName || "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Mã ISBN:</strong> {book.isbn}
            </Typography>
            <Typography variant="body2">
              <strong>Khả dụng:</strong> Còn {book.availableCopies} trên tổng số{" "}
              {book.totalCopies} cuốn
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 1, color: "#475569", lineHeight: 1.6 }}
            >
              {book.description}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button
            variant="contained"
            onClick={() => setDetailsOpen(false)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookCard;
