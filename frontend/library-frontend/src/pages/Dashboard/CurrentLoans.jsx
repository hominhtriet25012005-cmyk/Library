import { Box, Typography, Stack } from "@mui/material";
import CurrentLoanCard from "./CurrentLoanCard";
import { effectiveLoanStatus } from "../MyLoans/loanRules.js";
import { EmptyState } from "../../components/common";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";

const CurrentLoans = ({ loans = [], preview = false }) => {
  const activeLoans = (loans || []).filter((loan) =>
    ["CHECKED_OUT", "OVERDUE"].includes(effectiveLoanStatus(loan)),
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
          Sách bạn đang mượn ({activeLoans.length})
        </Typography>
        <Typography variant="caption" sx={{ color: "#64748b" }}>
          Vui lòng hoàn trả đúng hạn để tránh phát sinh tiền phạt quá hạn
        </Typography>
      </Box>

      {activeLoans.length > 0 ? (
        <Stack spacing={2}>
          {activeLoans.map((loan) => (
            <CurrentLoanCard key={loan.id} loan={loan} preview={preview} />
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon={AutoStoriesRoundedIcon}
          title="Bạn chưa mượn cuốn sách nào"
          description="Khám phá ngay hàng ngàn đầu sách hấp dẫn trong kho thư viện của chúng tôi."
          actionText="Tìm kiếm sách"
          actionTo={preview ? "/demo/books" : "/user/books"}
        />
      )}
    </Box>
  );
};

export default CurrentLoans;
