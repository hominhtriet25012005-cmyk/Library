import { Box, Typography } from "@mui/material";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import { EmptyState } from "../../components/common";

const ReadingHistory = ({ loans = [], preview = false }) => {
  const returnedLoans = (loans || []).filter(
    (loan) => loan.status === "RETURNED",
  );

  return (
    <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 750, color: "#102d62", mb: 2.5 }}
      >
        Lịch sử mượn & đọc sách
      </Typography>

      {returnedLoans.length > 0 ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          {returnedLoans.map((loan) => (
            <Box
              key={loan.id}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e2e8f0",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: "#1e293b" }}
              >
                {loan.bookTitle}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Đã trả ngày: {loan.returnDate || "Hoàn tất"} · Tác giả:{" "}
                {loan.bookAuthor || "Không rõ"}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <EmptyState
          icon={HistoryRoundedIcon}
          title="Chưa có lịch sử mượn trả"
          description="Các lượt mượn sách bạn đã hoàn tất trả sách cho thư viện sẽ được lưu lại tại đây để bạn tiện theo dõi."
        />
      )}
    </Box>
  );
};

export default ReadingHistory;
