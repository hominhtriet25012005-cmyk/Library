import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  adminLoansApi, canCheckinLoan, canRenewLoan,
} from "../../api/adminLoans";

const statusNames = {
  CHECKED_OUT: "Đang mượn", OVERDUE: "Quá hạn", RETURNED: "Đã trả",
  LOST: "Báo mất", DAMAGED: "Hư hỏng",
};
const dateLabel = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "")
  ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : "—";
const valueLabel = (value) => value ?? "—";

const Detail = ({ label, value }) => (
  <Box><Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography sx={{ overflowWrap: "anywhere" }}>{valueLabel(value)}</Typography></Box>
);

const AdminLoansPage = () => {
  const [draftMode, setDraftMode] = useState("all");
  const [draftValue, setDraftValue] = useState("");
  const [filter, setFilter] = useState({ mode: "all", value: "" });
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [operation, setOperation] = useState(null);
  const [form, setForm] = useState({ userId: "", bookId: "", checkoutDays: "", notes: "", condition: "RETURNED", extensionDays: "" });
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    adminLoansApi.search({ ...filter, page }, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (page > 0 && page >= data.totalPages) { setPage(Math.max(0, data.totalPages - 1)); return; }
        setResult(data); setLoadError("");
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError")
          setLoadError(error.message || "Không thể tải lượt mượn.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, page, reload]);

  const changeFilter = () => {
    setNotice(""); setResult(null); setLoadError(""); setLoading(true);
    setPage(0); setFilter({ mode: draftMode, value: draftValue.trim() });
  };
  const retry = () => { setLoading(true); setLoadError(""); setReload((value) => value + 1); };
  const openAction = (type, loan = null) => {
    setSelected(null); setOperation({ type, loan }); setActionError("");
    setForm({ userId: "", bookId: "", checkoutDays: "", notes: "", condition: "RETURNED", extensionDays: "" });
  };
  const closeAction = () => { if (!busy) setOperation(null); };
  const submitAction = async () => {
    if (!operation || busy) return;
    setBusy(true); setActionError(""); setNotice("");
    try {
      let updated;
      if (operation.type === "checkout") {
        updated = await adminLoansApi.checkout(form);
        setNotice(`Đã cấp sách và tạo lượt mượn #${updated.id}.`);
      } else if (operation.type === "checkin") {
        updated = await adminLoansApi.checkin(operation.loan.id, form.condition);
        setNotice(`Đã ghi nhận trả sách cho lượt mượn #${updated.id}.`);
      } else if (operation.type === "renew") {
        updated = await adminLoansApi.renew(operation.loan.id, form.extensionDays);
        setNotice(`Đã gia hạn lượt mượn #${updated.id}.`);
      } else {
        const response = await adminLoansApi.updateOverdue();
        setNotice(response.message || "Đã cập nhật các lượt mượn quá hạn.");
      }
      if (updated) setSelected(updated);
      setOperation(null); setLoading(true); setReload((value) => value + 1);
    } catch (error) {
      setActionError(error.message || "Thao tác không thành công. Vui lòng thử lại.");
    } finally { setBusy(false); }
  };

  return (
    <Box component="section" aria-label="Quản lý mượn trả" sx={{ maxWidth: 1250, mx: "auto", py: { xs: 3, sm: 4 } }}>
      <Typography variant="overline" sx={{ color: "#1769ff", fontWeight: 800 }}>ADMIN · AD4</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} sx={{ mb: 1 }}>
        <Typography component="h2" variant="h4" sx={{ color: "#172b4d", fontWeight: 800 }}>Mượn – trả</Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button variant="contained" onClick={() => openAction("checkout")}>Cấp sách</Button>
          <Button variant="outlined" onClick={() => openAction("overdue")}>Cập nhật quá hạn</Button>
        </Stack>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Tra cứu toàn hệ thống, cấp sách cho người dùng và xử lý trả/gia hạn. Hạn mức gói, tồn kho và điều kiện mượn được backend kiểm tra khi gửi thao tác.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: "#dce7f8", mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={1.5} alignItems={{ md: "center" }}>
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>Bộ lọc</InputLabel>
            <Select label="Bộ lọc" value={draftMode} onChange={(event) => { setDraftMode(event.target.value); setDraftValue(""); }}>
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="overdue">Đang quá hạn</MenuItem>
              <MenuItem value="status">Trạng thái</MenuItem>
              <MenuItem value="user">ID người dùng</MenuItem>
              <MenuItem value="book">ID sách</MenuItem>
            </Select>
          </FormControl>
          {draftMode === "status" && <FormControl size="small" sx={{ minWidth: 190, flex: 1 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select label="Trạng thái" value={draftValue} onChange={(event) => setDraftValue(event.target.value)}>
              {Object.entries(statusNames).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </Select>
          </FormControl>}
          {["user", "book"].includes(draftMode) && <TextField size="small" type="number" sx={{ flex: 1 }}
            label={draftMode === "user" ? "ID người dùng" : "ID sách"} value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)} />}
          <Button variant="outlined" onClick={changeFilter}>Tra cứu</Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          API hiện hỗ trợ từng bộ lọc một; danh sách được phân trang tại máy chủ.
        </Typography>
      </Paper>

      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
      {loadError && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={retry}>Thử lại</Button>}>{loadError}</Alert>}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: "#dce7f8" }}>
        <Table size="small" aria-label="Danh sách lượt mượn" sx={{ minWidth: 760 }}>
          <TableHead><TableRow>
            <TableCell>ID</TableCell><TableCell>Người mượn</TableCell><TableCell>Sách</TableCell>
            <TableCell>Trạng thái</TableCell><TableCell>Ngày mượn</TableCell><TableCell>Hạn trả</TableCell><TableCell align="right">Chi tiết</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={24} aria-label="Đang tải lượt mượn" /></TableCell></TableRow>}
            {!loading && !loadError && result?.content.map((loan) => <TableRow key={loan.id} hover>
              <TableCell>#{loan.id}</TableCell>
              <TableCell><Typography fontWeight={700}>{loan.userName || `Người dùng #${loan.userId}`}</Typography><Typography variant="caption" color="text.secondary">{loan.userEmail}</Typography></TableCell>
              <TableCell><Typography fontWeight={700}>{loan.bookTitle || `Sách #${loan.bookId}`}</Typography><Typography variant="caption" color="text.secondary">{loan.bookIsbn}</Typography></TableCell>
              <TableCell><Chip size="small" variant="outlined" color={loan.status === "OVERDUE" ? "error" : loan.status === "CHECKED_OUT" ? "primary" : "default"} label={statusNames[loan.status] || loan.status} /></TableCell>
              <TableCell>{dateLabel(loan.checkoutDate)}</TableCell><TableCell>{dateLabel(loan.dueDate)}</TableCell>
              <TableCell align="right"><Button size="small" onClick={() => setSelected(loan)}>Xem</Button></TableCell>
            </TableRow>)}
            {!loading && !loadError && result?.content.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>Không có lượt mượn phù hợp.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      {!loading && !loadError && result && <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={1} sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">{result.totalElements} lượt · Trang {result.totalPages ? page + 1 : 0}/{result.totalPages}</Typography>
        <Button disabled={page === 0} onClick={() => { setLoading(true); setPage(page - 1); }}>Trước</Button>
        <Button disabled={page + 1 >= result.totalPages} onClick={() => { setLoading(true); setPage(page + 1); }}>Sau</Button>
      </Stack>}

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>Chi tiết lượt mượn #{selected?.id}</DialogTitle>
        <DialogContent>{selected && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: 1 }}>
          <Detail label="Người mượn" value={`${selected.userName || "—"} · #${selected.userId}`} />
          <Detail label="Email" value={selected.userEmail} />
          <Detail label="Sách" value={`${selected.bookTitle || "—"} · #${selected.bookId}`} />
          <Detail label="ISBN" value={selected.bookIsbn} />
          <Detail label="Trạng thái" value={statusNames[selected.status] || selected.status} />
          <Detail label="Ngày mượn" value={dateLabel(selected.checkoutDate)} />
          <Detail label="Hạn trả" value={dateLabel(selected.dueDate)} />
          <Detail label="Ngày trả" value={dateLabel(selected.returnDate)} />
          <Detail label="Gia hạn" value={`${selected.renewalCount ?? 0}/${selected.maxRenewals ?? 0}`} />
          <Detail label="Số ngày quá hạn hiện lưu" value={selected.overdueDays ?? 0} />
          <Detail label="Ghi chú" value={selected.notes || "Không có"} />
        </Box>}</DialogContent>
        <DialogActions>
          {canRenewLoan(selected) && <Button onClick={() => openAction("renew", selected)}>Gia hạn</Button>}
          {canCheckinLoan(selected) && <Button onClick={() => openAction("checkin", selected)}>Trả sách</Button>}
          <Button onClick={() => setSelected(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(operation)} onClose={closeAction} fullWidth maxWidth="sm">
        <DialogTitle>{operation?.type === "checkout" ? "Cấp sách cho người dùng"
          : operation?.type === "checkin" ? `Trả sách · lượt #${operation.loan.id}`
            : operation?.type === "renew" ? `Gia hạn · lượt #${operation.loan.id}` : "Cập nhật quá hạn"}</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            {operation?.type === "checkout" && <>
              <Typography variant="body2" color="text.secondary">Cần ID từ trang <Button component={RouterLink} to="/admin/users" size="small">Người dùng</Button> và <Button component={RouterLink} to="/admin/books" size="small">Sách</Button>. Gói thành viên và tồn kho sẽ được kiểm tra khi cấp.</Typography>
              <TextField label="ID người dùng" type="number" required value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} />
              <TextField label="ID sách" type="number" required value={form.bookId} onChange={(event) => setForm({ ...form, bookId: event.target.value })} />
              <TextField label="Số ngày mượn" type="number" required value={form.checkoutDays} onChange={(event) => setForm({ ...form, checkoutDays: event.target.value })} />
              <TextField label="Ghi chú (không bắt buộc)" multiline maxRows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </>}
            {operation?.type === "checkin" && <>
              <Typography variant="body2">Ghi nhận sách đã được trả. Chọn tình trạng thực tế của sách.</Typography>
              <FormControl fullWidth><InputLabel>Tình trạng trả</InputLabel><Select label="Tình trạng trả" value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })}>
                <MenuItem value="RETURNED">Bình thường</MenuItem><MenuItem value="LOST">Bị mất</MenuItem><MenuItem value="DAMAGED">Hư hỏng</MenuItem>
              </Select></FormControl>
              <Alert severity="info">Thao tác này không tự tạo tiền phạt. Tiền phạt sẽ xử lý ở AD7.</Alert>
              {form.condition === "DAMAGED" && <Alert severity="warning">Backend hiện cộng lại bản hư hỏng vào số bản sẵn. Chỉ xác nhận sau khi đã kiểm tra tình trạng thực tế và tồn kho.</Alert>}
            </>}
            {operation?.type === "renew" && <>
              <Typography variant="body2">Gia hạn theo số ngày nhập thêm vào hạn trả hiện tại. Backend sẽ kiểm tra điều kiện gia hạn.</Typography>
              <TextField label="Số ngày gia hạn" type="number" required value={form.extensionDays} onChange={(event) => setForm({ ...form, extensionDays: event.target.value })} />
            </>}
            {operation?.type === "overdue" && <>
              <Typography variant="body2">Hệ thống sẽ đánh dấu các lượt chưa trả đã qua hạn và cập nhật số ngày quá hạn. Không tự tạo tiền phạt.</Typography>
              <Alert severity="warning">Chỉ thực hiện khi bạn muốn cập nhật trạng thái quá hạn hiện tại.</Alert>
            </>}
            {actionError && <Alert severity="error">{actionError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions><Button disabled={busy} onClick={closeAction}>Hủy</Button>
          <Button variant="contained" disabled={busy} onClick={submitAction}>{busy ? "Đang xử lý…" : "Xác nhận"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminLoansPage;
