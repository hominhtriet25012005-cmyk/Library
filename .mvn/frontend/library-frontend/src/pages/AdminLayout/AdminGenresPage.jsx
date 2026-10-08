import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { adminCatalogApi } from "../../api/adminCatalog";

const blank = { code: "", name: "", description: "", displayOrder: 0, parentGenreId: "", active: true };

const orderedGenres = (genres) => {
  const byParent = new Map();
  genres.forEach((genre) => {
    const siblings = byParent.get(genre.parentGenreId ?? null) ?? [];
    siblings.push(genre);
    byParent.set(genre.parentGenreId ?? null, siblings);
  });
  for (const siblings of byParent.values()) siblings.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name, "vi"));
  const output = []; const visited = new Set();
  const visit = (genre, depth) => {
    if (visited.has(genre.id)) return;
    visited.add(genre.id); output.push({ ...genre, depth });
    (byParent.get(genre.id) ?? []).forEach((child) => visit(child, depth + 1));
  };
  (byParent.get(null) ?? []).forEach((genre) => visit(genre, 0));
  genres.forEach((genre) => visit(genre, 0));
  return output;
};

const GenreForm = ({ open, original, genres, onClose, onSaved }) => {
  const [form, setForm] = useState(() => original ? { ...blank, ...original,
    parentGenreId: original.parentGenreId ?? "" } : blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const excluded = useMemo(() => {
    if (!original) return new Set();
    const descendants = new Set([original.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const genre of genres) {
        if (descendants.has(genre.parentGenreId) && !descendants.has(genre.id)) { descendants.add(genre.id); changed = true; }
      }
    }
    return descendants;
  }, [genres, original]);
  const change = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }));
  const save = async () => {
    setError("");
    if (!form.code.trim() || !form.name.trim()) { setError("Mã và tên thể loại là bắt buộc."); return; }
    if (!Number.isInteger(Number(form.displayOrder)) || Number(form.displayOrder) < 0) { setError("Thứ tự phải là số nguyên không âm."); return; }
    const payload = { ...form, parentGenreId: form.parentGenreId || null, displayOrder: Number(form.displayOrder) };
    setBusy(true);
    try {
      if (original) await adminCatalogApi.updateGenre(original.id, payload);
      else await adminCatalogApi.createGenre(payload);
      onSaved();
    } catch (cause) { setError(cause.message || "Không lưu được thể loại."); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>{original ? "Sửa thể loại" : "Thêm thể loại"}</DialogTitle>
    <DialogContent><Stack gap={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Mã thể loại" required value={form.code} onChange={change("code")} inputProps={{ maxLength: 50 }} />
      <TextField label="Tên thể loại" required value={form.name} onChange={change("name")} inputProps={{ maxLength: 100 }} />
      <FormControl><InputLabel>Thể loại cha</InputLabel><Select value={form.parentGenreId} label="Thể loại cha" onChange={change("parentGenreId")}><MenuItem value="">Không có (cấp gốc)</MenuItem>{genres.filter((genre) => !excluded.has(genre.id)).map((genre) => <MenuItem key={genre.id} value={genre.id}>{genre.name}{!genre.active ? " · đã ẩn" : ""}</MenuItem>)}</Select></FormControl>
      <TextField label="Thứ tự hiển thị" type="number" value={form.displayOrder} onChange={change("displayOrder")} inputProps={{ min: 0, step: 1 }} />
      <TextField label="Mô tả" value={form.description ?? ""} onChange={change("description")} multiline minRows={3} inputProps={{ maxLength: 500 }} />
    </Stack></DialogContent>
    <DialogActions><Button onClick={onClose} disabled={busy}>Hủy</Button><Button variant="contained" onClick={save} disabled={busy}>{busy ? "Đang lưu…" : "Lưu thể loại"}</Button></DialogActions>
  </Dialog>;
};

const AdminGenresPage = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => orderedGenres(genres), [genres]);
  useEffect(() => {
    const abort = new AbortController();
    adminCatalogApi.getGenres({ signal: abort.signal })
      .then((data) => { if (!abort.signal.aborted) setGenres(data ?? []); })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message || "Không tải được thể loại."); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [reload]);
  const saved = () => { setFormOpen(false); setEditing(null); setReload((value) => value + 1); };
  const toggle = async () => {
    setBusy(true); setError("");
    try {
      if (confirm.active) await adminCatalogApi.hideGenre(confirm.id);
      else await adminCatalogApi.updateGenre(confirm.id, { ...confirm, active: true });
      setConfirm(null); setReload((value) => value + 1);
    } catch (cause) { setError(cause.message || "Không đổi được trạng thái thể loại."); }
    finally { setBusy(false); }
  };
  return <Box component="section" sx={{ maxWidth: 1100, mx: "auto", py: 4 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}><Box><Typography variant="overline" color="primary">ADMIN · AD2</Typography><Typography variant="h4" fontWeight={800}>Quản lý thể loại</Typography><Typography color="text.secondary">Sắp xếp theo cây cha–con; ẩn thể loại không xóa dữ liệu sách.</Typography></Box><Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}>Thêm thể loại</Button></Stack>
    {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => setReload((value) => value + 1)}>Thử lại</Button>}>{error}</Alert>}
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}><Table><TableHead><TableRow><TableCell>Thể loại</TableCell><TableCell>Mã</TableCell><TableCell align="right">Thứ tự</TableCell><TableCell>Trạng thái</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead><TableBody>
      {rows.map((genre) => <TableRow key={genre.id} hover><TableCell sx={{ pl: 2 + Math.min(genre.depth, 6) * 3 }}><Typography fontWeight={genre.depth ? 500 : 700}>{genre.depth ? "↳ " : ""}{genre.name}</Typography><Typography variant="caption" color="text.secondary">{genre.description}</Typography></TableCell><TableCell>{genre.code}</TableCell><TableCell align="right">{genre.displayOrder ?? 0}</TableCell><TableCell><Chip size="small" label={genre.active ? "Hiển thị" : "Đã ẩn"} color={genre.active ? "success" : "default"} /></TableCell><TableCell align="right"><Button size="small" onClick={() => { setEditing(genre); setFormOpen(true); }}>Sửa</Button><Button size="small" color={genre.active ? "warning" : "primary"} onClick={() => setConfirm(genre)}>{genre.active ? "Ẩn" : "Hiện"}</Button></TableCell></TableRow>)}
      {!loading && !rows.length && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>Chưa có thể loại.</TableCell></TableRow>}
      {loading && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>Đang tải thể loại…</TableCell></TableRow>}
    </TableBody></Table></TableContainer>
    {formOpen && <GenreForm open original={editing} genres={genres} onClose={() => setFormOpen(false)} onSaved={saved} />}
    <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)}><DialogTitle>{confirm?.active ? "Ẩn thể loại?" : "Hiện thể loại?"}</DialogTitle><DialogContent><Typography>{confirm?.active ? "Thể loại sẽ được đánh dấu ẩn; sách và quan hệ cha–con vẫn được giữ." : "Thể loại sẽ hoạt động trở lại."}</Typography></DialogContent><DialogActions><Button onClick={() => setConfirm(null)} disabled={busy}>Hủy</Button><Button variant="contained" onClick={toggle} disabled={busy}>Xác nhận</Button></DialogActions></Dialog>
  </Box>;
};

export default AdminGenresPage;
