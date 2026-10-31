import { api } from "./client.js";

const fineStatuses = ["PENDING", "PARTIALLY_PAID", "PAID", "WAIVED"];
const fineTypes = ["OVERDUE", "DAMAGE", "LOSS", "PROCESSING"];
const paymentStatuses = [
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
];
const paymentSortFields = [
  "id",
  "createdAt",
  "amount",
  "status",
  "paymentType",
  "gateway",
  "currency",
];

const positiveId = (value, label) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1)
    throw new Error(`${label} phải là số nguyên dương.`);
  return number;
};
const validPage = (page, size) => {
  if (
    !Number.isSafeInteger(page) ||
    page < 0 ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 100
  )
    throw new Error("Trang hoặc kích thước trang không hợp lệ.");
};

export const buildFineQuery = ({
  page = 0,
  size = 20,
  userId = "",
  status = "ALL",
  type = "ALL",
} = {}) => {
  validPage(page, size);
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (userId !== "" && userId != null)
    params.set("userId", String(positiveId(userId, "ID người dùng")));
  if (status !== "ALL") {
    if (!fineStatuses.includes(status))
      throw new Error("Trạng thái tiền phạt không hợp lệ.");
    params.set("status", status);
  }
  if (type !== "ALL") {
    if (!fineTypes.includes(type))
      throw new Error("Loại tiền phạt không hợp lệ.");
    params.set("type", type);
  }
  return params.toString();
};

export const buildPaymentQuery = ({
  page = 0,
  size = 10,
  sortBy = "createdAt",
  sortDir = "DESC",
} = {}) => {
  validPage(page, size);
  if (!paymentSortFields.includes(sortBy) || !["ASC", "DESC"].includes(sortDir))
    throw new Error("Sắp xếp thanh toán không hợp lệ.");
  return new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    sortDir,
  }).toString();
};

const checkedFinePage = (data) => {
  if (
    !Array.isArray(data?.content) ||
    !Number.isSafeInteger(data.pageNumber) ||
    data.pageNumber < 0 ||
    !Number.isSafeInteger(data.totalElements) ||
    data.totalElements < 0 ||
    !Number.isSafeInteger(data.totalPages) ||
    data.totalPages < 0 ||
    data.content.some(
      (fine) =>
        !Number.isSafeInteger(fine?.id) ||
        fine.id < 1 ||
        !fineStatuses.includes(fine.status) ||
        !fineTypes.includes(fine.type),
    )
  )
    throw new Error("Dữ liệu tiền phạt không hợp lệ.");
  return data;
};

const checkedPaymentPage = (data) => {
  if (
    !Array.isArray(data?.content) ||
    !Number.isSafeInteger(data.number) ||
    data.number < 0 ||
    !Number.isSafeInteger(data.totalElements) ||
    data.totalElements < 0 ||
    !Number.isSafeInteger(data.totalPages) ||
    data.totalPages < 0 ||
    data.content.some(
      (payment) =>
        !Number.isSafeInteger(payment?.id) ||
        payment.id < 1 ||
        !paymentStatuses.includes(payment.status),
    )
  )
    throw new Error("Dữ liệu thanh toán không hợp lệ.");
  return {
    ...data,
    content: data.content.map((payment) => {
      const safe = { ...payment };
      delete safe.gatewaySignature;
      return safe;
    }),
  };
};

const checkedSnapshot = (data, paymentId) => {
  if (
    !data ||
    data.paymentId !== paymentId ||
    !paymentStatuses.includes(data.status) ||
    !Number.isSafeInteger(Number(data.amount)) ||
    Number(data.amount) < 1 ||
    data.currency !== "VND"
  )
    throw new Error("Trạng thái thanh toán từ máy chủ không hợp lệ.");
  return data;
};

const finePayload = (form) => {
  const bookLoanId = positiveId(form.bookLoanId, "ID lượt mượn");
  const amount = Number(form.amount);
  if (!fineTypes.includes(form.type))
    throw new Error("Loại tiền phạt không hợp lệ.");
  if (!Number.isSafeInteger(amount) || amount < 1)
    throw new Error("Số tiền phạt phải là số nguyên VND dương.");
  const reason = String(form.reason ?? "").trim();
  const notes = String(form.notes ?? "").trim();
  if (reason.length > 500 || notes.length > 1000)
    throw new Error("Lý do hoặc ghi chú quá dài.");
  return { bookLoanId, type: form.type, amount, reason, notes };
};

export const canWaiveFine = (fine) =>
  ["PENDING", "PARTIALLY_PAID"].includes(fine?.status) &&
  Number(fine?.amountOutstanding) > 0;

export const canReconcilePayment = (payment) =>
  ["PENDING", "PROCESSING"].includes(payment?.status) &&
  payment?.gateway === "PAYOS" &&
  payment?.currency === "VND" &&
  ["FINE", "MEMBERSHIP"].includes(payment?.paymentType);

export const createAdminFinanceApi = (client) => ({
  fines: async (filters = {}, options) =>
    checkedFinePage(
      await client.get(`/api/fines?${buildFineQuery(filters)}`, options),
    ),
  createFine: (form) => client.post("/api/fines", finePayload(form)),
  waiveFine: (fineId, reason) => {
    const normalized = String(reason ?? "").trim();
    if (!normalized || normalized.length > 500)
      throw new Error("Lý do miễn phạt phải có từ 1 đến 500 ký tự.");
    return client.post("/api/fines/waive", {
      fineId: positiveId(fineId, "ID tiền phạt"),
      reason: normalized,
    });
  },
  payments: async (filters = {}, options) =>
    checkedPaymentPage(
      await client.get(`/api/payments?${buildPaymentQuery(filters)}`, options),
    ),
  status: async (paymentId, options) => {
    const id = positiveId(paymentId, "ID thanh toán");
    return checkedSnapshot(
      await client.get(`/api/payments/${id}/status`, options),
      id,
    );
  },
  reconcile: async (paymentId) => {
    const id = positiveId(paymentId, "ID thanh toán");
    return checkedSnapshot(
      await client.post(`/api/payments/${id}/reconcile`),
      id,
    );
  },
});

export const adminFinanceApi = createAdminFinanceApi(api);
