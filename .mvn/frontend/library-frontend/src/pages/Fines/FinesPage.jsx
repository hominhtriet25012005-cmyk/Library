import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { finesApi } from "../../api/fines.js";
import { formatDate } from "../../display.js";
import { canPayFine, filterFines, fineOutstanding, fineStatusLabels, fineSummary, fineTypeLabels } from "./fineRules.js";
import { useNavigate } from "react-router-dom";
import { paymentsApi } from "../../api/payments.js";
import { paymentSession } from "../Payments/paymentSession.js";
import { paymentsEnabled } from "../Payments/paymentRules.js";

const vnd = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value) || 0);
const statusColor = { PENDING: "warning", PARTIALLY_PAID: "info", PAID: "success", WAIVED: "default" };

const FinesPage = () => {
  const navigate = useNavigate();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const creatingPayment = useRef(false);

  const createPayment = async () => {
    if (!paymentsEnabled || !paymentInfo || !canPayFine(paymentInfo) || paymentBusy || creatingPayment.current) return;
    creatingPayment.current = true;
    setPaymentBusy(true);
    setPaymentError("");
    try {
      const response = await paymentsApi.payFine(paymentInfo.id);
      paymentSession.save(response, { kind: "fine" });
      navigate(`/user/payments/${response.paymentId}`);
    } catch (failure) {
      setPaymentError("Chưa thể mở đơn thanh toán. Nếu yêu cầu đã được gửi, không bấm tạo lại trước khi kiểm tra/đối soát. " + (failure.message || ""));
    } finally {
      creatingPayment.current = false;
      setPaymentBusy(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    finesApi.mine({}, { signal: controller.signal }).then((entries) => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(entries)) throw new Error("Dữ liệu tiền phạt không hợp lệ.");
      setFines(entries);
      setError("");
    }).catch((failure) => {
      if (controller.signal.aborted || failure.name === "AbortError") return;
      setFines([]);
      setError(failure.message || "Không thể tải tiền phạt.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  const summary = useMemo(() => fineSummary(fines), [fines]);
  const visibleFines = useMemo(() => filterFines(fines, { status, type }), [fines, status, type]);

  return <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-center gap-3"><ReceiptLongRoundedIcon sx={{ color: "#1769ff", fontSize: 38 }} />
        <div><h1 className="text-3xl font-bold text-slate-900">Tiền phạt của tôi</h1>
          <p className="mt-1 text-slate-600">Theo dõi khoản phạt, số đã trả và số còn nợ từ hệ thống thư viện.</p></div></header>

      {error && <Alert severity="error" action={<Button onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>}
      {loading ? <p role="status" className="rounded-2xl bg-white p-6 text-slate-600">Đang tải tiền phạt...</p> : !error && <>
        <section aria-label="Tổng hợp tiền phạt" className="grid gap-4 sm:grid-cols-3">
          {[["Tổng khoản phạt", summary.total], ["Khoản còn nợ", summary.payable], ["Tổng tiền còn nợ", vnd(summary.outstanding)]].map(([label, value]) =>
            <div key={label} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">{label}</p>
              <p className="mt-2 text-2xl font-bold text-[#1769ff]">{value}</p></div>)}</section>

        <section aria-label="Bộ lọc tiền phạt" className="flex flex-wrap gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <TextField select label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)} slotProps={{ select: { native: true } }} sx={{ minWidth: 210 }}>
            <option value="ALL">Tất cả trạng thái</option>{Object.entries(fineStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </TextField>
          <TextField select label="Loại tiền phạt" value={type} onChange={(event) => setType(event.target.value)} slotProps={{ select: { native: true } }} sx={{ minWidth: 210 }}>
            <option value="ALL">Tất cả loại</option>{Object.entries(fineTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </TextField>
        </section>

        <section aria-label="Danh sách tiền phạt" className="space-y-4">
          {visibleFines.length === 0 ? <Alert severity="info">{fines.length === 0 ? "Bạn chưa có khoản phạt nào." : "Không có khoản phạt phù hợp bộ lọc."}</Alert>
            : visibleFines.map((fine) => <article key={fine.id} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-slate-500">Khoản phạt #{fine.id} · {fineTypeLabels[fine.type] || fine.type}</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">{fine.bookTitle || "Sách không xác định"}</h2>
                <p className="mt-1 text-sm text-slate-600">{fine.reason || "Không có ghi chú lý do"} · Lập ngày {formatDate(fine.createdAt)}</p></div>
                <Chip size="small" color={statusColor[fine.status] || "default"} label={fineStatusLabels[fine.status] || fine.status} />
              </div>
              <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
                <p>Tiền phạt: <strong>{vnd(fine.amount)}</strong></p><p>Đã trả: <strong>{vnd(fine.amountPaid)}</strong></p>
                <p>Còn nợ: <strong className="text-[#1769ff]">{vnd(fineOutstanding(fine))}</strong></p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2"><Button variant="outlined" onClick={() => setSelected(fine)}>Xem chi tiết</Button>
                {canPayFine(fine) && <Button variant="contained" onClick={() => setPaymentInfo(fine)}>Thanh toán</Button>}</div>
            </article>)}
        </section>
      </>}
    </div>

    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
      <DialogTitle>Chi tiết khoản phạt #{selected?.id}</DialogTitle>
      <DialogContent dividers><div className="space-y-2 text-slate-700">
        <p><strong>Sách:</strong> {selected?.bookTitle || "—"} (ISBN: {selected?.bookIsbn || "—"})</p>
        <p><strong>Mã lượt mượn:</strong> {selected?.bookLoanId ?? "—"}</p>
        <p><strong>Loại:</strong> {fineTypeLabels[selected?.type] || selected?.type || "—"}</p>
        <p><strong>Trạng thái:</strong> {fineStatusLabels[selected?.status] || selected?.status || "—"}</p>
        <p><strong>Lý do:</strong> {selected?.reason || "—"}</p>
        <p><strong>Tiền phạt:</strong> {vnd(selected?.amount)} · <strong>Đã trả:</strong> {vnd(selected?.amountPaid)} · <strong>Còn nợ:</strong> {selected ? vnd(fineOutstanding(selected)) : "—"}</p>
        <p><strong>Ngày tạo:</strong> {formatDate(selected?.createdAt)} · <strong>Ngày trả đủ:</strong> {formatDate(selected?.paidAt)}</p>
        {selected?.notes && <p><strong>Ghi chú:</strong> {selected.notes}</p>}
        {selected?.status === "WAIVED" && <p><strong>Lý do miễn:</strong> {selected.waiverReason || "—"} · {formatDate(selected.waivedAt)}</p>}
      </div></DialogContent>
      <DialogActions><Button onClick={() => setSelected(null)}>Đóng</Button>{selected && canPayFine(selected) && <Button variant="contained" onClick={() => { setPaymentInfo(selected); setSelected(null); }}>Thanh toán</Button>}</DialogActions>
    </Dialog>
    <Dialog open={Boolean(paymentInfo)} onClose={() => setPaymentInfo(null)} fullWidth maxWidth="sm">
      <DialogTitle>Thanh toán khoản phạt #{paymentInfo?.id}</DialogTitle>
      <DialogContent><p className="text-slate-700">Số tiền còn nợ: <strong>{paymentInfo ? vnd(fineOutstanding(paymentInfo)) : "—"}</strong></p>
        <Alert severity={paymentsEnabled ? "warning" : "info"} sx={{ mt: 2 }}>{paymentsEnabled
          ? "Xác nhận sẽ tạo đơn payOS thật cho khoản còn nợ. Chỉ thanh toán một lần; backend sẽ xác minh trước khi cập nhật khoản phạt."
          : "Tạo đơn payOS đang tắt ở môi trường này. Chưa có mã QR hoặc khoản thu nào được tạo."}</Alert>
        {paymentError && <Alert severity="error" sx={{ mt: 2 }}>{paymentError}</Alert>}</DialogContent>
      <DialogActions><Button disabled={paymentBusy} onClick={() => { setPaymentInfo(null); setPaymentError(""); }}>Đóng</Button>
        <Button variant="contained" disabled={!paymentsEnabled || paymentBusy} onClick={createPayment}>{paymentBusy ? "Đang tạo đơn..." : "Tạo mã QR payOS"}</Button></DialogActions>
    </Dialog>
  </main>;
};

export default FinesPage;
