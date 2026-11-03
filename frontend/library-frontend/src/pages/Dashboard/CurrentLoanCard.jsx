import AccessTime from "@mui/icons-material/AccessTimeRounded";
import MenuBook from "@mui/icons-material/MenuBookRounded";
import { Box, Button, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { StatusChip } from "../../components/common";
import { formatDateVN } from "../../utils/formatters";
import { effectiveLoanStatus } from "../MyLoans/loanRules.js";

const CurrentLoanCard = ({ loan, preview = false }) => {
  const status = effectiveLoanStatus(loan);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2.5,
        borderColor: "#e2e8f0",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: "#cbd5e1",
          boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          minWidth: 0,
          flex: 1,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 76,
            borderRadius: 2,
            bgcolor: "rgba(23,105,255,0.08)",
            color: "#1769ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MenuBook sx={{ fontSize: 28 }} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: "#1e293b", mb: 0.25 }}
            noWrap
          >
            {loan.bookTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }} noWrap>
            Tác giả: {loan.bookAuthor || "Không rõ"}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "#475569",
              }}
            >
              <AccessTime sx={{ fontSize: 16, color: "#64748b" }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Hạn trả: {formatDateVN(loan.dueDate)}
              </Typography>
            </Box>

            <StatusChip type="loan" status={status} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ alignSelf: { xs: "stretch", sm: "center" }, flexShrink: 0 }}>
        <Button
          variant="outlined"
          component={Link}
          to={preview ? "/demo/books" : `/user/books/${loan.bookId}`}
          fullWidth
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            px: 2.5,
          }}
        >
          Xem sách
        </Button>
      </Box>
    </Paper>
  );
};

export default CurrentLoanCard;
