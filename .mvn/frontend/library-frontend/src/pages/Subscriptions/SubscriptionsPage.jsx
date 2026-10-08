import { useEffect, useRef, useState } from "react";
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { subscriptionsApi } from "../../api/subscriptions.js";
import { formatDate } from "../../display.js";
import { availablePlans, canCancelSubscription } from "./subscriptionRules.js";
import { useNavigate } from "react-router-dom";
import { paymentsApi } from "../../api/payments.js";
import { paymentSession } from "../Payments/paymentSession.js";
import { paymentsEnabled } from "../Payments/paymentRules.js";

const vnd = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);

const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [activeError, setActiveError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const creatingPayment = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      subscriptionsApi.plans({ signal: controller.signal }),
      subscriptionsApi.active({ signal: controller.signal }),
    ]).then(([planResult, activeResult]) => {
      if (controller.signal.aborted) return;
      if (planResult.status === "fulfilled" && Array.isArray(planResult.value)) {
        setPlans(availablePlans(planResult.value));
        setPlansError("");
      } else {
        setPlans([]);
        setPlansError(planResult.status === "rejected" && planResult.reason.name !== "AbortError"
          ? planResult.reason.message : "Dữ liệu gói thành viên không hợp lệ.");
      }
      if (activeResult.status === "fulfilled") {
        setActive(activeResult.value);
        setActiveError("");
      } else if (activeResult.reason.status === 404) {
        setActive(null);
        setActiveError("");
      } else {
        setActive(null);
        setActiveError(activeResult.reason.name !== "AbortError" ? activeResult.reason.message : "Không thể tải gói đang dùng.");
      }
      setLoading(false);
    });
    return () => controller.abort();
  }, [refresh]);

  const cancel = async () => {
    if (!canCancelSubscription(active)) return;
    setBusy(true);
    setActionError("");
    try {
      await subscriptionsApi.cancel(active.id, cancelReason.trim());
      setMessage("Đã hủy gói. Quyền sử dụng gói dừng ngay; bạn có thể chọn gói mới.");
      setCancelOpen(false);
      setCancelReason("");
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const createPayment = async () => {
    if (!paymentsEnabled || !selectedPlan || active || activeError || busy || creatingPayment.current) return;
    creatingPayment.current = true;
    setBusy(true);
    setPaymentError("");
    try {
      const response = await paymentsApi.subscribe(selectedPlan.id);
      paymentSession.save(response, { kind: "membership" });
      navigate(`/user/payments/${response.paymentId}`);
    } catch (failure) {
      setPaymentError(failure.status === 409 ? "Bạn đã có gói đang hoạt động. Tải lại trang để kiểm tra."
        : "Chưa thể mở đơn thanh toán. Nếu yêu cầu đã được gửi, không bấm tạo lại trước khi kiểm tra/đối soát. " + (failure.message || ""));
    } finally {
      creatingPayment.current = false;
      setBusy(false);
    }
  };

  return <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-6xl space-y-7">
      <header><h1 className="text-3xl font-bold text-slate-900">Gói thành viên</h1>
        <p className="mt-2 text-slate-600">Xem quyền lợi và theo dõi gói của bạn. Giá hiển thị bằng VND.</p></header>
      {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
      {(plansError || activeError) && <Alert severity="error" action={<Button onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Thử lại</Button>}>
        {[plansError, activeError].filter(Boolean).join(" ")}</Alert>}
      {loading ? <p role="status" className="rounded-2xl bg-white p-6 text-slate-600">Đang tải gói thành viên...</p> : <>
        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm" aria-labelledby="current-plan-title">
          <h2 id="current-plan-title" className="text-xl font-semibold text-slate-900">Gói đang dùng</h2>
          {activeError ? <p className="mt-3 text-slate-600">Chưa xác định được gói đang dùng. Tạm khóa chọn gói và hủy để tránh thao tác sai.</p>
            : !active ? <p className="mt-3 text-slate-600">Bạn chưa có gói thành viên đang hoạt động.</p>
              : <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
                <div><div className="flex items-center gap-2 text-[#1769ff]"><CheckCircleRoundedIcon /><strong className="text-xl">{active.planName || "Gói thành viên"}</strong></div>
                  <p className="mt-2 text-slate-600">Hiệu lực: {formatDate(active.startDate)} – {formatDate(active.endDate)}</p>
                  <p className="mt-1 text-slate-600">Tối đa {active.maxBooksAllowed} sách cùng lúc · {active.maxDaysPerBook} ngày mỗi sách</p>
                  <p className="mt-1 text-slate-600">Còn {active.daysRemaining ?? "—"} ngày</p></div>
                {canCancelSubscription(active) && <Button color="error" variant="outlined" onClick={() => { setActionError(""); setCancelOpen(true); }}>Hủy gói</Button>}
              </div>}
        </section>
        <section aria-labelledby="plan-list-title"><h2 id="plan-list-title" className="mb-4 text-xl font-semibold text-slate-900">Các gói hiện có</h2>
          {!plansError && plans.length === 0 ? <Alert severity="info">Hiện chưa có gói VND đang mở bán.</Alert>
            : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan) => <article key={plan.id} className="flex flex-col rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-2"><WorkspacePremiumRoundedIcon sx={{ color: "#1769ff", fontSize: 38 }} />
                {plan.isFeatured && <Chip size="small" color="primary" label={plan.badgeText || "Nổi bật"} />}</div>
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold text-[#1769ff]">{vnd(plan.price)}</p>
              <p className="mt-1 text-sm text-slate-500">Dùng trong {plan.durationDays} ngày</p>
              <p className="mt-4 flex-1 whitespace-pre-line text-slate-600">{plan.description || "Quyền sử dụng thư viện theo hạn mức của gói."}</p>
              <p className="mt-4 text-sm text-slate-700">Tối đa {plan.maxBooksAllowed} sách cùng lúc · {plan.maxDaysPerBook} ngày mỗi sách</p>
              <Button className="!mt-5" variant="contained" disabled={Boolean(active) || Boolean(activeError)} onClick={() => { setPaymentError(""); setSelectedPlan(plan); }}>
                {active ? "Đang có gói hoạt động" : "Chọn gói"}</Button>
            </article>)}</div>}
        </section>
      </>}
    </div>
    <Dialog open={Boolean(selectedPlan)} onClose={() => setSelectedPlan(null)} fullWidth maxWidth="sm">
      <DialogTitle>{selectedPlan?.name}</DialogTitle>
      <DialogContent><p className="text-slate-700">Gói {selectedPlan?.durationDays} ngày, giá {selectedPlan ? vnd(selectedPlan.price) : "—"}.</p>
        <Alert severity={paymentsEnabled ? "warning" : "info"} sx={{ mt: 2 }}>{paymentsEnabled
          ? "Xác nhận sẽ tạo đơn payOS thật với số tiền của gói. Chỉ thanh toán một lần; quyền gói chỉ kích hoạt sau khi backend xác minh."
          : "Tạo đơn payOS đang tắt ở môi trường này. Chưa có mã QR hoặc khoản thu nào được tạo."}</Alert>
        {paymentError && <Alert severity="error" sx={{ mt: 2 }}>{paymentError}</Alert>}</DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => { setSelectedPlan(null); setPaymentError(""); }}>Đóng</Button>
        <Button variant="contained" disabled={!paymentsEnabled || busy} onClick={createPayment}>{busy ? "Đang tạo đơn..." : "Tạo mã QR payOS"}</Button></DialogActions>
    </Dialog>
    <Dialog open={cancelOpen} onClose={busy ? undefined : () => setCancelOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Xác nhận hủy gói?</DialogTitle>
      <DialogContent><Alert severity="warning" sx={{ mb: 2 }}>Quyền mượn theo gói dừng ngay khi hủy, dù gói còn hạn. Hệ thống không tự hoàn tiền. Sau khi hủy, bạn có thể mua gói mới.</Alert>
        <TextField fullWidth label="Lý do hủy (không bắt buộc)" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 500 } }} />
        {actionError && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}</DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setCancelOpen(false)}>Giữ gói</Button>
        <Button disabled={busy} color="error" variant="contained" onClick={cancel}>{busy ? "Đang xử lý..." : "Xác nhận hủy"}</Button></DialogActions>
    </Dialog>
  </main>;
};

export default SubscriptionsPage;
