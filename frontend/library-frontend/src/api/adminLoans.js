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

export const needsCheckinDescription = (condition) =>
  ["LOST", "DAMAGED"].includes(condition);

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

const buildModernCheckinBody = (id, details = {}) => {
  const bookLoanId = positiveInteger(id, "ID lượt mượn");
  const condition = details.condition ?? "RETURNED";
  if (!["RETURNED", "LOST", "DAMAGED"].includes(condition))
    throw new Error("Tình trạng trả không hợp lệ.");
  const inspectionNote = String(
    details.inspectionNote ?? details.notes ?? "",
  ).trim();
  if (inspectionNote.length > 500)
    throw new Error("Ghi chú trả sách không được vượt quá 500 ký tự.");
  if (
    condition === "DAMAGED" &&
    !["LIGHT", "SEVERE"].includes(details.damageLevel)
  )
    throw new Error("Vui lòng chọn mức độ hư hỏng.");
  if (condition !== "DAMAGED" && details.damageLevel)
    throw new Error("Chỉ chọn mức độ hư hỏng khi sách bị hư hỏng.");

  return {
    bookLoanId,
    condition,
    ...(details.receivedDate ? { receivedDate: details.receivedDate } : {}),
    ...(inspectionNote ? { inspectionNote } : {}),
    ...(details.damageLevel ? { damageLevel: details.damageLevel } : {}),
    ...(details.confirmDefaultReferencePrice
      ? { confirmDefaultReferencePrice: true }
      : {}),
  };
};

const checkedFinePreview = (preview, expectedLoanId) => {
  if (
    preview?.bookLoanId !== expectedLoanId ||
    !Number.isInteger(preview?.overdueDays) ||
    preview.overdueDays < 0 ||
    !Array.isArray(preview?.items) ||
    !Number.isSafeInteger(preview?.totalAmount) ||
    preview.totalAmount < 0 ||
    typeof preview?.usesDefaultReferencePrice !== "boolean" ||
    typeof preview?.requiresDefaultReferencePriceConfirmation !== "boolean" ||
    preview.items.some(
      (item) =>
        !["OVERDUE", "DAMAGE", "LOSS"].includes(item?.type) ||
        typeof item?.label !== "string" ||
        !Number.isSafeInteger(item?.amount) ||
        item.amount < 0,
    )
  )
    throw new Error("Dữ liệu xem trước tiền phạt không hợp lệ.");
  return preview;
};

export const createAdminLoansApi = (client) => ({
  search: async (filters = {}, options) =>
    checkedPage(
      await client.post(
        "/api/book-loans/search",
        buildLoanSearch(filters),
        options,
      ),
    ),
  returnRequests: async ({ page = 0, size = 20 } = {}, options) => {
    if (
      !Number.isSafeInteger(page) ||
      page < 0 ||
      !Number.isSafeInteger(size) ||
      size < 1 ||
      size > 100
    )
      throw new Error("Trang hoặc kích thước hàng chờ không hợp lệ.");
    return checkedPage(
      await client.get(
        `/api/book-loans/admin/return-requests?page=${page}&size=${size}`,
        options,
      ),
    );
  },
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
  checkin: async (id, conditionOrDetails = "RETURNED", notes = "") => {
    const bookLoanId = positiveInteger(id, "ID lượt mượn");
    const usesLegacyArguments =
      conditionOrDetails === null || typeof conditionOrDetails !== "object";
    const details =
      !usesLegacyArguments
        ? conditionOrDetails
        : { condition: conditionOrDetails, inspectionNote: notes };
    const condition = details.condition ?? "RETURNED";
    if (!["RETURNED", "LOST", "DAMAGED"].includes(condition))
      throw new Error("Tình trạng trả không hợp lệ.");
    const inspectionNote = String(
      details.inspectionNote ?? details.notes ?? "",
    ).trim();
    if (inspectionNote.length > 500)
      throw new Error("Ghi chú trả sách không được vượt quá 500 ký tự.");
    if (
      !usesLegacyArguments &&
      condition === "DAMAGED" &&
      !["LIGHT", "SEVERE"].includes(details.damageLevel)
    )
      throw new Error("Vui lòng chọn mức độ hư hỏng.");
    if (!usesLegacyArguments && condition !== "DAMAGED" && details.damageLevel)
      throw new Error("Chỉ chọn mức độ hư hỏng khi sách bị hư hỏng.");
    if (
      !usesLegacyArguments &&
      ["LOST", "DAMAGED"].includes(condition) &&
      !inspectionNote
    )
      throw new Error("Mô tả tình trạng sách là bắt buộc.");
    if (usesLegacyArguments) {
      return checkedLoan(
        await client.post("/api/book-loans/checkin", {
          bookLoanId,
          condition,
          notes: inspectionNote,
        }),
      );
    }
    const body = buildModernCheckinBody(bookLoanId, details);
    return checkedLoan(
      await client.post("/api/book-loans/checkin", body),
    );
  },
  previewCheckin: async (id, details = {}, options) => {
    const bookLoanId = positiveInteger(id, "ID lượt mượn");
    return checkedFinePreview(
      await client.post(
        "/api/book-loans/admin/checkin-preview",
        buildModernCheckinBody(bookLoanId, details),
        options,
      ),
      bookLoanId,
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
