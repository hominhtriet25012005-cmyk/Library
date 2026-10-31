import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import SubdirectoryArrowRightRoundedIcon from "@mui/icons-material/SubdirectoryArrowRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

import { adminCatalogApi } from "../../api/adminCatalog";
import {
  ConfirmDialog,
  PageHeader,
  SearchFilterBar,
  StatCard,
  StatCardGrid,
  StatusChip,
} from "../../components/common";

const blank = {
  code: "",
  name: "",
  description: "",
  displayOrder: 0,
  parentGenreId: "",
  active: true,
};

const genreCodePattern = /^[A-Z_]{2,50}$/;

const orderedGenres = (genres) => {
  const byParent = new Map();
  genres.forEach((genre) => {
    const siblings = byParent.get(genre.parentGenreId ?? null) ?? [];
    siblings.push(genre);
    byParent.set(genre.parentGenreId ?? null, siblings);
  });
  for (const siblings of byParent.values())
    siblings.sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
        a.name.localeCompare(b.name, "vi"),
    );
  const output = [];
  const visited = new Set();
  const visit = (genre, depth) => {
    if (visited.has(genre.id)) return;
    visited.add(genre.id);
    output.push({ ...genre, depth });
    (byParent.get(genre.id) ?? []).forEach((child) => visit(child, depth + 1));
  };
  (byParent.get(null) ?? []).forEach((genre) => visit(genre, 0));
  genres.forEach((genre) => visit(genre, 0));
  return output;
};

