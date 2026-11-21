import { useEffect, useState } from "react";
import { api } from "./client";
export function useAdminSummary(reload) {
 const [state, setState] = useState({ data: null, error: "" });
 useEffect(() => {
  const controller = new AbortController();
  setState({ data: null, error: "" });
  api.get("/api/admin/dashboard/summary", { signal: controller.signal })
   .then(data => { if (!controller.signal.aborted) setState({ data, error: "" }); })
   .catch(error => { if (!controller.signal.aborted) setState({ data: null, error: error.message || "Không tải được thống kê." }); });
  return () => controller.abort();
 }, [reload]);
 return state;
}
