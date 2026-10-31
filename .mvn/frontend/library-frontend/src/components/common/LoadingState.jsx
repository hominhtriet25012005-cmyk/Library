import {
  Box,
  CircularProgress,
  Skeleton,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";

/**
 * LoadingState - Trạng thái chờ tải dữ liệu chuẩn hóa
 *
 * @param {'table'|'card'|'spinner'} [type='spinner'] - Kiểu hiển thị loader
 * @param {number} [rows=5] - Số dòng skeleton (cho table)
 * @param {number} [columns=6] - Số cột skeleton (cho table)
 * @param {string} [message="Đang tải dữ liệu..."] - Thông báo
 */
export const LoadingState = ({
  type = "spinner",
  rows = 5,
  columns = 6,
  message = "Đang tải dữ liệu…",
}) => {
  if (type === "table") {
    return Array.from({ length: rows }).map((_, rowIndex) => (
      <TableRow key={rowIndex}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <TableCell key={colIndex}>
            <Skeleton
              variant="text"
              height={24}
              width={colIndex === 0 ? "70%" : "50%"}
              sx={{ borderRadius: 1 }}
            />
          </TableCell>
        ))}
      </TableRow>
    ));
  }

  if (type === "card") {
    return (
      <Box sx={{ width: "100%", p: 2 }}>
        <Skeleton
          variant="rounded"
          height={160}
          sx={{ borderRadius: 3, mb: 2 }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
      }}
    >
      <CircularProgress size={28} thickness={4} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingState;