const GenreForm = ({ open, original, genres, onClose, onSaved }) => {
  const [form, setForm] = useState(() =>
    original
      ? {
          ...blank,
          ...original,
          parentGenreId: original.parentGenreId ?? "",
          active: original.active ?? true,
        }
      : blank,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const excluded = useMemo(() => {
    if (!original) return new Set();
    const descendants = new Set([original.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const genre of genres) {
        if (
          descendants.has(genre.parentGenreId) &&
          !descendants.has(genre.id)
        ) {
          descendants.add(genre.id);
          changed = true;
        }
      }
    }
    return descendants;
  }, [genres, original]);

  const change = (name) => (event) =>
    setForm((current) => ({ ...current, [name]: event.target.value }));

  const save = async () => {
    setError("");
    if (!form.code.trim() || !form.name.trim()) {
      setError("Mã và tên thể loại là bắt buộc.");
      return;
    }
    if (!genreCodePattern.test(form.code.trim())) return;
    if (
      !Number.isInteger(Number(form.displayOrder)) ||
      Number(form.displayOrder) < 0
    ) {
      setError("Thứ tự phải là số nguyên không âm.");
      return;
    }
    const payload = {
      ...form,
      code: form.code.trim(),
      parentGenreId: form.parentGenreId || null,
      displayOrder: Number(form.displayOrder),
      active: Boolean(form.active),
    };
    setBusy(true);
    try {
      if (original) await adminCatalogApi.updateGenre(original.id, payload);
      else await adminCatalogApi.createGenre(payload);
      onSaved();
    } catch (cause) {
      setError(cause.message || "Không lưu được thể loại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3.5,
            p: 0.5,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          pt: 2.5,
          px: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 750, color: "#0f172a" }}>
          {original ? "Sửa thông tin thể loại" : "Thêm thể loại mới"}
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={busy}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1.3fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Mã thể loại"
              placeholder="VD: CNTT, KINH_TE"
              required
              value={form.code}
              onChange={change("code")}
              error={
                Boolean(form.code.trim()) &&
                !genreCodePattern.test(form.code.trim())
              }
              helperText="Chỉ dùng chữ in hoa không dấu A–Z và dấu gạch dưới (_), từ 2–50 ký tự."
              slotProps={{ htmlInput: { maxLength: 50 } }}
            />
            <TextField
              label="Tên thể loại"
              placeholder="VD: Công nghệ thông tin"
              required
              value={form.name}
              onChange={change("name")}
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1.5fr 1fr" },
              gap: 2,
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="parent-genre-label">Thể loại cha</InputLabel>
              <Select
                labelId="parent-genre-label"
                value={form.parentGenreId}
                label="Thể loại cha"
                onChange={change("parentGenreId")}
              >
                <MenuItem value="">
                  <em>Không có (cấp gốc)</em>
                </MenuItem>
                {genres
                  .filter((genre) => !excluded.has(genre.id))
                  .map((genre) => (
                    <MenuItem key={genre.id} value={genre.id}>
                      {genre.name} {!genre.active ? " · (đã ẩn)" : ""}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              label="Thứ tự hiển thị"
              type="number"
              value={form.displayOrder}
              onChange={change("displayOrder")}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
            />
          </Box>

          <TextField
            label="Mô tả"
            placeholder="Nhập mô tả tóm tắt về loại sách này..."
            value={form.description ?? ""}
            onChange={change("description")}
            multiline
            minRows={3}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />

          {/* Công tắc bật/tắt: Đang hoạt động */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              borderRadius: 2.5,
              bgcolor: form.active ? "#f0fdf4" : "#f8fafc",
              border: `1px solid ${form.active ? "#bbf7d0" : "#e2e8f0"}`,
              transition: "all 0.2s ease",
            }}
          >
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: form.active ? "#166534" : "#334155",
                }}
              >
                {form.active ? "Đang hoạt động" : "Tạm ngưng / Đã ẩn"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: form.active ? "#15803d" : "#64748b" }}
              >
                {form.active
                  ? "Thể loại được hiển thị công khai và xuất hiện trong bộ lọc sách của độc giả."
                  : "Thể loại tạm ẩn khỏi bộ lọc sách của người đọc."}
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(form.active)}
                  onChange={(e) =>
                    setForm((curr) => ({ ...curr, active: e.target.checked }))
                  }
                  color="success"
                />
              }
              label=""
              sx={{ m: 0 }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9", gap: 1 }}
      >
        <Button onClick={onClose} disabled={busy} sx={{ color: "#64748b" }}>
          Hủy
        </Button>
        <Button variant="contained" onClick={save} disabled={busy}>
          {busy ? "Đang lưu…" : original ? "Lưu thay đổi" : "Lưu thể loại"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AdminGenresPage = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [busy, setBusy] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const handleSearchSubmit = () => {
    setSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
  };

  const rows = useMemo(() => {
    const ordered = orderedGenres(genres);
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return ordered;
    return ordered.filter((genre) =>
      Boolean(
        genre.name?.toLocaleLowerCase("vi").includes(keyword) ||
        genre.code?.toLocaleLowerCase("vi").includes(keyword) ||
        genre.description?.toLocaleLowerCase("vi").includes(keyword),
      ),
    );
  }, [genres, search]);

  useEffect(() => {
    const abort = new AbortController();
    adminCatalogApi
      .getGenres({ signal: abort.signal })
      .then(async (data) => {
        if (!abort.signal.aborted) {
          const list = data ?? [];
          setGenres(list);
          setError("");

          // Bổ sung bookCount từ API đếm sách nếu bất kỳ thể loại nào chưa có
          const missing = list.filter((g) => g.bookCount == null);
          if (missing.length > 0) {
            try {
              const counts = await Promise.all(
                missing.map((g) =>
                  adminCatalogApi
                    .getBookCountByGenre(g.id, { signal: abort.signal })
                    .then((count) => ({ id: g.id, count: Number(count) }))
                    .catch(() => ({ id: g.id, count: 0 })),
                ),
              );
              if (!abort.signal.aborted) {
                const countMap = new Map(counts.map((c) => [c.id, c.count]));
                setGenres((currList) =>
                  currList.map((g) =>
                    countMap.has(g.id)
                      ? { ...g, bookCount: countMap.get(g.id) }
                      : g,
                  ),
                );
              }
            } catch {
              // Bỏ qua lỗi phụ nếu có
            }
          }
        }
      })
      .catch((cause) => {
        if (cause.name !== "AbortError") {
          setError(cause.message || "Không tải được danh sách thể loại.");
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [reload]);

  const saved = () => {
    setFormOpen(false);
    setEditing(null);
    setLoading(true);
    setReload((value) => value + 1);
  };

  const handleDeleteGenre = async () => {
    if (!deleteConfirm) return;
    setBusy(true);
    setDeleteError("");
    try {
      await adminCatalogApi.hardDeleteGenre(deleteConfirm.id);
      setDeleteConfirm(null);
      setLoading(true);
      setReload((value) => value + 1);
    } catch (cause) {
      setDeleteError(cause.message || "Không thể xóa thể loại.");
    } finally {
      setBusy(false);
    }
  };

  const genreById = new Map(genres.map((genre) => [String(genre.id), genre]));

  return (
    <Box
      component="section"
      sx={{ maxWidth: 1240, mx: "auto", py: { xs: 2.5, sm: 3.5 } }}
    >
      <PageHeader
        title="Quản lý thể loại"
        subtitle="Quản lý danh mục và cấu trúc phân cấp thể loại sách trong hệ thống."
        action={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Thêm thể loại
          </Button>
        }
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setLoading(true);
                setReload((value) => value + 1);
              }}
            >
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Thẻ thống kê */}
      <StatCardGrid columns={3}>
        <StatCard
          title="Thể loại gốc"
          value={genres.filter((g) => g.parentGenreId == null).length}
          detail="Các danh mục sách cấp cao nhất"
          icon={<FolderOutlinedIcon />}
          color="#1769ff"
          loading={loading}
        />
        <StatCard
          title="Tổng thể loại"
          value={genres.length}
          detail="Bao gồm cả danh mục con và danh mục ẩn"
          icon={<CategoryRoundedIcon />}
          color="#16a34a"
          loading={loading}
        />
        <StatCard
          title="Đang hiển thị"
          value={genres.filter((g) => g.active).length}
          detail="Xuất hiện trong bộ lọc của độc giả"
          icon={<VisibilityOutlinedIcon />}
          color="#0284c7"
          loading={loading}
        />
      </StatCardGrid>

      {/* Thanh tìm kiếm và bộ lọc */}
      <SearchFilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        showSearchButton={false}
        searchPlaceholder="Tìm tên, mã thể loại..."
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="contained"
              size="small"
              onClick={handleSearchSubmit}
              sx={{
                height: 40,
                px: 2.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
              }}
            >
              Tìm
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RestartAltRoundedIcon fontSize="small" />}
              onClick={handleResetFilters}
              sx={{
                height: 40,
                px: 2,
                borderRadius: 2,
                textTransform: "none",
                color: "#64748b",
                borderColor: "#cbd5e1",
                "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </Stack>
        }
      />

      {/* Bảng dữ liệu thể loại */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 3, borderColor: "#e2e8f0" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tên thể loại</TableCell>
              <TableCell sx={{ width: 140 }}>Mã</TableCell>
              <TableCell sx={{ width: "28%" }}>Mô tả</TableCell>
              <TableCell align="center">Thể loại cha</TableCell>
              <TableCell align="center">Số sách</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center" sx={{ width: 100 }}>
                Thao tác
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((genre) => (
                <TableRow key={genre.id} hover>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        pl: genre.depth ? genre.depth * 2.5 : 0,
                      }}
                    >
                      {genre.depth > 0 && (
                        <SubdirectoryArrowRightRoundedIcon
                          sx={{ fontSize: 18, color: "#94a3b8" }}
                        />
                      )}
                      <Typography
                        fontWeight={genre.depth === 0 ? 700 : 500}
                        color={genre.active ? "#0f172a" : "text.secondary"}
                        sx={{ fontSize: "0.875rem" }}
                      >
                        {genre.name}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell
                    sx={{ fontFamily: "monospace", fontSize: "0.8125rem" }}
                  >
                    {genre.code}
                  </TableCell>

                  <TableCell
                    sx={{ color: "text.secondary", fontSize: "0.8125rem" }}
                  >
                    {genre.description || "—"}
                  </TableCell>

                  <TableCell align="center">
                    {genre.parentGenreId
                      ? genreById.get(String(genre.parentGenreId))?.name ||
                        `#${genre.parentGenreId}`
                      : "—"}
                  </TableCell>

                  <TableCell align="center">
                    <Typography
                      fontWeight={700}
                      sx={{
                        color:
                          (genre.bookCount ?? 0) > 0
                            ? "primary.main"
                            : "text.secondary",
                      }}
                    >
                      {genre.bookCount ?? 0}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <StatusChip status={genre.active} type="active" />
                  </TableCell>

                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="center"
                    >
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setEditing(genre);
                            setFormOpen(true);
                          }}
                          disabled={busy}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Xóa thể loại">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setDeleteError("");
                            setDeleteConfirm(genre);
                          }}
                          disabled={busy}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 6, color: "text.secondary" }}
                >
                  Không tìm thấy thể loại phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Form Thêm/Sửa */}
      {formOpen && (
        <GenreForm
          open
          original={editing}
          genres={genres}
          onClose={() => setFormOpen(false)}
          onSaved={saved}
        />
      )}

      {/* Modal Xác nhận Xóa thể loại */}
      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Xác nhận xóa thể loại?"
        content={
          deleteConfirm?.bookCount > 0
            ? `Thể loại "${deleteConfirm?.name}" hiện đang có ${deleteConfirm.bookCount} cuốn sách liên kết. Bạn cần xóa hoặc chuyển thể loại cho các cuốn sách này trước khi xóa thể loại.`
            : `Thể loại "${deleteConfirm?.name}" sẽ bị xóa vĩnh viễn khỏi hệ thống nếu không còn sách hoặc thể loại con liên kết.`
        }
        error={deleteError}
        confirmText="Xóa thể loại"
        variant="danger"
        loading={busy}
        onConfirm={handleDeleteGenre}
        onClose={() => setDeleteConfirm(null)}
      />
    </Box>
  );
};

export default AdminGenresPage;
