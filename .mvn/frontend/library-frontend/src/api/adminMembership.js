import { api } from "./client.js";

const positiveInteger = (value, label) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1)
    throw new Error(`${label} phải là số nguyên dương.`);
  return parsed;
};

const optionalText = (value) => String(value ?? "").trim();

export const buildPlanPayload = (form) => {
  const planCode = optionalText(form.planCode);
  const name = optionalText(form.name);
  const durationDays = positiveInteger(form.durationDays, "Thời hạn gói");
  const maxBooksAllowed = positiveInteger(
    form.maxBooksAllowed,
    "Số sách tối đa",
  );
  const maxDaysPerBook = positiveInteger(
    form.maxDaysPerBook,
    "Số ngày mượn tối đa",
  );
  const price = Number(form.price);
  const displayOrder =
    form.displayOrder === "" || form.displayOrder == null
      ? 0
      : Number(form.displayOrder);
  if (!planCode || planCode.length > 100)
    throw new Error("Mã gói phải có từ 1 đến 100 ký tự.");
  if (!name || name.length > 100)
    throw new Error("Tên gói phải có từ 1 đến 100 ký tự.");
  if (!Number.isSafeInteger(price) || price < 1 || price > 99999999)
    throw new Error("Giá phải là số nguyên VND từ 1 đến 99.999.999.");
  if (!Number.isSafeInteger(displayOrder) || displayOrder < 0)
    throw new Error("Thứ tự hiển thị phải là số nguyên không âm.");
  const description = optionalText(form.description);
  const badgeText = optionalText(form.badgeText);
  const adminNotes = optionalText(form.adminNotes);
  if (
    description.length > 500 ||
    badgeText.length > 255 ||
    adminNotes.length > 255
  )
    throw new Error("Mô tả, nhãn hoặc ghi chú quá dài.");
  return {
    planCode,
    name,
    description,
    durationDays,
    price,
    currency: "VND",
    maxBooksAllowed,
    maxDaysPerBook,
    displayOrder,
    isActive: form.isActive !== false,
    isFeatured: form.isFeatured === true,
    badgeText,
    adminNotes,
  };
};

export const buildMembershipSearch = ({
  page = 0,
  size = 10,
  userId = "",
  planId = "",
  active = "ALL",
} = {}) => {
  if (
    !Number.isSafeInteger(page) ||
    page < 0 ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 100
  )
    throw new Error("Trang hoặc kích thước trang không hợp lệ.");
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (userId !== "" && userId != null)
    params.set("userId", String(positiveInteger(userId, "ID người dùng")));
  if (planId !== "" && planId != null)
    params.set("planId", String(positiveInteger(planId, "ID gói")));
  if (active !== "ALL") {
    if (active !== "true" && active !== "false")
      throw new Error("Trạng thái gói đăng ký không hợp lệ.");
    params.set("active", active);
  }
  return params.toString();
};

const checkedPlans = (data) => {
  if (
    !Array.isArray(data) ||
    data.some((plan) => !Number.isSafeInteger(plan?.id) || plan.id < 1)
  )
    throw new Error("Dữ liệu gói thành viên không hợp lệ.");
  return data;
};

const checkedMembers = (data) => {
  if (
    !Array.isArray(data?.content) ||
    !Number.isSafeInteger(data.pageNumber) ||
    data.pageNumber < 0 ||
    !Number.isSafeInteger(data.totalPages) ||
    data.totalPages < 0 ||
    !Number.isSafeInteger(data.totalElements) ||
    data.totalElements < 0 ||
    data.content.some((item) => !Number.isSafeInteger(item?.id) || item.id < 1)
  )
    throw new Error("Dữ liệu thành viên đăng ký không hợp lệ.");
  return data;
};

export const membershipStatus = (entry) => {
  if (entry?.cancelledAt) return "Đã hủy";
  if (entry?.isExpired) return "Hết hạn";
  if (entry?.isActive && entry?.isValid) return "Đang hiệu lực";
  return "Chưa có hiệu lực";
};

export const createAdminMembershipApi = (client) => ({
  plans: async (options) =>
    checkedPlans(await client.get("/api/subscription-plans/admin", options)),
  createPlan: (form) =>
    client.post("/api/subscription-plans/admin/create", buildPlanPayload(form)),
  members: async (filters, options) =>
    checkedMembers(
      await client.get(
        `/api/subscriptions/admin/search?${buildMembershipSearch(filters)}`,
        options,
      ),
    ),
});

export const adminMembershipApi = createAdminMembershipApi(api);
