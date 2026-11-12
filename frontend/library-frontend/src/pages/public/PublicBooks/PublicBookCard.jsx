import { useState } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import { publicPalette } from "../PublicLayout/publicTheme";

export const PublicBookCard = ({ book }) => {
  const [coverFailed, setCoverFailed] = useState(false);

  const availableCopies = Number(book?.availableCopies ?? 0);
  const totalCopies = Number(book?.totalCopies ?? 0);
  const isAvailable = availableCopies > 0;
  const statusStyle = isAvailable
    ? publicPalette.status.available
    : publicPalette.status.unavailable;

  const publicationYearLabel =
    book?.publicationYear ||
    (typeof book?.publicationDate === "string" &&
    book.publicationDate.length >= 4
      ? book.publicationDate.slice(0, 4)
      : null);

  const publicationSummary = [book?.publisher, publicationYearLabel]
    .filter(Boolean)
    .join(" · ");

  const detailUrl = `/books/${encodeURIComponent(book.id)}`;

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
        height: "100%",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: publicPalette.primary,
          boxShadow: "0 8px 24px rgba(38, 51, 45, 0.07)",
        },
      }}
    >
      {/* 1. Bìa sách tỷ lệ cố định + ảnh thay thế khi thiếu */}
      <Box
        component={RouterLink}
        to={detailUrl}
        sx={{
          position: "relative",
          height: 240,
          bgcolor: publicPalette.surfaceMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          textDecoration: "none",
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        {book?.coverImageUrl && !coverFailed ? (
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
            sx={{ px: 2.5, textAlign: "center" }}
          >
            <MenuBookOutlinedIcon
              sx={{ fontSize: 46, color: publicPalette.accent }}
            />
            <Typography
              variant="caption"
              sx={{ color: publicPalette.textSecondary, fontWeight: 500 }}
            >
              Ấn phẩm Phật học
            </Typography>
          </Stack>
        )}

        {/* 5. Tình trạng lấy từ API */}
        <Chip
          size="small"
          label={
            isAvailable
              ? totalCopies > 0
                ? `Còn sách (${availableCopies}/${totalCopies})`
                : "Còn sách"
              : "Tạm hết sách"
          }
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
        {/* 4. Nhãn thể loại */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 1, flexWrap: "wrap", rowGap: 0.5 }}
        >
          {book?.genreName && (
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
          {book?.language && (
            <Typography
              variant="caption"
              sx={{ color: publicPalette.textSecondary, fontSize: "0.75rem" }}
            >
              • {book.language}
            </Typography>
          )}
        </Stack>

        {/* 2. Tên kinh/sách (tối đa 2 dòng) */}
        <Typography
          component={RouterLink}
          to={detailUrl}
          title={book?.title}
          sx={{
            fontWeight: 700,
            fontSize: "1.02rem",
            color: publicPalette.textPrimary,
            lineHeight: 1.4,
            mb: 0.75,
            textDecoration: "none",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.8em",
            "&:hover": {
              color: publicPalette.primary,
            },
          }}
        >
          {book?.title}
        </Typography>

        {/* 3. Tác giả / dịch giả */}
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ mb: publicationSummary ? 0.6 : 2, color: publicPalette.textSecondary }}
        >
          <PersonOutlineRoundedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
          <Typography
            variant="body2"
            noWrap
            sx={{ color: publicPalette.textSecondary, fontSize: "0.85rem" }}
          >
            {book?.author || "Chưa cập nhật tác giả / dịch giả"}
          </Typography>
        </Stack>

        {/* 4b. Thông tin xuất bản ngắn (nếu có) */}
        {publicationSummary && (
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ mb: 2, color: publicPalette.textSecondary }}
          >
            <BusinessOutlinedIcon sx={{ fontSize: 15, flexShrink: 0 }} />
            <Typography
              variant="caption"
              noWrap
              sx={{ color: publicPalette.textSecondary, fontSize: "0.8rem" }}
            >
              {publicationSummary}
            </Typography>
          </Stack>
        )}

        {/* 6. Hành động chính: Xem chi tiết */}
        <Box sx={{ mt: "auto" }}>
          <Button
            component={RouterLink}
            to={detailUrl}
            variant="outlined"
            color="primary"
            fullWidth
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

export default PublicBookCard;
