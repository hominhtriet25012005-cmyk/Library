import { Box, CircularProgress, Typography } from "@mui/material";

export default function PageLoader({
  minHeight = "50vh",
  message = "Đang tải trang...",
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight,
        gap: 2,
        color: "text.secondary",
        py: 4,
      }}
    >
      <CircularProgress size={36} color="primary" thickness={4} />
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, color: "text.secondary" }}
      >
        {message}
      </Typography>
    </Box>
  );
}
