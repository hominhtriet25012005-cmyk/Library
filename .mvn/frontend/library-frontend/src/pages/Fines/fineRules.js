export const fineStatusLabels = {
  PENDING: "Chưa thanh toán",
  PARTIALLY_PAID: "Đã trả một phần",
  PAID: "Đã thanh toán",
  WAIVED: "Đã miễn phạt",
};

export const fineTypeLabels = {
  OVERDUE: "Quá hạn trả sách",
  DAMAGE: "Làm hư hỏng sách",
  LOSS: "Làm mất sách",
  PROCESSING: "Phí xử lý",
};

export const fineOutstanding = (fine) => {
  if (fine.status === "PAID" || fine.status === "WAIVED") return 0;
  const reported = Number(fine.amountOutstanding);
  if (fine.amountOutstanding != null && Number.isFinite(reported))
    return Math.max(0, reported);
  return Math.max(0, Number(fine.amount || 0) - Number(fine.amountPaid || 0));
};

export const canPayFine = (fine) =>
  ["PENDING", "PARTIALLY_PAID"].includes(fine.status) &&
  fineOutstanding(fine) > 0;

export const fineSummary = (fines) => ({
  total: fines.length,
  payable: fines.filter(canPayFine).length,
  outstanding: fines.reduce(
    (sum, fine) => sum + (canPayFine(fine) ? fineOutstanding(fine) : 0),
    0,
  ),
});

export const filterFines = (fines, { status = "ALL", type = "ALL" } = {}) =>
  fines.filter(
    (fine) =>
      (status === "ALL" || fine.status === status) &&
      (type === "ALL" || fine.type === type),
  );
