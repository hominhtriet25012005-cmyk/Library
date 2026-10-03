import React from "react";
import { AccessTime } from "@mui/icons-material";
import { Button } from "@mui/material";

const CurrentLoanCard = ({ loan }) => {
  return (
    <div
      className="flex items-center justify-between p-6 border
     border-gray-200 rounded-2xl"
    >
      <div className="flex items-center space-x-4 flex-1">
        <div className="">
          <img
            src={loan.bookCoverImage}
            alt={loan.bookTitle}
            className="w-16 h-24 rounded-lg"
          />
        </div>

        <div className="">
          <h4 className="text-lg font-bold text-gray-900 mb-1">
            {loan.bookTitle}
          </h4>
          <p className="text-gray-600 mb-2">by {loan.bookAuthor}</p>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-4 text-sm">
              <AccessTime sx={{ fontSize: 16 }} />
              <span>Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
            </div>

            <GetStatusChip status={loan.status} />
            <Chip
              label={`${loan.remainingDays > 0 ? loan.remainingDays : loan.overdueDays} days ${loan.remainingDays >= 0 ? "remaining" : "overdue"}`}
              size="small"
              variant="outline"
            />
          </div>
        </div>
      </div>

      <div>
        <Button variant="outlined">View</Button>
      </div>
    </div>
  );
};

export default CurrentLoanCard;
