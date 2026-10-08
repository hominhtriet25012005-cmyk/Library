import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  adminReservationsApi, canAdminCancel, canAdminFulfill,
} from "../../api/adminReservations";

const statusNames = {
  PENDING: "Đang chờ", AVAILABLE: "Sẵn sàng nhận", FULFILLED: "Đã giao sách",
  CANCELLED: "Đã hủy", EXPIRED: "Hết hạn",
};
const dateTimeLabel = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không xác định";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
};
const emptyFilter = { userId: "", bookId: "", status: "ALL", activeOnly: false, sortDirection: "DESC" };

const Detail = ({ label, value }) => <Box>
  <Typography variant="caption" color="text.secondary">{label}</Typography>
  <Typography sx={{ overflowWrap: "anywhere" }}>{value ?? "—"}</Typography>
</Box>;

const AdminReservationsPage = () => {
  const [draft, setDraft] = useState(emptyFilter);
  const [filter, setFilter] = useState(emptyFilter);
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [form, setForm] = useState({ userId: "", bookId: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    adminReservationsApi.search({ ...filter, page }, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (page > 0 && page >= data.totalPages) { setPage(Math.max(0, data.totalPages - 1)); return; }
        setResult(data); setLoadError("");
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError")
          setLoadError(error.message || "Không thể tải danh sách đặt giữ.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, page, reload]);

  const applyFilter = (next) => {
    setDraft(next); setFilter(next); setPage(0); setResult(null);
    setLoading(true); setLoadError(""); setNotice("");
  };
  const showQueue = (bookId) => applyFilter({ userId: "", bookId: String(bookId),
    status: "ALL", activeOnly: true, sortDirection: "ASC" });
  const retry = () => { setLoading(true); setLoadError(""); setReload((value) => value + 1); };
  const openAction = (kind, reservation = null) => {
    setSelected(null); setAction({ kind, reservation }); setActionError("");
    setForm({ userId: "", bookId: "", notes: "" });
  };
  const closeAction = () => { if (!busy) setAction(null); };
  const submitAction = async () => {
    if (!action || busy) return;
    setBusy(true); setActionError(""); setNotice("");
    try {
      let updated;
      if (action.kind === "create") {
        updated = await adminReservationsApi.create(form);
        setNotice(`Đã tạo đặt giữ #${updated.id}.`);
      } else if (action.kind === "cancel") {
        updated = await adminReservationsApi.cancel(action.reservation.id);
        setNotice(`Đã hủy đặt giữ #${updated.id}.`);
      } else {
        updated = await adminReservationsApi.fulfill(action.reservation.id);
        setNotice(`Đã xác nhận giao sách và tạo lượt mượn từ đặt giữ #${updated.id}.`);
      }
      setAction(null); setSelected(updated); setLoading(true); setReload((value) => value + 1);
    } catch (error) {
      setActionError(error.message || "Thao tác không thành công. Vui lòng thử lại.");
    } finally { setBusy(false); }
  };

  return <Box component="section" aria-label="Quản lý đặt giữ" sx={{ maxWidth: 1250, mx: "auto", py: { xs: 3, sm: 4 } }}>
    <Typography variant="overline" sx={{ color: "#1769ff", fontWeight: 800 }}>ADMIN · AD5</Typography>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} sx={{ mb: 1 }}>
      <Typography component="h2" variant="h4" sx={{ color: "#172b4d", fontWeight: 800 }}>Đặt giữ</Typography>
      <Button variant="contained" onClick={() => openAction("create")}>Tạo đặt giữ</Button>
    </Stack>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
      Xem toàn hệ thống và hàng đợi theo sách. Chỉ ADMIN xác nhận giao sách cho người đứng đầu khi sách có bản sẵn.
    </Typography>

    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: "#dce7f8", mb: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} gap={1.5} alignItems={{ md: "center" }}>
        <TextField size="small" type="number" label="ID người dùng" value={draft.userId}
          onChange={(event) => setDraft({ ...draft, userId: event.target.value })} sx={{ flex: 1 }} />
        <TextField size="small" type="number" label="ID sách" value={draft.bookId}
          onChange={(event) => setDraft({ ...draft, bookId: event.target.value })} sx={{ flex: 1 }} />
        <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Trạng thái</InputLabel>
          <Select label="Trạng thái" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
            <MenuItem value="ALL">Tất cả</MenuItem>
            {Object.entries(statusNames).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </Select></FormControl>
        <Button variant="outlined" onClick={() => applyFilter({ ...draft })}>Tra cứu</Button>
      </Stack>
      <FormControlLabel control={<Checkbox checked={draft.activeOnly} onChange={(event) => setDraft({ ...draft, activeOnly: event.target.checked, sortDirection: event.target.checked ? "ASC" : "DESC" })} />}
        label="Chỉ hàng đợi đang hoạt động" />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        Lọc và phân trang ở backend. Chọn “Hàng đợi sách” trong danh sách để xem đúng thứ tự của một đầu sách.
      </Typography>
    </Paper>

    {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
    {loadError && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={retry}>Thử lại</Button>}>{loadError}</Alert>}
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: "#dce7f8" }}>
      <Table size="small" aria-label="Danh sách đặt giữ" sx={{ minWidth: 800 }}>
        <TableHead><TableRow>
          <TableCell>ID</TableCell><TableCell>Người đặt</TableCell><TableCell>Sách</TableCell>
          <TableCell>Trạng thái</TableCell><TableCell>Vị trí</TableCell><TableCell>Đặt lúc</TableCell><TableCell align="right">Thao tác</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={24} aria-label="Đang tải đặt giữ" /></TableCell></TableRow>}
          {!loading && !loadError && result?.content.map((entry) => <TableRow key={entry.id} hover>
            <TableCell>#{entry.id}</TableCell>
            <TableCell><Typography fontWeight={700}>{entry.userName || `Người dùng #${entry.userId}`}</Typography><Typography variant="caption" color="text.secondary">{entry.userEmail}</Typography></TableCell>
            <TableCell><Typography fontWeight={700}>{entry.bookTitle || `Sách #${entry.bookId}`}</Typography><Typography variant="caption" color="text.secondary">{entry.bookIsbn}</Typography></TableCell>
            <TableCell><Chip size="small" variant="outlined" color={entry.status === "AVAILABLE" ? "success" : entry.status === "PENDING" ? "primary" : "default"} label={statusNames[entry.status] || entry.status} /></TableCell>
            <TableCell>{["PENDING", "AVAILABLE"].includes(entry.status) ? entry.queuePosition ?? "—" : "—"}</TableCell>
            <TableCell>{dateTimeLabel(entry.reservedAt)}</TableCell>
            <TableCell align="right"><Stack direction="row" justifyContent="flex-end" gap={0.5}>
              <Button size="small" onClick={() => setSelected(entry)}>Xem</Button>
              {entry.bookId && <Button size="small" onClick={() => showQueue(entry.bookId)}>Hàng đợi sách</Button>}
            </Stack></TableCell>
          </TableRow>)}
          {!loading && !loadError && result?.content.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>Không có đặt giữ phù hợp.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </TableContainer>
    {!loading && !loadError && result && <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={1} sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary">{result.totalElements} lượt · Trang {result.totalPages ? page + 1 : 0}/{result.totalPages}</Typography>
      <Button disabled={page === 0} onClick={() => { setLoading(true); setPage(page - 1); }}>Trước</Button>
      <Button disabled={page + 1 >= result.totalPages} onClick={() => { setLoading(true); setPage(page + 1); }}>Sau</Button>
    </Stack>}

    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
      <DialogTitle>Chi tiết đặt giữ #{selected?.id}</DialogTitle>
      <DialogContent>{selected && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: 1 }}>
        <Detail label="Người đặt" value={`${selected.userName || "—"} · #${selected.userId}`} />
        <Detail label="Email" value={selected.userEmail} />
        <Detail label="Sách" value={`${selected.bookTitle || "—"} · #${selected.bookId}`} />
        <Detail label="ISBN" value={selected.bookIsbn} />
        <Detail label="Trạng thái" value={statusNames[selected.status] || selected.status} />
        <Detail label="Vị trí hàng đợi" value={selected.queuePosition} />
        <Detail label="Ngày đặt" value={dateTimeLabel(selected.reservedAt)} />
        <Detail label="Sẵn sàng từ" value={dateTimeLabel(selected.availableAt)} />
        <Detail label="Hạn nhận" value={dateTimeLabel(selected.availableUntil)} />
        <Detail label="Đã giao lúc" value={dateTimeLabel(selected.fulfilledAt)} />
        <Detail label="Sách còn bản" value={selected.isBookAvailable ? "Có" : "Không"} />
        <Detail label="Ghi chú" value={selected.notes || "Không có"} />
      </Box>}</DialogContent>
      <DialogActions>
        {canAdminCancel(selected) && <Button color="error" onClick={() => openAction("cancel", selected)}>Hủy đặt giữ</Button>}
        {canAdminFulfill(selected) && <Button onClick={() => openAction("fulfill", selected)}>Xác nhận giao sách</Button>}
        <Button onClick={() => setSelected(null)}>Đóng</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={Boolean(action)} onClose={closeAction} fullWidth maxWidth="sm">
      <DialogTitle>{action?.kind === "create" ? "Tạo đặt giữ cho người dùng"
        : action?.kind === "cancel" ? `Hủy đặt giữ #${action.reservation.id}`
          : `Xác nhận giao sách · đặt giữ #${action?.reservation?.id}`}</DialogTitle>
      <DialogContent><Stack gap={2} sx={{ pt: 1 }}>
        {action?.kind === "create" && <>
          <Typography variant="body2" color="text.secondary">Dùng ID ở trang <Button component={RouterLink} to="/admin/users" size="small">Người dùng</Button> và <Button component={RouterLink} to="/admin/books" size="small">Sách</Button>. Backend chỉ nhận đặt giữ khi sách hết bản và còn hạn mức.</Typography>
          <TextField type="number" label="ID người dùng" required value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} />
          <TextField type="number" label="ID sách" required value={form.bookId} onChange={(event) => setForm({ ...form, bookId: event.target.value })} />
          <TextField label="Ghi chú (không bắt buộc)" multiline maxRows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </>}
        {action?.kind === "cancel" && <Typography>Bạn sẽ hủy lượt đặt giữ này và hàng đợi sẽ được sắp lại. Không thể khôi phục vị trí cũ.</Typography>}
        {action?.kind === "fulfill" && <>
          <Typography>Xác nhận sách đã được giao cho người đứng đầu hàng đợi. Backend sẽ tạo lượt mượn, kiểm tra gói thành viên/tồn kho và cập nhật đặt giữ trong cùng giao dịch.</Typography>
          <Alert severity="warning">Chỉ bấm sau khi đã giao sách thực tế cho người dùng. Nếu điều kiện thay đổi, backend sẽ từ chối và không báo thành công.</Alert>
        </>}
        {actionError && <Alert severity="error">{actionError}</Alert>}
      </Stack></DialogContent>
      <DialogActions><Button disabled={busy} onClick={closeAction}>Đóng</Button>
        <Button disabled={busy} variant="contained" color={action?.kind === "cancel" ? "error" : "primary"} onClick={submitAction}>{busy ? "Đang xử lý…" : "Xác nhận"}</Button>
      </DialogActions>
    </Dialog>
  </Box>;
};

export default AdminReservationsPage;
