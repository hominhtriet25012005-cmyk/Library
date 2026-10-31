import { api } from "./client.js";

const positiveInteger = (value, label) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1)
    throw new Error(`${label} phải là số nguyên dương.`);
  return number;
};

export const buildLoanSearch = ({
  page = 0,
  size = 10,
  mode = "all",
  value = "",
} = {}) => {
  if (
    !Number.isSafeInteger(page) ||
    page < 0 ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 100
  )
    throw new Error("Trang hoặc kích thước trang không hợp lệ.");
  const body = { page, size, sortBy: "createdAt", sortDirection: "DESC" };
  if (mode === "overdue") body.overdueOnly = true;
  else if (mode === "user")
    body.userId = positiveInteger(value, "ID người dùng");
  else if (mode === "book") body.bookId = positiveInteger(value, "ID sách");
  else if (mode === "status") {
    if (
      !["CHECKED_OUT", "OVERDUE", "RETURNED", "LOST", "DAMAGED"].includes(value)
    )
      throw new Error("Trạng thái mượn sách không hợp lệ.");
    body.status = value;
  } else if (mode !== "all") throw new Error("Bộ lọc mượn sách không hợp lệ.");
  return body;
};

const checkedLoan = (loan) => {
  if (
    !Number.isSafeInteger(loan?.id) ||
    loan.id < 1 ||
    typeof loan.status !== "string"
  )
    throw new Error("Dữ liệu lượt mượn không hợp lệ.");
  return loan;
};

const checkedPage = (page) => {
  if (
    !Array.isArray(page?.content) ||
    !Number.isSafeInteger(page?.totalElements) ||
    page.totalElements < 0 ||
    !Number.isSafeInteger(page?.totalPages) ||
    page.totalPages < 0 ||
    !Number.isSafeInteger(page?.pageNumber) ||
    page.pageNumber < 0
  )
    throw new Error("Dữ liệu lượt mượn không hợp lệ.");
  page.content.forEach(checkedLoan);
  return page;
};

export const canCheckinLoan = (loan) =>
  ["CHECKED_OUT", "OVERDUE"].includes(loan?.status);

const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export const canRenewLoan = (loan, today = localToday()) =>
  loan?.status === "CHECKED_OUT" &&
  loan.isOverdue !== true &&
  typeof loan.dueDate === "string" &&
  loan.dueDate >= today &&
  Number.isInteger(loan.renewalCount) &&
  Number.isInteger(loan.maxRenewals) &&
  loan.renewalCount < loan.maxRenewals;

export const createAdminLoansApi = (client) => ({
  search: async (filters = {}, options) =>
    checkedPage(
      await client.post(
        "/api/book-loans/search",
        buildLoanSearch(filters),
        options,
      ),
    ),
  checkout: async ({ userId, bookId, checkoutDays, notes = "" }) => {
    const borrower = positiveInteger(userId, "ID người dùng");
    const book = positiveInteger(bookId, "ID sách");
    const days = positiveInteger(checkoutDays, "Số ngày mượn");
    if (notes.length > 500)
      throw new Error("Ghi chú không được quá 500 ký tự.");
    return checkedLoan(
      await client.post(`/api/book-loans/checkout/user/${borrower}`, {
        bookId: book,
        checkoutDays: days,
        notes,
      }),
    );
  },
  checkin: async (id, condition = "RETURNED") => {
    const bookLoanId = positiveInteger(id, "ID lượt mượn");
    if (!["RETURNED", "LOST", "DAMAGED"].includes(condition))
      throw new Error("Tình trạng trả không hợp lệ.");
    return checkedLoan(
      await client.post("/api/book-loans/checkin", { bookLoanId, condition }),
    );
  },
  renew: async (id, extensionDays) => {
    const bookLoanId = positiveInteger(id, "ID lượt mượn");
    const days = positiveInteger(extensionDays, "Số ngày gia hạn");
    return checkedLoan(
      await client.post("/api/book-loans/renew", {
        bookLoanId,
        extensionDays: days,
      }),
    );
  },
  updateOverdue: async () => {
    const result = await client.post(
      "/api/book-loans/admin/update-overdue",
      {},
    );
    if (result?.status !== true)
      throw new Error("Không thể xác nhận kết quả cập nhật quá hạn.");
    return result;
  },
});

export const adminLoansApi = createAdminLoansApi(api);
