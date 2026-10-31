import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { EmptyState, StatusChip } from "../../components/common";

const Reservation = ({ entries = [], preview = false }) => {
  const activeEntries = (entries || []).filter((item) =>
    ["PENDING", "AVAILABLE"].includes(item.status),
  );

  return (
    <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 750, color: "#102d62" }}>
          Sách bạn đã đặt giữ ({activeEntries.length})
        </Typography>
        <Button
          component={Link}
          to={preview ? "/demo/my-reservations" : "/user/my-reservations"}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ textTransform: "none", fontWeight: 600, color: "#1769ff" }}
        >
          Xem tất cả đặt giữ
        </Button>
      </Box>

      {activeEntries.length > 0 ? (
        <Stack spacing={2}>
          {activeEntries.map((reservation) => (
            <Paper
              key={reservation.id}
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                borderColor: "#e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}
                >
                  {reservation.bookTitle}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Mã đặt giữ: #{reservation.id}
                  {reservation.queuePosition != null &&
                    ` · Vị trí hàng đợi: #${reservation.queuePosition}`}
                </Typography>
              </Box>

              <StatusChip type="reservation" status={reservation.status} />
            </Paper>
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon={EventAvailableRoundedIcon}
          title="Không có sách nào đang đặt giữ"
          description="Khi sách bạn yêu thích hết bản sao sẵn có, bạn có thể đặt giữ để xếp hàng nhận sách đầu tiên."
          actionText="Khám phá sách"
          actionTo={preview ? "/demo/books" : "/user/books"}
        />
      )}
    </Box>
  );
};

export default Reservation;
