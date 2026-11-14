import { tokenStore } from "./tokenStore.js";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const fallbackMessageByStatus = (status) => {
  if (status === 400) return "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
  if (status === 401) return "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.";
  if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (status === 404) return "Không tìm thấy dữ liệu được yêu cầu.";
  if (status === 409) return "Dữ liệu đã thay đổi hoặc đang xung đột. Vui lòng tải lại.";
  if (status >= 500)
    return "Máy chủ tạm thời không thể xử lý yêu cầu. Vui lòng thử lại.";
  return "Không thể xử lý yêu cầu. Vui lòng thử lại.";
};

export const createApiClient = ({
  baseUrl = "",
  fetchImpl = fetch,
  getToken = () => null,
  onUnauthorized = () => {},
  onForbidden = () => {},
} = {}) => {
  const request = async (path, { method = "GET", body, signal } = {}) => {
    const token = getToken();
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          ...(!isFormData && body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(isFormData
          ? { body }
          : body !== undefined
            ? { body: JSON.stringify(body) }
            : {}),
        ...(signal ? { signal } : {}),
      });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw new ApiError(0, "Không thể kết nối máy chủ. Vui lòng thử lại.");
    }

    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      if (response.status === 401 && token) onUnauthorized();
      if (response.status === 403 && token) onForbidden(path);
      throw new ApiError(
        response.status,
        data?.message ||
          data?.error ||
          data?.["Lỗi"] ||
          data?.detail ||
          fallbackMessageByStatus(response.status),
      );
    }
    return data;
  };

  return {
    get: (path, options) => request(path, options),
    post: (path, body, options) =>
      request(path, { ...options, method: "POST", body }),
    put: (path, body, options) =>
      request(path, { ...options, method: "PUT", body }),
    patch: (path, body, options) =>
      request(path, { ...options, method: "PATCH", body }),
    delete: (path, options) => request(path, { ...options, method: "DELETE" }),
  };
};

export const api = createApiClient({
  baseUrl: import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "",
  getToken: tokenStore.get,
  onUnauthorized: () => {
    tokenStore.clear();
    window.dispatchEvent(new Event("library:session-expired"));
  },
  onForbidden: (path) => {
    window.dispatchEvent(
      new CustomEvent("library:access-forbidden", { detail: { path } }),
    );
  },
});
