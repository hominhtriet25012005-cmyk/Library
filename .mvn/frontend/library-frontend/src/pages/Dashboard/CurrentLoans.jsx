import React from "react";
import CurrentLoanCard from "./CurrentLoanCard";

const loan = {
  bookTitle: "The Great Gatsby",
  bookCoverImage:
    "https://pixabay.com/images/download/dariuszsankowski-glasses-1052023_1920.jpg",
  bookAuthor: "Triet",
  dueDate: "2026-11-31",
  status: "active",
  remainingDays: 5,
  overdueDays: 0,
};

const CurrentLoans = () => {
  return (
    <div className="p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Books You're Currently Reading
      </h3>

      <div className="space-y-4">
        {/* List of current loans will go here */}

        {[1, 1, 1, 1].map((item, index) => (
          <CurrentLoanCard loan={loan} key={index} />
        ))}
      </div>
    </div>
  );
};

export default CurrentLoans;
