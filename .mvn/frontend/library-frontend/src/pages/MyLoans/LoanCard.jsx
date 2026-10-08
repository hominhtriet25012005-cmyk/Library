import { useState } from "react";
import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";
import MenuBook from "@mui/icons-material/MenuBookRounded";
import { Link } from "react-router-dom";
import { formatDate, loanStatusLabels } from "../../display.js";
import { canRenewLoan, canReturnLoan, effectiveLoanStatus } from "./loanRules.js";

const statusColors = { CHECKED_OUT: "primary", OVERDUE: "error", RETURNED: "success", LOST: "error", DAMAGED: "warning" };

const LoanCard = ({ loan, preview = false, onAction }) => {
  const [expanded, setExpanded] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const status = effectiveLoanStatus(loan);
  return <Card component="article">
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", sm: "row" } }}>
        <Box sx={{ width: 80, height: 112, borderRadius: 2, bgcolor: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {loan.bookCoverImage && !coverFailed ? <img src={loan.bookCoverImage} alt={`Bìa sách ${loan.bookTitle}`} onError={() => setCoverFailed(true)} className="h-full w-full object-cover" />
            : <MenuBook sx={{ color: "#1769ff", fontSize: 40 }} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="h6" component="h2">{loan.bookTitle}</Typography>
            <Chip label={loanStatusLabels[status] || status} color={statusColors[status] || "default"} size="small" />
          </Box>
          <Typography color="text.secondary">{loan.bookAuthor || "Chưa rõ tác giả"}</Typography>
          <Typography variant="body2" color="text.secondary">ISBN: {loan.bookIsbn || "—"}</Typography>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <p>Ngày mượn: <strong>{formatDate(loan.checkoutDate)}</strong></p>
            <p>Hạn trả: <strong>{formatDate(loan.dueDate)}</strong></p>
            <p>Gia hạn: <strong>{loan.renewalCount ?? 0}/{loan.maxRenewals ?? "—"}</strong></p>
          </div>
        </Box>
      </Box>
      {expanded && <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-slate-700">
        <div className="grid gap-2 sm:grid-cols-2">
          <p>Mã lượt mượn: #{loan.id}</p>
          <p>Ngày trả: {formatDate(loan.returnDate)}</p>
          {status === "OVERDUE" && <p>Quá hạn: {loan.overdueDays || "Theo hạn trả"}</p>}
          <p>Ghi chú: {loan.notes || "Không có"}</p>
        </div>
      </div>}
      <Box sx={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 1, mt: 2 }}>
        <Button onClick={() => setExpanded((value) => !value)}>{expanded ? "Thu gọn" : "Chi tiết lượt mượn"}</Button>
        {!preview && loan.bookId && <Button component={Link} to={`/user/books/${loan.bookId}`} variant="outlined">Xem sách</Button>}
        {!preview && canRenewLoan(loan) && <Button onClick={() => onAction(loan, "renew")} variant="outlined">Gia hạn</Button>}
        {!preview && canReturnLoan(loan) && <Button onClick={() => onAction(loan, "return")} variant="contained">Trả sách</Button>}
      </Box>
    </CardContent>
  </Card>;
};

export default LoanCard;
