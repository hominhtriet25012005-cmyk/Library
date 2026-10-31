const localDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const effectiveLoanStatus = (loan, today = new Date()) =>
  loan.status === "CHECKED_OUT" &&
  (loan.isOverdue === true || (loan.dueDate && loan.dueDate < localDate(today)))
    ? "OVERDUE"
    : loan.status;

export const canReturnLoan = (loan) =>
  (loan.status === "CHECKED_OUT" || loan.status === "OVERDUE") &&
  !loan.returnDate;

export const canRenewLoan = (loan, today = new Date()) =>
  loan.status === "CHECKED_OUT" &&
  Boolean(loan.dueDate) &&
  effectiveLoanStatus(loan, today) === "CHECKED_OUT" &&
  !loan.returnDate &&
  Number.isInteger(loan.renewalCount) &&
  Number.isInteger(loan.maxRenewals) &&
  loan.renewalCount < loan.maxRenewals;

export const filterLoans = (loans, status, today = new Date()) =>
  status
    ? loans.filter((loan) => effectiveLoanStatus(loan, today) === status)
    : loans;

export const renewalDays = (value) =>
  Number.isInteger(Number(value)) && Number(value) >= 1 ? Number(value) : null;

export const checkoutDaysForPlan = (maxDaysPerBook) =>
  Number.isInteger(maxDaysPerBook) && maxDaysPerBook >= 1
    ? Math.min(14, maxDaysPerBook)
    : null;
