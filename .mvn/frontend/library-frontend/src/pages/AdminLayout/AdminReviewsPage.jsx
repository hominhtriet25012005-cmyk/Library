import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { adminReviewsApi } from "../../api/adminReviews";

const emptyFilter = { userId: "", bookId: "", active: "ALL" };
const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
};

const AdminReviewsPage = () => {
  const [draft, setDraft] = useState(emptyFilter);
  const [filter, setFilter] = useState(emptyFilter);
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    adminReviewsApi.search({ ...filter, page }, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (page > 0 && page >= data.totalPages) { setPage(Math.max(0, data.totalPages - 1)); return; }
        setResult(data); setLoadError("");
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") setLoadError(error.message || "Không thể tải đánh giá.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, page, reload]);

  const search = () => { setFilter({ ...draft }); setPage(0); setResult(null); setLoadError(""); setLoading(true); };
  const retry = () => { setLoadError(""); setLoading(true); setReload((value) => value + 1); };
  const hide = async () => {
    if (!confirm || busy) return;
    setBusy(true); setActionError("");
    try {
      const updated = await adminReviewsApi.hide(confirm.id);
      setNotice(`Đã ẩn đánh giá #${updated.id}.`);
      setConfirm(null); setSelected(updated); setLoading(true); setReload((value) => value + 1);
    } catch (error) {
      setActionError(error.message || "Không thể ẩn đánh giá.");
    } finally { setBusy(false); }
  };

  return <Box component="section" aria-label="Kiểm duyệt đánh giá" sx={{ maxWidth: 1250, mx: "auto", py: { xs: 3, sm: 4 } }}>
    <Typography variant="overline" sx={{ color: "#1769ff", fontWeight: 800 }}>ADMIN · AD8</Typography>
    <Typography component="h2" variant="h4" sx={{ color: "#172b4d", fontWeight: 800, mb: 1 }}>Đánh giá sách</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Xem đánh giá đang hiển thị và đã ẩn. ADMIN chỉ có thể ẩn đánh giá; không sửa nội dung của người dùng.</Typography>

    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: "#dce7f8", mb: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} gap={1.5} alignItems={{ md: "center" }}>
        <TextField size="small" type="number" label="ID người dùng" value={draft.userId}
          onChange={(event) => setDraft({ ...draft, userId: event.target.value })} sx={{ flex: 1 }} />
        <TextField size="small" type="number" label="ID sách" value={draft.bookId}
          onChange={(event) => setDraft({ ...draft, bookId: event.target.value })} sx={{ flex: 1 }} />
        <FormControl size="small" sx={{ minWidth: 160 }}><InputLabel>Trạng thái</InputLabel>
          <Select label="Trạng thái" value={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.value })}>
            <MenuItem value="ALL">Tất cả</MenuItem><MenuItem value="true">Đang hiển thị</MenuItem><MenuItem value="false">Đã ẩn</MenuItem>
          </Select></FormControl>
        <Button variant="outlined" onClick={search}>Tra cứu</Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">Lọc và phân trang trên backend. Đánh giá đã ẩn không xuất hiện ở trang chi tiết sách USER.</Typography>
    </Paper>

    {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
    {loadError && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={retry}>Thử lại</Button>}>{loadError}</Alert>}
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: "#dce7f8" }}>
      <Table size="small" aria-label="Danh sách đánh giá" sx={{ minWidth: 800 }}>
        <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Người đánh giá</TableCell><TableCell>Sách</TableCell>
          <TableCell>Điểm</TableCell><TableCell>Trạng thái</TableCell><TableCell>Ngày tạo</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={24} aria-label="Đang tải đánh giá" /></TableCell></TableRow>}
          {!loading && !loadError && result?.content.map((entry) => <TableRow key={entry.id} hover>
            <TableCell>#{entry.id}</TableCell>
            <TableCell>{entry.userName || `Người dùng #${entry.userId}`}</TableCell>
            <TableCell>{entry.bookTitle || `Sách #${entry.bookId}`}</TableCell>
            <TableCell>{entry.rating}/5</TableCell>
            <TableCell><Chip size="small" color={entry.isActive ? "success" : "default"} variant="outlined" label={entry.isActive ? "Đang hiển thị" : "Đã ẩn"} /></TableCell>
            <TableCell>{dateLabel(entry.createdAt)}</TableCell>
            <TableCell align="right"><Stack direction="row" justifyContent="flex-end" gap={0.5}>
              <Button size="small" onClick={() => setSelected(entry)}>Xem</Button>
              {entry.isActive && <Button size="small" color="error" onClick={() => { setConfirm(entry); setActionError(""); }}>Ẩn</Button>}
            </Stack></TableCell>
          </TableRow>)}
          {!loading && !loadError && result?.content.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>Không có đánh giá phù hợp.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </TableContainer>
    {!loading && !loadError && result && <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={1} sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary">{result.totalElements} đánh giá · Trang {result.totalPages ? page + 1 : 0}/{result.totalPages}</Typography>
      <Button disabled={page === 0} onClick={() => { setLoading(true); setPage(page - 1); }}>Trước</Button>
      <Button disabled={page + 1 >= result.totalPages} onClick={() => { setLoading(true); setPage(page + 1); }}>Sau</Button>
    </Stack>}

    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
      <DialogTitle>Đánh giá #{selected?.id}</DialogTitle>
      <DialogContent>{selected && <Stack gap={1.5} sx={{ pt: 1 }}>
        <Typography><strong>Người đánh giá:</strong> {selected.userName || `#${selected.userId}`}</Typography>
        <Typography><strong>Sách:</strong> {selected.bookTitle || `#${selected.bookId}`}</Typography>
        <Typography><strong>Điểm:</strong> {selected.rating}/5 · {selected.isActive ? "Đang hiển thị" : "Đã ẩn"}</Typography>
        <Typography><strong>Tiêu đề:</strong> {selected.title || "—"}</Typography>
        <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{selected.reviewText}</Typography>
        <Typography variant="caption" color="text.secondary">Tạo: {dateLabel(selected.createdAt)} · Cập nhật: {dateLabel(selected.updatedAt)}</Typography>
      </Stack>}</DialogContent>
      <DialogActions>{selected?.isActive && <Button color="error" onClick={() => { setConfirm(selected); setSelected(null); setActionError(""); }}>Ẩn đánh giá</Button>}
        <Button onClick={() => setSelected(null)}>Đóng</Button></DialogActions>
    </Dialog>

    <Dialog open={Boolean(confirm)} onClose={() => { if (!busy) setConfirm(null); }} fullWidth maxWidth="sm">
      <DialogTitle>Ẩn đánh giá #{confirm?.id}?</DialogTitle>
      <DialogContent><Stack gap={1.5} sx={{ pt: 1 }}>
        <Typography>Đánh giá sẽ không còn hiển thị cho USER. Nội dung vẫn được giữ trong database và ADMIN vẫn tra cứu được.</Typography>
        <Alert severity="warning">AD8 V1 chưa lưu người, lý do hoặc thời điểm kiểm duyệt riêng; thao tác này không thể hoàn tác trên giao diện.</Alert>
        {actionError && <Alert severity="error">{actionError}</Alert>}
      </Stack></DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setConfirm(null)}>Đóng</Button>
        <Button disabled={busy} variant="contained" color="error" onClick={hide}>{busy ? "Đang xử lý…" : "Xác nhận ẩn"}</Button></DialogActions>
    </Dialog>
  </Box>;
};

export default AdminReviewsPage;
