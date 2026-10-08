import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { adminCatalogApi } from "../../api/adminCatalog";

const emptyBook = {
  isbn: "", title: "", author: "", genreId: "", publisher: "", publicationDate: "",
  language: "", pages: "", description: "", totalCopies: 0, availableCopies: 0,
  price: "", coverImageUrl: "", active: true,
};

const bookPayload = (form, original) => ({
  ...form,
  genreId: Number(form.genreId),
  totalCopies: Number(form.totalCopies),
  availableCopies: original ? Number(original.availableCopies) : Number(form.totalCopies),
  pages: form.pages === "" ? null : Number(form.pages),
  price: form.price === "" ? null : Number(form.price),
  publicationDate: form.publicationDate || null,
});

const BookForm = ({ open, original, genres, onClose, onSaved }) => {
  const [form, setForm] = useState(() => original ? { ...emptyBook, ...original,
    genreId: original.genreId ?? "", publicationDate: original.publicationDate ?? "",
    pages: original.pages ?? "", price: original.price ?? "" } : emptyBook);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const change = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }));
  const save = async () => {
    setError("");
    if (!form.isbn.trim() || !form.title.trim() || !form.author.trim() || !form.genreId) {
      setError("Vui lòng nhập ISBN, tên sách, tác giả và thể loại."); return;
    }
    const total = Number(form.totalCopies);
    if (!Number.isInteger(total) || total < 0) {
      setError("Tổng số bản phải là số nguyên không âm."); return;
    }
    if (original && total < original.totalCopies - original.availableCopies) {
      setError("Tổng số bản mới không thể nhỏ hơn số bản đang không sẵn."); return;
    }
    setBusy(true);
    try {
      const payload = bookPayload(form, original);
      if (original) await adminCatalogApi.updateBook(original.id, payload);
      else await adminCatalogApi.createBook(payload);
      onSaved();
    } catch (cause) {
      setError(cause.message || "Không lưu được sách.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{original ? "Sửa sách" : "Thêm sách"}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: 1 }}>
          <TextField label="ISBN" required value={form.isbn} onChange={change("isbn")} disabled={Boolean(original)} />
          <TextField label="Tên sách" required value={form.title} onChange={change("title")} />
          <TextField label="Tác giả" required value={form.author} onChange={change("author")} />
          <FormControl required><InputLabel>Thể loại</InputLabel><Select label="Thể loại" value={form.genreId} onChange={change("genreId")}>
            {genres.filter((genre) => genre.active || genre.id === original?.genreId).map((genre) =>
              <MenuItem key={genre.id} value={genre.id}>{genre.name}{!genre.active ? " · đã ẩn" : ""}</MenuItem>)}
          </Select></FormControl>
          <TextField label="Tổng số bản" type="number" required value={form.totalCopies} onChange={change("totalCopies")} inputProps={{ min: 0, step: 1 }} />
          <TextField label="Số bản còn sẵn sau lưu" value={original ? Math.max(0, Number(form.totalCopies) - (original.totalCopies - original.availableCopies)) : form.totalCopies} disabled helperText={original ? "Ước tính; backend tính lại theo dữ liệu mới nhất khi lưu." : "Sách mới: bằng tổng số bản."} />
          <TextField label="Nhà xuất bản" value={form.publisher ?? ""} onChange={change("publisher")} />
          <TextField label="Ngày xuất bản" type="date" value={form.publicationDate} onChange={change("publicationDate")} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Ngôn ngữ" value={form.language ?? ""} onChange={change("language")} />
          <TextField label="Số trang" type="number" value={form.pages} onChange={change("pages")} inputProps={{ min: 1, step: 1 }} />
          <TextField label="Giá tham khảo (VND)" type="number" value={form.price} onChange={change("price")} inputProps={{ min: 0 }} />
          <TextField label="URL ảnh bìa" value={form.coverImageUrl ?? ""} onChange={change("coverImageUrl")} />
          <TextField label="Mô tả" value={form.description ?? ""} onChange={change("description")} multiline minRows={3} sx={{ gridColumn: { sm: "1 / -1" } }} />
        </Box>
      </DialogContent>
      <DialogActions><Button onClick={onClose} disabled={busy}>Hủy</Button><Button variant="contained" onClick={save} disabled={busy}>{busy ? "Đang lưu…" : "Lưu sách"}</Button></DialogActions>
    </Dialog>
  );
};

const AdminBooksPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("ALL");
  const [genreId, setGenreId] = useState("");
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [genres, setGenres] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    adminCatalogApi.getGenres({ signal: abort.signal }).then((data) => setGenres(data ?? []))
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); });
    return () => abort.abort();
  }, [reload]);
  useEffect(() => {
    const abort = new AbortController();
    adminCatalogApi.searchBooks({ searchTerm: searchTerm || null, genreId: genreId || null,
      active: status === "ALL" ? null : status === "ACTIVE", page, size: 10,
      sortBy: "createdAt", sortDirection: "DESC" }, { signal: abort.signal })
      .then((data) => { if (!abort.signal.aborted) setResult(data); })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [searchTerm, status, genreId, page, reload]);

  const openBook = async (id, edit) => {
    setActionError(""); setActionBusy(true);
    try {
      const book = await adminCatalogApi.getBook(id);
      if (edit) { setEditing(book); setFormOpen(true); } else setDetail(book);
    } catch (cause) { setActionError(cause.message || "Không tải được sách."); }
    finally { setActionBusy(false); }
  };
  const saved = () => { setFormOpen(false); setEditing(null); setReload((value) => value + 1); };
  const toggle = async () => {
    setActionBusy(true); setActionError("");
    try { await adminCatalogApi.setBookActive(confirm.id, !confirm.active); setConfirm(null); setReload((value) => value + 1); }
    catch (cause) { setActionError(cause.message || "Không cập nhật được trạng thái sách."); }
    finally { setActionBusy(false); }
  };

  return (
    <Box component="section" sx={{ maxWidth: 1240, mx: "auto", py: 4 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box><Typography variant="overline" color="primary">ADMIN · AD2</Typography><Typography variant="h4" fontWeight={800}>Quản lý sách</Typography><Typography color="text.secondary">Tra cứu, thêm/sửa và ẩn/hiện đầu sách. Không xóa cứng dữ liệu.</Typography></Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}>Thêm sách</Button>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={1.5}>
          <TextField label="Tìm ISBN, tên sách, tác giả" size="small" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { setPage(0); setSearchTerm(searchInput.trim()); } }} sx={{ flex: 2 }} />
          <Button startIcon={<SearchRoundedIcon />} onClick={() => { setPage(0); setSearchTerm(searchInput.trim()); }}>Tìm</Button>
          <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Trạng thái</InputLabel><Select label="Trạng thái" value={status} onChange={(event) => { setPage(0); setStatus(event.target.value); }}><MenuItem value="ALL">Tất cả</MenuItem><MenuItem value="ACTIVE">Hiển thị</MenuItem><MenuItem value="INACTIVE">Đã ẩn</MenuItem></Select></FormControl>
          <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Thể loại</InputLabel><Select label="Thể loại" value={genreId} onChange={(event) => { setPage(0); setGenreId(event.target.value); }}><MenuItem value="">Tất cả</MenuItem>{genres.map((genre) => <MenuItem key={genre.id} value={genre.id}>{genre.name}</MenuItem>)}</Select></FormControl>
        </Stack>
      </Paper>
      {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => setReload((value) => value + 1)}>Thử lại</Button>}>{error}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError("")}>{actionError}</Alert>}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}><Table size="small"><TableHead><TableRow><TableCell>Sách</TableCell><TableCell>ISBN</TableCell><TableCell>Thể loại</TableCell><TableCell align="right">Còn sẵn / Tổng</TableCell><TableCell>Trạng thái</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead><TableBody>
        {loading ? <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} sx={{ my: 3 }} /></TableCell></TableRow> : (result?.content ?? []).map((book) => <TableRow key={book.id} hover>
          <TableCell><Typography fontWeight={700}>{book.title}</Typography><Typography variant="caption" color="text.secondary">{book.author}</Typography></TableCell>
          <TableCell>{book.isbn}</TableCell><TableCell>{book.genreName}</TableCell>
          <TableCell align="right">{book.availableCopies} / {book.totalCopies}</TableCell>
          <TableCell><Chip size="small" label={book.active ? "Hiển thị" : "Đã ẩn"} color={book.active ? "success" : "default"} /></TableCell>
          <TableCell align="right"><Stack direction="row" justifyContent="flex-end" flexWrap="wrap"><Button size="small" onClick={() => openBook(book.id, false)} disabled={actionBusy}>Chi tiết</Button><Button size="small" onClick={() => openBook(book.id, true)} disabled={actionBusy}>Sửa</Button><Button size="small" color={book.active ? "warning" : "primary"} onClick={() => setConfirm(book)} disabled={actionBusy}>{book.active ? "Ẩn" : "Hiện"}</Button></Stack></TableCell>
        </TableRow>)}
        {!loading && !result?.content?.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Không có sách phù hợp.</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={1} sx={{ mt: 2 }}><Typography variant="body2">{result?.totalElements ?? 0} đầu sách · Trang {page + 1}/{Math.max(result?.totalPages ?? 1, 1)}</Typography><Button disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Trước</Button><Button disabled={loading || result?.last !== false} onClick={() => setPage(page + 1)}>Sau</Button></Stack>
      {formOpen && <BookForm open original={editing} genres={genres} onClose={() => setFormOpen(false)} onSaved={saved} />}
      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth><DialogTitle>Chi tiết sách</DialogTitle><DialogContent>{detail && <Stack gap={1}><Typography variant="h6">{detail.title}</Typography><Typography>Tác giả: {detail.author}</Typography><Typography>ISBN: {detail.isbn}</Typography><Typography>Thể loại: {detail.genreName}</Typography><Typography>Tồn kho: {detail.availableCopies} còn sẵn / {detail.totalCopies} tổng</Typography><Typography>Trạng thái: {detail.active ? "Hiển thị" : "Đã ẩn"}</Typography><Typography>{detail.description}</Typography></Stack>}</DialogContent><DialogActions><Button onClick={() => setDetail(null)}>Đóng</Button></DialogActions></Dialog>
      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)}><DialogTitle>{confirm?.active ? "Ẩn sách?" : "Hiện sách?"}</DialogTitle><DialogContent><Typography>{confirm?.active ? "Sách sẽ không còn xuất hiện trong danh mục người dùng; lịch sử và dữ liệu mượn vẫn được giữ." : "Sách sẽ xuất hiện trở lại trong danh mục người dùng."}</Typography></DialogContent><DialogActions><Button onClick={() => setConfirm(null)} disabled={actionBusy}>Hủy</Button><Button onClick={toggle} disabled={actionBusy} variant="contained">Xác nhận</Button></DialogActions></Dialog>
    </Box>
  );
};

export default AdminBooksPage;
