import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { adminFinanceApi, canWaiveFine } from "../../api/adminFinance";

const fineStatuses = { PENDING: "Chưa thanh toán", PARTIALLY_PAID: "Đã trả một phần", PAID: "Đã thanh toán", WAIVED: "Đã miễn" };
const fineTypes = { OVERDUE: "Quá hạn", DAMAGE: "Hư hỏng", LOSS: "Mất sách", PROCESSING: "Phí xử lý" };
const money = (value) => Number.isSafeInteger(Number(value))
  ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value)) : "—";
const date = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(parsed);
};
const Info = ({ label, value }) => <Box><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ overflowWrap: "anywhere" }}>{value ?? "—"}</Typography></Box>;
const initialFilter = { userId: "", status: "ALL", type: "ALL" };
const initialForm = { bookLoanId: "", type: "OVERDUE", amount: "", reason: "", notes: "" };

const AdminFinesPage = () => {
  const [draft, setDraft] = useState(initialFilter);
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [waiveReason, setWaiveReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    adminFinanceApi.fines({ ...filter, page }, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      if (page > 0 && page >= data.totalPages) { setPage(Math.max(0, data.totalPages - 1)); return; }
      setResult(data); setError("");
    }).catch((cause) => {
      if (!controller.signal.aborted && cause.name !== "AbortError") setError(cause.message || "Không tải được tiền phạt.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, page, reload]);

  const applyFilter = () => { setFilter({ ...draft }); setPage(0); setResult(null); setLoading(true); setError(""); };
  const retry = () => { setLoading(true); setError(""); setReload((value) => value + 1); };
  const openAction = (kind, fine = null) => {
    setSelected(null); setAction({ kind, fine }); setActionError(""); setForm(initialForm); setWaiveReason("");
  };
  const submitAction = async () => {
    if (!action || busy) return;
    setBusy(true); setActionError(""); setNotice("");
    try {
      const saved = action.kind === "create" ? await adminFinanceApi.createFine(form)
        : await adminFinanceApi.waiveFine(action.fine.id, waiveReason);
      setNotice(action.kind === "create" ? `Đã tạo khoản phạt #${saved.id}.`
        : `Đã miễn phần còn nợ của khoản phạt #${saved.id}.`);
      setAction(null); setSelected(saved); setLoading(true); setReload((value) => value + 1);
    } catch (cause) { setActionError(cause.message || "Thao tác không thành công."); }
    finally { setBusy(false); }
  };

  return <Box component="section" aria-label="Quản lý tiền phạt" sx={{ maxWidth: 1240, mx: "auto", py: 4 }}>
    <Typography variant="overline" color="primary" fontWeight={800}>ADMIN · AD7</Typography>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 1 }}>
      <Typography component="h2" variant="h4" fontWeight={800} sx={{ color: "#172b4d" }}>Tiền phạt</Typography>
      <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => openAction("create")}>Tạo khoản phạt</Button>
    </Stack>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Theo dõi khoản phải thu, tạo khoản phạt theo lượt mượn và miễn phần còn nợ. Thanh toán được xác nhận ở luồng payOS riêng.</Typography>
    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}><Stack direction={{ xs: "column", md: "row" }} gap={1.5}>
      <TextField size="small" type="number" label="ID người dùng" value={draft.userId} onChange={(event) => setDraft({ ...draft, userId: event.target.value })} sx={{ flex: 1 }} />
      <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Trạng thái</InputLabel><Select label="Trạng thái" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><MenuItem value="ALL">Tất cả</MenuItem>{Object.entries(fineStatuses).map(([key, value]) => <MenuItem key={key} value={key}>{value}</MenuItem>)}</Select></FormControl>
      <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Loại</InputLabel><Select label="Loại" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}><MenuItem value="ALL">Tất cả</MenuItem>{Object.entries(fineTypes).map(([key, value]) => <MenuItem key={key} value={key}>{value}</MenuItem>)}</Select></FormControl>
      <Button variant="outlined" onClick={applyFilter}>Tra cứu</Button>
    </Stack></Paper>
    {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
    {error && <Alert severity="error" action={<Button onClick={retry}>Thử lại</Button>} sx={{ mb: 2 }}>{error}</Alert>}
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}><Table size="small" sx={{ minWidth: 830 }}><TableHead><TableRow>
      <TableCell>ID</TableCell><TableCell>Người dùng</TableCell><TableCell>Sách / lượt mượn</TableCell><TableCell>Loại</TableCell><TableCell align="right">Tổng / còn nợ</TableCell><TableCell>Trạng thái</TableCell><TableCell align="right">Thao tác</TableCell>
    </TableRow></TableHead><TableBody>
      {loading && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>}
      {!loading && !error && result?.content.map((fine) => <TableRow key={fine.id} hover>
        <TableCell>#{fine.id}</TableCell><TableCell><Typography fontWeight={700}>{fine.userName || `#${fine.userId}`}</Typography><Typography variant="caption" color="text.secondary">{fine.userEmail}</Typography></TableCell>
        <TableCell>{fine.bookTitle || `Sách từ lượt mượn #${fine.bookLoanId}`}<Typography variant="caption" display="block" color="text.secondary">Lượt mượn #{fine.bookLoanId}</Typography></TableCell>
        <TableCell>{fineTypes[fine.type]}</TableCell><TableCell align="right">{money(fine.amount)}<Typography variant="caption" display="block">Còn {money(fine.amountOutstanding)}</Typography></TableCell>
        <TableCell><Chip size="small" color={fine.status === "PAID" ? "success" : fine.status === "WAIVED" ? "default" : "warning"} label={fineStatuses[fine.status]} /></TableCell>
        <TableCell align="right"><Button size="small" onClick={() => setSelected(fine)}>Chi tiết</Button></TableCell>
      </TableRow>)}
      {!loading && !error && result?.content.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>Không có khoản phạt phù hợp.</TableCell></TableRow>}
    </TableBody></Table></TableContainer>
    {!loading && !error && result && <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={1} sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary">{result.totalElements} khoản · Trang {result.totalPages ? page + 1 : 0}/{result.totalPages}</Typography>
      <Button disabled={page === 0} onClick={() => { setLoading(true); setPage(page - 1); }}>Trước</Button>
      <Button disabled={page + 1 >= result.totalPages} onClick={() => { setLoading(true); setPage(page + 1); }}>Sau</Button>
    </Stack>}
    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm"><DialogTitle>Chi tiết tiền phạt #{selected?.id}</DialogTitle><DialogContent>{selected && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: 1 }}>
      <Info label="Người dùng" value={`${selected.userName || "—"} · #${selected.userId}`} /><Info label="Email" value={selected.userEmail} />
      <Info label="Sách" value={selected.bookTitle} /><Info label="Lượt mượn" value={`#${selected.bookLoanId}`} />
      <Info label="Loại" value={fineTypes[selected.type]} /><Info label="Trạng thái" value={fineStatuses[selected.status]} />
      <Info label="Số tiền" value={money(selected.amount)} /><Info label="Đã trả" value={money(selected.amountPaid)} />
      <Info label="Còn nợ" value={money(selected.amountOutstanding)} /><Info label="Ngày tạo" value={date(selected.createdAt)} />
      <Info label="Lý do" value={selected.reason || "—"} /><Info label="Ghi chú" value={selected.notes || "—"} />
      <Info label="Đã miễn lúc" value={date(selected.waivedAt)} /><Info label="Lý do miễn" value={selected.waiverReason || "—"} />
      <Info label="Người miễn" value={selected.waivedByUserName || "—"} /><Info label="Mã giao dịch" value={selected.transactionId || "—"} />
    </Box>}</DialogContent><DialogActions>
      {canWaiveFine(selected) && <Button color="warning" onClick={() => openAction("waive", selected)}>Miễn phần còn nợ</Button>}
      <Button onClick={() => setSelected(null)}>Đóng</Button>
    </DialogActions></Dialog>
    <Dialog open={Boolean(action)} onClose={busy ? undefined : () => setAction(null)} fullWidth maxWidth="sm"><DialogTitle>{action?.kind === "create" ? "Tạo khoản phạt" : `Miễn khoản phạt #${action?.fine?.id}`}</DialogTitle><DialogContent><Stack gap={2} sx={{ pt: 1 }}>
      {action?.kind === "create" ? <>
        <Typography variant="body2" color="text.secondary">Người phải trả được xác định từ lượt mượn; ADMIN không chọn hoặc sửa user của khoản phạt.</Typography>
        <TextField label="ID lượt mượn" type="number" required value={form.bookLoanId} onChange={(event) => setForm({ ...form, bookLoanId: event.target.value })} />
        <FormControl required><InputLabel>Loại tiền phạt</InputLabel><Select label="Loại tiền phạt" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{Object.entries(fineTypes).map(([key, value]) => <MenuItem key={key} value={key}>{value}</MenuItem>)}</Select></FormControl>
        <TextField label="Số tiền (VND)" type="number" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} inputProps={{ min: 1, step: 1 }} />
        <TextField label="Lý do" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} inputProps={{ maxLength: 500 }} />
        <TextField label="Ghi chú" multiline minRows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} inputProps={{ maxLength: 1000 }} />
      </> : <>
        <Alert severity="warning">Chỉ miễn phần còn nợ {money(action?.fine?.amountOutstanding)}; số tiền đã trả không được hoàn tự động. Thao tác này không thể hoàn tác từ giao diện.</Alert>
        <TextField label="Lý do miễn phạt" required multiline minRows={2} value={waiveReason} onChange={(event) => setWaiveReason(event.target.value)} inputProps={{ maxLength: 500 }} />
      </>}
      {actionError && <Alert severity="error">{actionError}</Alert>}
    </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={() => setAction(null)}>Đóng</Button><Button disabled={busy} variant="contained" color={action?.kind === "waive" ? "warning" : "primary"} onClick={submitAction}>{busy ? "Đang xử lý…" : "Xác nhận"}</Button></DialogActions></Dialog>
  </Box>;
};

export default AdminFinesPage;
