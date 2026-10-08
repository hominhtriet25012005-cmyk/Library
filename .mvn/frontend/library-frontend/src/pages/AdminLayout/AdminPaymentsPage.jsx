import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography,
} from "@mui/material";
import { adminFinanceApi, canReconcilePayment } from "../../api/adminFinance";
import { paymentsEnabled } from "../Payments/paymentRules";

const statusNames = {
  PENDING: "Chờ thanh toán", PROCESSING: "Đang xác nhận", SUCCESS: "Đã xác nhận",
  FAILED: "Thất bại", CANCELLED: "Đã hủy", REFUNDED: "Đã hoàn tiền",
};
const typeNames = { FINE: "Tiền phạt", MEMBERSHIP: "Gói thành viên",
  LOST_BOOK_PENALTY: "Mất sách", DAMAGED_BOOK_PENALTY: "Hư hỏng sách" };
const money = (value, currency) => currency === "VND" && Number.isSafeInteger(Number(value))
  ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value))
  : `${value ?? "—"} ${currency ?? ""}`;
const date = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(parsed);
};
const Info = ({ label, value }) => <Box><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ overflowWrap: "anywhere" }}>{value ?? "—"}</Typography></Box>;

const AdminPaymentsPage = () => {
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusReload, setStatusReload] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    adminFinanceApi.payments({ page }, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      if (page > 0 && page >= data.totalPages) { setPage(Math.max(0, data.totalPages - 1)); return; }
      setResult(data); setError("");
    }).catch((cause) => {
      if (!controller.signal.aborted && cause.name !== "AbortError") setError(cause.message || "Không tải được thanh toán.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, reload]);

  useEffect(() => {
    if (!selected) return undefined;
    const controller = new AbortController();
    adminFinanceApi.status(selected.id, { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) { setSnapshot(data); setStatusError(""); }
    }).catch((cause) => {
      if (!controller.signal.aborted && cause.name !== "AbortError") setStatusError(cause.message || "Không đọc được trạng thái.");
    }).finally(() => { if (!controller.signal.aborted) setStatusLoading(false); });
    return () => controller.abort();
  }, [selected, statusReload]);

  const openDetail = (payment) => { setSelected(payment); setSnapshot(null); setStatusLoading(true); setStatusError(""); setNotice(""); };
  const reconcile = async () => {
    if (!paymentsEnabled || !selected || !canReconcilePayment({ ...selected, status: snapshot?.status ?? selected.status }) || busy) return;
    setBusy(true); setStatusError(""); setNotice("");
    try {
      const latest = await adminFinanceApi.reconcile(selected.id);
      setSnapshot(latest); setConfirming(false);
      setNotice(latest.status === "SUCCESS"
        ? `payOS đã xác nhận thanh toán #${selected.id}; dữ liệu hệ thống được cập nhật bởi backend.`
        : `Đã đối soát #${selected.id}; payOS chưa xác nhận thanh toán thành công.`);
      setLoading(true); setReload((value) => value + 1);
    } catch (cause) { setStatusError(cause.message || "Đối soát không thành công."); setConfirming(false); }
    finally { setBusy(false); }
  };

  return <Box component="section" aria-label="Quản lý thanh toán" sx={{ maxWidth: 1240, mx: "auto", py: 4 }}>
    <Typography variant="overline" color="primary" fontWeight={800}>ADMIN · AD7</Typography>
    <Typography component="h2" variant="h4" fontWeight={800} sx={{ color: "#172b4d", mb: 1 }}>Thanh toán</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Danh sách giao dịch và trạng thái được đọc từ backend. Đối soát chỉ dựa vào bằng chứng từ payOS; không có nút tự đánh dấu đã trả hoặc hoàn tiền.</Typography>
    {!paymentsEnabled && <Alert severity="info" sx={{ mb: 2 }}>Tạo đơn và đối soát payOS đang tắt ở môi trường này. Có thể xem dữ liệu/trạng thái đã lưu; muốn đối soát thật cần cấu hình môi trường an toàn trước.</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>}
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}><Table size="small" sx={{ minWidth: 860 }}><TableHead><TableRow>
      <TableCell>ID</TableCell><TableCell>Người dùng</TableCell><TableCell>Loại</TableCell><TableCell>Số tiền</TableCell><TableCell>Cổng</TableCell><TableCell>Trạng thái</TableCell><TableCell>Ngày tạo</TableCell><TableCell align="right">Thao tác</TableCell>
    </TableRow></TableHead><TableBody>
      {loading && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>}
      {!loading && !error && result?.content.map((payment) => <TableRow key={payment.id} hover>
        <TableCell>#{payment.id}</TableCell><TableCell><Typography fontWeight={700}>{payment.userName || `#${payment.userId}`}</Typography><Typography variant="caption" color="text.secondary">{payment.userEmail}</Typography></TableCell>
        <TableCell>{typeNames[payment.paymentType] || payment.paymentType}</TableCell><TableCell>{money(payment.amount, payment.currency)}</TableCell>
        <TableCell>{payment.gateway}</TableCell><TableCell><Chip size="small" variant="outlined" color={payment.status === "SUCCESS" ? "success" : payment.status === "FAILED" ? "error" : "default"} label={statusNames[payment.status]} /></TableCell>
        <TableCell>{date(payment.createdAt)}</TableCell><TableCell align="right"><Button size="small" onClick={() => openDetail(payment)}>Chi tiết</Button></TableCell>
      </TableRow>)}
      {!loading && !error && result?.content.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>Chưa có giao dịch.</TableCell></TableRow>}
    </TableBody></Table></TableContainer>
    {!loading && !error && result && <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={1} sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary">{result.totalElements} giao dịch · Trang {result.totalPages ? page + 1 : 0}/{result.totalPages}</Typography>
      <Button disabled={page === 0} onClick={() => { setLoading(true); setPage(page - 1); }}>Trước</Button>
      <Button disabled={page + 1 >= result.totalPages} onClick={() => { setLoading(true); setPage(page + 1); }}>Sau</Button>
    </Stack>}
    <Dialog open={Boolean(selected)} onClose={busy ? undefined : () => setSelected(null)} fullWidth maxWidth="sm"><DialogTitle>Chi tiết thanh toán #{selected?.id}</DialogTitle><DialogContent>{selected && <Stack gap={2} sx={{ pt: 1 }}>
      {notice && <Alert severity={snapshot?.status === "SUCCESS" ? "success" : "info"}>{notice}</Alert>}
      {statusError && <Alert severity="error">{statusError}</Alert>}
      {statusLoading && <Stack direction="row" gap={1} alignItems="center"><CircularProgress size={18} /><Typography>Đang kiểm tra trạng thái đã lưu…</Typography></Stack>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
        <Info label="Người dùng" value={`${selected.userName || "—"} · #${selected.userId}`} /><Info label="Email" value={selected.userEmail} />
        <Info label="Loại" value={typeNames[selected.paymentType] || selected.paymentType} /><Info label="Trạng thái mới nhất" value={statusLoading ? "Đang tải…" : snapshot ? statusNames[snapshot.status] : statusError ? "Chưa xác minh được" : "—"} />
        <Info label="Số tiền" value={money(selected.amount, selected.currency)} /><Info label="Cổng" value={selected.gateway} />
        <Info label="Khoản phạt" value={selected.fineId ? `#${selected.fineId}` : "—"} /><Info label="Đăng ký" value={selected.subscriptionId ? `#${selected.subscriptionId}` : "—"} />
        <Info label="Mã đơn payOS" value={selected.gatewayOrderId || "—"} /><Info label="Mã tham chiếu" value={selected.gatewayPaymentId || selected.transactionId || "—"} />
        <Info label="Ngày tạo" value={date(selected.createdAt)} /><Info label="Xác nhận lúc" value={date(snapshot?.completedAt || selected.completedAt)} />
        <Info label="Mô tả" value={selected.description || "—"} /><Info label="Lỗi ghi nhận" value={selected.failureReason || "—"} />
      </Box>
    </Stack>}</DialogContent><DialogActions>
      <Button disabled={busy || statusLoading} onClick={() => { setStatusLoading(true); setStatusReload((value) => value + 1); }}>Kiểm tra trạng thái</Button>
      {paymentsEnabled && canReconcilePayment({ ...selected, status: snapshot?.status ?? selected?.status }) && <Button disabled={busy || statusLoading} variant="outlined" onClick={() => setConfirming(true)}>Đối soát payOS</Button>}
      <Button disabled={busy} onClick={() => setSelected(null)}>Đóng</Button>
    </DialogActions></Dialog>
    <Dialog open={confirming} onClose={busy ? undefined : () => setConfirming(false)} fullWidth maxWidth="xs"><DialogTitle>Đối soát giao dịch #{selected?.id}?</DialogTitle><DialogContent><Alert severity="warning">Backend sẽ hỏi payOS và chỉ cập nhật khi bằng chứng giao dịch khớp hoàn toàn. Nếu payOS chưa xác nhận, trạng thái không tự chuyển thành thành công. Không dùng cho đơn đã hủy/thất bại/hoàn tiền.</Alert>{statusError && <Alert severity="error" sx={{ mt: 2 }}>{statusError}</Alert>}</DialogContent><DialogActions><Button disabled={busy} onClick={() => setConfirming(false)}>Đóng</Button><Button disabled={busy} variant="contained" onClick={reconcile}>{busy ? "Đang đối soát…" : "Xác nhận đối soát"}</Button></DialogActions></Dialog>
  </Box>;
};

export default AdminPaymentsPage;
