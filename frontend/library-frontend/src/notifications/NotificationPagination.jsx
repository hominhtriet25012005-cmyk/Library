import { Box, Button, Typography } from "@mui/material";

export default function NotificationPagination({ page, totalPages, loading, onChange }) {
  if (totalPages <= 1 && page === 0) return null;
  return <Box aria-label="Phân trang thông báo" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1 }}>
    <Button disabled={loading || page === 0} onClick={() => onChange(page - 1)}>Trước</Button>
    <Typography variant="body2">Trang {page + 1}/{Math.max(1, totalPages)}</Typography>
    <Button disabled={loading || page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Sau</Button>
  </Box>;
}
