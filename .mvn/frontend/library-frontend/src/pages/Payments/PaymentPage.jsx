import { useEffect, useRef, useState } from "react";
import { Alert, Button, CircularProgress } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { Link, useLocation, useParams } from "react-router-dom";
import { paymentsApi } from "../../api/payments.js";
import { formatDate } from "../../display.js";
import { paymentSession } from "./paymentSession.js";
import { paymentView, paymentsEnabled, readReturnOrderCode, validateSnapshot } from "./paymentRules.js";

const vnd = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const PaymentDetails = ({ paymentId, returned }) => {
  const cached = paymentSession.get(paymentId);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(Boolean(paymentId));
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [reconciling, setReconciling] = useState(false);
  const reconcilingRef = useRef(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    if (!paymentId) return;
    const controller = new AbortController();
    const version = ++requestVersion.current;
    paymentsApi.status(paymentId, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted || version !== requestVersion.current) return;
        setSnapshot(validateSnapshot(result, paymentId));
        setError("");
      })
      .catch((failure) => {
        if (controller.signal.aborted || version !== requestVersion.current || failure.name === "AbortError") return;
        setError(failure.message || "Không thể kiểm tra trạng thái thanh toán.");
      })
      .finally(() => { if (!controller.signal.aborted && version === requestVersion.current) setLoading(false); });
    return () => controller.abort();
  }, [paymentId, refresh]);

  useEffect(() => {
    if (!paymentId || error || reconciling || !snapshot || paymentView(snapshot.status).terminal) return;
    const timer = window.setTimeout(() => setRefresh((value) => value + 1), 6000);
    return () => window.clearTimeout(timer);
  }, [paymentId, snapshot, error, refresh, reconciling]);

  const reconcile = async () => {
    if (!paymentsEnabled || !paymentId || reconcilingRef.current) return;
    reconcilingRef.current = true;
    const version = ++requestVersion.current;
    setReconciling(true);
    setError("");
    try {
      const result = await paymentsApi.reconcile(paymentId);
      if (version === requestVersion.current) setSnapshot(validateSnapshot(result, paymentId));
    } catch (failure) {
      if (version === requestVersion.current) setError(failure.message || "Chưa thể đối soát với payOS. Không tạo đơn mới.");
    } finally {
      reconcilingRef.current = false;
      setReconciling(false);
    }
  };

  const view = snapshot ? paymentView(snapshot.status) : null;
  const source = snapshot?.fineId || cached?.kind === "fine" ? "/user/my-fines" : "/user/subscriptions";
  const matchingCache = snapshot && cached?.amount === Number(snapshot.amount) ? cached : null;

  return <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-3xl font-bold text-slate-900">{returned ? "Kết quả thanh toán" : "Thanh toán payOS / VietQR"}</h1>
      {!paymentId ? <Alert severity="error">Đường dẫn không có mã đơn hợp lệ. Vui lòng trở lại trang gói hoặc tiền phạt.</Alert> : <>
        <p className="text-slate-600">Mã đơn: <strong>#{paymentId}</strong></p>
        {returned && <Alert severity="info">Bạn đã quay về từ payOS. Thông tin trên URL không phải xác nhận thanh toán; kết quả dưới đây lấy từ backend thư viện.</Alert>}
        {loading && !snapshot && <p role="status" className="flex items-center gap-3 text-slate-600"><CircularProgress size={20} /> Đang kiểm tra trạng thái...</p>}
        {error && <Alert severity="error" action={<Button onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>}
        {snapshot && <>
          <Alert severity={view.severity}>{view.label}{!view.terminal && ". Trang sẽ kiểm tra lại trạng thái từ hệ thống; không chuyển khoản lần hai khi chưa đối soát."}</Alert>
          <div className="grid gap-3 rounded-xl bg-blue-50 p-5 text-slate-700 sm:grid-cols-2">
            <p>Số tiền: <strong>{vnd(snapshot.amount)}</strong></p><p>Loại: <strong>{snapshot.fineId ? "Tiền phạt" : "Gói thành viên"}</strong></p>
            <p>Trạng thái hệ thống: <strong>{view.label}</strong></p><p>Hoàn tất: <strong>{formatDate(snapshot.completedAt)}</strong></p>
          </div>
          {!view.terminal && matchingCache?.qrCode && <section className="rounded-xl border border-blue-100 p-5 text-center" aria-label="Mã VietQR">
            <h2 className="mb-4 text-lg font-semibold">Quét VietQR để thanh toán</h2>
            <div className="inline-block rounded-xl bg-white p-3"><QRCodeSVG value={matchingCache.qrCode} size={220} level="M" /></div>
            <p className="mt-3 text-sm text-slate-600">Chỉ thanh toán đúng {vnd(snapshot.amount)} cho mã đơn #{paymentId}. Sau khi quét, đợi hệ thống xác nhận.</p>
          </section>}
          {!view.terminal && matchingCache?.checkoutUrl && <Button component="a" href={matchingCache.checkoutUrl} target="_blank" rel="noopener noreferrer" variant="contained">
            Mở trang thanh toán payOS</Button>}
          {!view.terminal && !matchingCache?.checkoutUrl && !matchingCache?.qrCode && <Alert severity="warning">Đơn đã tồn tại nhưng phiên này không có mã QR/link. Đừng tạo lại đơn hoặc chuyển khoản thủ công; hãy kiểm tra trạng thái hoặc liên hệ quản trị viên.</Alert>}
          {!view.terminal && <div className="flex flex-wrap gap-2"><Button variant="outlined" disabled={reconciling} onClick={() => setRefresh((value) => value + 1)}>Kiểm tra trạng thái</Button>
            <Button variant="outlined" disabled={!paymentsEnabled || reconciling} onClick={reconcile}>{reconciling ? "Đang đối soát..." : "Đối soát với payOS"}</Button></div>}
          {!view.terminal && !paymentsEnabled && <p className="text-sm text-slate-500">Đối soát payOS chưa được bật ở môi trường này; việc đọc trạng thái hệ thống vẫn hoạt động.</p>}
          {view.success && <Alert severity="success">Hệ thống đã xác nhận khoản thanh toán. Trang gói/tiền phạt sẽ tải lại dữ liệu khi bạn quay lại.</Alert>}
        </>}
      </>}
      <Button component={Link} to={source}>Trở lại {source.endsWith("my-fines") ? "tiền phạt" : "gói thành viên"}</Button>
    </div>
  </main>;
};

const PaymentPage = ({ returned = false }) => {
  const { paymentId: pathId } = useParams();
  const location = useLocation();
  const paymentId = returned ? readReturnOrderCode(location.search) : readReturnOrderCode(`?orderCode=${pathId || ""}`);
  return <PaymentDetails key={paymentId ?? "invalid"} paymentId={paymentId} returned={returned} />;
};

export default PaymentPage;
