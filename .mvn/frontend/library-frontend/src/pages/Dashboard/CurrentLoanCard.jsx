import AccessTime from "@mui/icons-material/AccessTimeRounded";
import MenuBook from "@mui/icons-material/MenuBookRounded";
import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import GetStatusChip from "./GetStatusChip";
import { formatDate } from "../../display";
import { effectiveLoanStatus } from "../MyLoans/loanRules.js";

const CurrentLoanCard = ({ loan, preview = false }) => {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border
     border-gray-200 rounded-2xl"
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="w-16 h-24 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <MenuBook />
        </div>

        <div className="min-w-0">
          <h4 className="text-lg font-bold text-gray-900 mb-1">
            {loan.bookTitle}
          </h4>
          <p className="text-gray-600 mb-2">Tác giả: {loan.bookAuthor}</p>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-sm">
              <AccessTime sx={{ fontSize: 16 }} />
              <span>Hạn trả: {formatDate(loan.dueDate)}</span>
            </div>

            <GetStatusChip status={effectiveLoanStatus(loan)} />
          </div>
        </div>
      </div>

      <div>
        <Button variant="outlined" component={Link} to={preview ? "/demo/books" : `/user/books/${loan.bookId}`}>Xem sách</Button>
      </div>
    </div>
  );
};

export default CurrentLoanCard;
