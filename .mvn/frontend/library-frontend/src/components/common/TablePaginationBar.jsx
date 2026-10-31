import { Box, Button, Pagination, Stack, Typography } from "@mui/material";
import NavigateBeforeRoundedIcon from "@mui/icons-material/NavigateBeforeRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";

/**
 * TablePaginationBar - Thanh phân trang chuẩn hóa tích hợp Spring Boot Pageable
 *
 * @param {number} page - Chỉ số trang hiện tại (0-indexed)
 * @param {number} totalPages - Tổng số trang
 * @param {number} totalElements - Tổng số bản ghi
 * @param {number} [pageSize=10] - Số bản ghi mỗi trang
 * @param {function} onPageChange - Hàm chuyển trang: (zeroIndexedPage) => void
 * @param {boolean} [loading=false] - Trạng thái đang tải
 * @param {string} [itemLabel="bản ghi"] - Tên định danh bản ghi (ví dụ "đầu sách", "lượt mượn")
 */
export const TablePaginationBar = ({
  page = 0,
  totalPages = 1,
  totalElements = 0,
  pageSize = 10,
  onPageChange,
  loading = false,
  itemLabel = "bản ghi",
  showPageNumbers = true,
  sx = {},
}) => {
  const from = totalElements === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalElements);
  const safeTotalPages = Math.max(totalPages || 1, 1);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mt: 2.5,
        px: 1,
        ...sx,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {totalElements > 0 ? (
          <>
            Hiển thị{" "}
            <strong>
              {from}–{to}
            </strong>{" "}
            trên <strong>{totalElements.toLocaleString("vi-VN")}</strong>{" "}
            {itemLabel}
          </>
        ) : (
          `0 ${itemLabel}`
        )}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        {showPageNumbers && safeTotalPages > 1 ? (
          <Pagination
            size="small"
            color="primary"
            page={page + 1}
            count={safeTotalPages}
            disabled={loading}
            onChange={(_, value) => onPageChange(value - 1)}
            shape="rounded"
            sx={{
              "& .MuiPaginationItem-root": {
                fontWeight: 600,
                borderRadius: 1.5,
              },
            }}
          />
        ) : (
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<NavigateBeforeRoundedIcon />}
              disabled={page === 0 || loading}
              onClick={() => onPageChange(page - 1)}
              sx={{ borderRadius: 2 }}
            >
              Trước
            </Button>
            <Typography variant="body2" sx={{ px: 1, fontWeight: 600 }}>
              {page + 1} / {safeTotalPages}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              endIcon={<NavigateNextRoundedIcon />}
              disabled={page >= safeTotalPages - 1 || loading}
              onClick={() => onPageChange(page + 1)}
              sx={{ borderRadius: 2 }}
            >
              Sau
            </Button>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default TablePaginationBar;
