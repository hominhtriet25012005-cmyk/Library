import { tokenStore } from "./tokenStore.js";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const createApiClient = ({
  baseUrl = "",
  fetchImpl = fetch,
  getToken = () => null,
  onUnauthorized = () => {},
} = {}) => {
  const request = async (path, { method = "GET", body, signal } = {}) => {
    const token = getToken();
    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
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
      throw new ApiError(
        response.status,
        data?.message || `HTTP ${response.status}`,
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
});
