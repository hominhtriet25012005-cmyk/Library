import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
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
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

import { adminCatalogApi } from "../../api/adminCatalog";
import {
  bookPayload,
  validateBookForm,
  validateCoverImageFile,
} from "./bookFormRules.js";
import {
  ConfirmDialog,
  PageHeader,
  SearchFilterBar,
  StatusChip,
  TablePaginationBar,
} from "../../components/common";
import {
  formatCurrencyVND,
  formatPublicationInfo,
} from "../../utils/formatters";

const emptyBook = {
  isbn: "",
  title: "",
  author: "",
  genreId: "",
  publisher: "",
  publicationDate: "",
  publicationYear: "",
  publicationPrecision: "unknown",
  language: "",
  pages: "",
  description: "",
  totalCopies: 0,
  availableCopies: 0,
  price: "",
  coverImageUrl: "",
  active: true,
};

const BookForm = ({ open, original, genres, onClose, onSaved }) => {
  const [form, setForm] = useState(() =>
    original
      ? {
          ...emptyBook,
          ...original,
          genreId: original.genreId ?? "",
          publicationDate: original.publicationDate ?? "",
          publicationYear: original.publicationYear ?? "",
          publicationPrecision: original.publicationDate
            ? "date"
            : original.publicationYear != null
              ? "year"
              : "unknown",
          pages: original.pages ?? "",
          price: original.price ?? "",
        }
      : emptyBook,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previewCoverFailed, setPreviewCoverFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const change = (name) => (event) => {
    if (name === "coverImageUrl") {
      setPreviewCoverFailed(false);
      setUploadError("");
      setUploadSuccess("");
    }
    setForm((current) => ({ ...current, [name]: event.target.value }));
  };

  const handleCoverFileSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError("");
    setUploadSuccess("");

    const clientError = validateCoverImageFile(file);
    if (clientError) {
      setUploadError(clientError);
      return;
    }

    setUploading(true);
    try {
      const response = await adminCatalogApi.uploadBookCover(file);
      if (!response?.imageUrl) {
        throw new Error("Máy chủ không trả về URL ảnh bìa.");
      }
      setForm((current) => ({ ...current, coverImageUrl: response.imageUrl }));
      setPreviewCoverFailed(false);
      setUploadSuccess("Tải ảnh bìa lên thành công!");
    } catch (cause) {
      setUploadError(
        cause.message || "Tải ảnh bìa thất bại. Vui lòng thử lại.",
      );
    } finally {
      setUploading(false);
    }
  };

  const clearCoverImage = () => {
    setForm((current) => ({ ...current, coverImageUrl: "" }));
    setPreviewCoverFailed(false);
    setUploadError("");
    setUploadSuccess("");
  };

  const save = async (event) => {
    event.preventDefault();
    setError("");
    const validationError = validateBookForm(form, original);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    try {
      const payload = bookPayload(form, original);
      if (original) await adminCatalogApi.updateBook(original.id, payload);
      else await adminCatalogApi.createBook(payload);
      onSaved();
    } catch (cause) {
      setError(cause.message || "Không lưu được sách.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={busy || uploading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { sx: { borderRadius: 3.5, p: 0.5 } } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pt: 2.5,
          px: 3,
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 750, color: "#0f172a" }}>
          {original ? "Sửa thông tin sách" : "Thêm đầu sách mới"}
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={busy || uploading}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" id="admin-book-form" noValidate onSubmit={save}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              pt: 0.5,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ gridColumn: "1 / -1", fontWeight: 750, color: "#334155" }}
            >
              Thông tin sách
            </Typography>
            <TextField
              label="ISBN"
              required
              value={form.isbn}
              onChange={change("isbn")}
              disabled={Boolean(original)}
              placeholder="VD: 978-0-13-475759-9"
              helperText={
                original
                  ? "ISBN không thể chỉnh sửa sau khi tạo."
                  : "Tối đa 20 ký tự."
              }
              slotProps={{ htmlInput: { maxLength: 20 } }}
            />
            <TextField
              label="Tên sách"
              required
              value={form.title}
              onChange={change("title")}
              placeholder="VD: Clean Code"
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            <TextField
              label="Tác giả"
              required
              value={form.author}
              onChange={change("author")}
              placeholder="VD: Robert C. Martin"
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            <FormControl required fullWidth>
              <InputLabel id="book-form-genre-label">Thể loại</InputLabel>
              <Select
                labelId="book-form-genre-label"
                id="book-form-genre-select"
                label="Thể loại *"
                value={form.genreId}
                onChange={change("genreId")}
              >
                {genres
                  .filter(
                    (genre) => genre.active || genre.id === original?.genreId,
                  )
                  .map((genre) => (
                    <MenuItem key={genre.id} value={genre.id}>
                      {genre.name}
                      {!genre.active ? " · đã ẩn" : ""}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Divider sx={{ gridColumn: "1 / -1", my: 0.5 }} />
            <Typography
              variant="subtitle2"
              sx={{ gridColumn: "1 / -1", fontWeight: 750, color: "#334155" }}
            >
              Tồn kho và thông tin xuất bản
            </Typography>
            <TextField
              label="Tổng số bản"
              type="number"
              required
              value={form.totalCopies}
              onChange={change("totalCopies")}
              slotProps={{
                htmlInput: {
                  min: 0,
                  max: 2147483647,
                  step: 1,
                  inputMode: "numeric",
                },
              }}
            />
            <TextField
              label="Số bản còn sẵn sau lưu"
              value={
                original
                  ? Math.max(
                      0,
                      Number(form.totalCopies) -
                        (original.totalCopies - original.availableCopies),
                    )
                  : form.totalCopies
              }
              disabled
              helperText={
                original
                  ? "Ước tính; backend tính lại theo dữ liệu mới nhất khi lưu."
                  : "Sách mới: bằng tổng số bản."
              }
            />
            <TextField
              label="Nhà xuất bản"
              value={form.publisher ?? ""}
              onChange={change("publisher")}
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <FormControl fullWidth>
              <InputLabel id="book-publication-precision-label">
                Thông tin xuất bản
              </InputLabel>
              <Select
                labelId="book-publication-precision-label"
                label="Thông tin xuất bản"
                value={form.publicationPrecision}
                onChange={change("publicationPrecision")}
              >
                <MenuItem value="unknown">Chưa rõ ngày/năm</MenuItem>
                <MenuItem value="year">Chỉ biết năm</MenuItem>
                <MenuItem value="date">Biết ngày đầy đủ</MenuItem>
              </Select>
            </FormControl>
            {form.publicationPrecision === "year" ? (
              <TextField
                label="Năm xuất bản"
                type="number"
                required
                value={form.publicationYear}
                onChange={change("publicationYear")}
                placeholder="VD: 2015"
                slotProps={{
                  htmlInput: {
                    min: 1,
                    max: 9999,
                    step: 1,
                    inputMode: "numeric",
                  },
                }}
              />
            ) : form.publicationPrecision === "date" ? (
              <TextField
                label="Ngày xuất bản"
                type="date"
                required
                value={form.publicationDate}
                onChange={change("publicationDate")}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            ) : null}
            <TextField
              label="Ngôn ngữ"
              value={form.language ?? ""}
              onChange={change("language")}
              slotProps={{ htmlInput: { maxLength: 20 } }}
            />
            <TextField
              label="Số trang"
              type="number"
              value={form.pages}
              onChange={change("pages")}
              slotProps={{
                htmlInput: {
                  min: 1,
                  max: 50000,
                  step: 1,
                  inputMode: "numeric",
                },
              }}
            />
            <TextField
              label="Giá tham khảo (VND)"
              type="number"
              value={form.price}
              onChange={change("price")}
              placeholder="VD: 150000"
              slotProps={{
                htmlInput: {
                  min: 0,
                  max: 99999999.99,
                  step: 0.01,
                  inputMode: "decimal",
                },
              }}
              helperText={
                form.price &&
                !isNaN(Number(form.price)) &&
                Number(form.price) > 0
                  ? `Định dạng: ${formatCurrencyVND(form.price)} (Dùng để tính bồi thường khi mất/hỏng sách)`
                  : "Nhập số tiền nguyên (VD: 150000 = 150.000 đ) để tính bồi thường khi mất/hỏng sách."
              }
            />
            <Box
              sx={{
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                p: 2,
                borderRadius: 2.5,
                border: "1px solid #e2e8f0",
                bgcolor: "#f8fafc",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#334155" }}
                >
                  Ảnh bìa sách
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Button
                    component="label"
                    variant="contained"
                    size="small"
                    startIcon={
                      uploading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <CloudUploadRoundedIcon fontSize="small" />
                      )
                    }
                    disabled={busy || uploading}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      boxShadow: "none",
                    }}
                  >
                    {uploading ? "Đang tải ảnh lên…" : "Tải ảnh từ máy"}
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/png"
                      onChange={handleCoverFileSelect}
                    />
                  </Button>

                  {form.coverImageUrl && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={clearCoverImage}
                      disabled={busy || uploading}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Bỏ ảnh
                    </Button>
                  )}
                </Box>
              </Box>

              {uploadError && (
                <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }}>
                  {uploadError}
                </Alert>
              )}

              {uploadSuccess && (
                <Alert severity="success" sx={{ borderRadius: 2, py: 0.5 }}>
                  {uploadSuccess}
                </Alert>
              )}

              <TextField
                label="URL ảnh bìa"
                value={form.coverImageUrl ?? ""}
                onChange={change("coverImageUrl")}
                placeholder="https://... hoặc tải ảnh từ máy tính ở trên"
                disabled={busy || uploading}
                fullWidth
                size="small"
                slotProps={{ htmlInput: { maxLength: 500 } }}
                helperText="Định dạng JPEG hoặc PNG, dung lượng tối đa 5 MB. Có thể tải ảnh lên hoặc nhập/dán URL ảnh trực tiếp."
              />

              {/* Preview ảnh bìa */}
              {(form.coverImageUrl || uploading) && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 1.5,
                    bgcolor: "#ffffff",
                    borderRadius: 2,
                    border: "1px dashed #cbd5e1",
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 80,
                      borderRadius: 1.5,
                      overflow: "hidden",
                      bgcolor: "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {uploading ? (
                      <CircularProgress size={24} />
                    ) : !previewCoverFailed && form.coverImageUrl ? (
                      <img
                        src={form.coverImageUrl}
                        alt="Xem trước bìa sách"
                        onError={() => setPreviewCoverFailed(true)}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <MenuBookRoundedIcon sx={{ color: "#94a3b8" }} />
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#1e293b" }}
                    >
                      {uploading
                        ? "Đang tải ảnh bìa lên máy chủ…"
                        : previewCoverFailed
                          ? "Không thể tải ảnh từ URL này"
                          : "Ảnh bìa hiện tại"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {uploading
                        ? "Vui lòng đợi trong giây lát…"
                        : previewCoverFailed
                          ? "Kiểm tra lại đường dẫn ảnh hoặc tải lại ảnh mới"
                          : form.coverImageUrl}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <Divider sx={{ gridColumn: "1 / -1", my: 0.5 }} />
            <Typography
              variant="subtitle2"
              sx={{ gridColumn: "1 / -1", fontWeight: 750, color: "#334155" }}
            >
              Mô tả
            </Typography>
            <TextField
              label="Mô tả tóm tắt"
              value={form.description ?? ""}
              onChange={change("description")}
              multiline
              minRows={3}
              sx={{ gridColumn: { sm: "1 / -1" } }}
              placeholder="Nhập giới thiệu tóm tắt về nội dung cuốn sách..."
              slotProps={{ htmlInput: { maxLength: 2000 } }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9", gap: 1 }}
      >
        <Button
          onClick={onClose}
          disabled={busy || uploading}
          sx={{ color: "#64748b" }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          type="submit"
          form="admin-book-form"
          disabled={busy || uploading}
        >
          {busy
            ? "Đang lưu…"
            : uploading
              ? "Đang tải ảnh…"
              : original
                ? "Lưu thay đổi"
                : "Thêm sách"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AdminBooksPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [genreId, setGenreId] = useState("");
  const [bookStatus, setBookStatus] = useState("ALL");
  const [sortOption, setSortOption] = useState("NEWEST");
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [genres, setGenres] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [genreError, setGenreError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    adminCatalogApi
      .getGenres({ signal: abort.signal })
      .then((data) => {
        if (!abort.signal.aborted) {
          setGenres(data ?? []);
          setGenreError("");
        }
      })
      .catch((cause) => {
        if (!abort.signal.aborted && cause.name !== "AbortError")
          setGenreError(cause.message);
      });
    return () => abort.abort();
  }, [reload]);

  useEffect(() => {
    const abort = new AbortController();

    const sortMapping = {
      NEWEST: { sortBy: "createdAt", sortDirection: "DESC" },
      OLDEST: { sortBy: "createdAt", sortDirection: "ASC" },
      TITLE_ASC: { sortBy: "title", sortDirection: "ASC" },
      TITLE_DESC: { sortBy: "title", sortDirection: "DESC" },
      AVAILABLE_DESC: { sortBy: "availableCopies", sortDirection: "DESC" },
      TOTAL_DESC: { sortBy: "totalCopies", sortDirection: "DESC" },
    }[sortOption] || { sortBy: "createdAt", sortDirection: "DESC" };

    const statusParams =
      {
        ALL: { availableOnly: null, unavailableOnly: null, active: null },
        AVAILABLE: {
          availableOnly: true,
          unavailableOnly: false,
          active: null,
        },
        OUT_OF_STOCK: {
          availableOnly: false,
          unavailableOnly: true,
          active: null,
        },
        ACTIVE: { availableOnly: null, unavailableOnly: null, active: true },
        INACTIVE: { availableOnly: null, unavailableOnly: null, active: false },
      }[bookStatus] || {};

    adminCatalogApi
      .searchBooks(
        {
          searchTerm: searchTerm || null,
          genreId: genreId ? Number(genreId) : null,
          availableOnly: statusParams.availableOnly ?? null,
          unavailableOnly: statusParams.unavailableOnly ?? null,
          active: statusParams.active ?? null,
          page,
          size: 10,
          sortBy: sortMapping.sortBy,
          sortDirection: sortMapping.sortDirection,
        },
        { signal: abort.signal },
      )
      .then((data) => {
        if (!abort.signal.aborted) {
          setResult(data);
          setError("");
        }
      })
      .catch((cause) => {
        if (!abort.signal.aborted && cause.name !== "AbortError") {
          setResult(null);
          setError(cause.message);
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [searchTerm, genreId, bookStatus, sortOption, page, reload]);

  const openBook = async (id, edit) => {
    setActionError("");
    setActionBusy(true);
    try {
      const book = await adminCatalogApi.getBook(id);
      if (edit) {
        setEditing(book);
        setFormOpen(true);
      } else setDetail(book);
    } catch (cause) {
      setActionError(cause.message || "Không tải được sách.");
    } finally {
      setActionBusy(false);
    }
  };

  const saved = () => {
    setFormOpen(false);
    setEditing(null);
    setLoading(true);
    setReload((value) => value + 1);
  };

  const deleteBook = async () => {
    setActionBusy(true);
    setDeleteError("");
    try {
      await adminCatalogApi.hardDeleteBook(deleteConfirm.id);
      setDeleteConfirm(null);
      setLoading(true);
      setReload((value) => value + 1);
    } catch (cause) {
      setDeleteError(cause.message || "Không thể xóa sách.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleSearchSubmit = () => {
    setLoading(true);
    setError("");
    setPage(0);
    setSearchTerm(searchInput.trim());
  };

  const handleResetFilters = () => {
    setLoading(true);
    setError("");
    setSearchInput("");
    setSearchTerm("");
    setGenreId("");
    setBookStatus("ALL");
    setSortOption("NEWEST");
    setPage(0);
    setReload((value) => value + 1);
  };

  return (
    <Box
      component="section"
      sx={{ maxWidth: 1240, mx: "auto", py: { xs: 2.5, sm: 3.5 } }}
    >
      <PageHeader
        title="Quản lý sách"
        subtitle="Tra cứu danh mục, thêm mới, cập nhật thông tin và quản lý ẩn/hiện đầu sách."
        action={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Thêm sách
          </Button>
        }
      />

      {/* Thanh tìm kiếm và bộ lọc chuẩn hóa */}
      <SearchFilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        showSearchButton={false}
        searchPlaceholder="Tìm ISBN, tên sách, tác giả..."
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
      >
        {/* 1. Lọc theo thể loại */}
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 } }}>
          <InputLabel id="filter-genre-label">Thể loại</InputLabel>
          <Select
            labelId="filter-genre-label"
            label="Thể loại"
            value={genreId}
            onChange={(event) => {
              setLoading(true);
              setError("");
              setPage(0);
              setGenreId(event.target.value);
            }}
          >
            <MenuItem value="">Tất cả thể loại</MenuItem>
            {genres.map((genre) => (
              <MenuItem key={genre.id} value={genre.id}>
                {genre.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 2. Tình trạng */}
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }}>
          <InputLabel id="filter-status-label">Tình trạng</InputLabel>
          <Select
            labelId="filter-status-label"
            label="Tình trạng"
            value={bookStatus}
            onChange={(event) => {
              setLoading(true);
              setError("");
              setPage(0);
              setBookStatus(event.target.value);
            }}
          >
            <MenuItem value="ALL">Tất cả tình trạng</MenuItem>
            <MenuItem value="AVAILABLE">Còn sách sẵn</MenuItem>
            <MenuItem value="OUT_OF_STOCK">Hết sách</MenuItem>
            <MenuItem value="ACTIVE">Đang hiển thị</MenuItem>
          </Select>
        </FormControl>

        {/* 3. Sắp xếp theo */}
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 165 } }}>
          <InputLabel id="filter-sort-label">Sắp xếp theo</InputLabel>
          <Select
            labelId="filter-sort-label"
            label="Sắp xếp theo"
            value={sortOption}
            onChange={(event) => {
              setLoading(true);
              setError("");
              setPage(0);
              setSortOption(event.target.value);
            }}
          >
            <MenuItem value="NEWEST">Mới nhất</MenuItem>
            <MenuItem value="OLDEST">Cũ nhất</MenuItem>
            <MenuItem value="TITLE_ASC">Tên sách (A → Z)</MenuItem>
            <MenuItem value="TITLE_DESC">Tên sách (Z → A)</MenuItem>
            <MenuItem value="AVAILABLE_DESC">Hiện có nhiều nhất</MenuItem>
            <MenuItem value="TOTAL_DESC">Tổng số bản nhiều nhất</MenuItem>
          </Select>
        </FormControl>
      </SearchFilterBar>

      {(error || genreError) && (
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
          {[error, genreError].filter(Boolean).join(" ")}
        </Alert>
      )}

      {actionError && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setActionError("")}
        >
          {actionError}
        </Alert>
      )}

      {/* Bảng danh sách sách */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 3, borderColor: "#e2e8f0" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 64, textAlign: "center" }}>Bìa</TableCell>
              <TableCell>Thông tin sách</TableCell>
              <TableCell>ISBN</TableCell>
              <TableCell>Thể loại</TableCell>
              <TableCell align="right" sx={{ minWidth: 100 }}>
                Tổng số bản
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 90 }}>
                Hiện có
              </TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center" sx={{ width: 100 }}>
                Thao tác
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : (
              (result?.content ?? []).map((book) => (
                <TableRow key={book.id} hover>
                  {/* Bìa sách thumbnail */}
                  <TableCell align="center" sx={{ py: 1 }}>
                    <Box
                      onClick={() => openBook(book.id, false)}
                      sx={{
                        width: 40,
                        height: 56,
                        borderRadius: 1.5,
                        overflow: "hidden",
                        bgcolor: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        border: "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "transform 0.15s ease",
                        "&:hover": { transform: "scale(1.05)" },
                      }}
                    >
                      {book.coverImageUrl ? (
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <MenuBookRoundedIcon
                          sx={{ fontSize: 22, color: "#94a3b8" }}
                        />
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography
                      fontWeight={700}
                      onClick={() => openBook(book.id, false)}
                      sx={{
                        color: "#0f172a",
                        fontSize: "0.925rem",
                        cursor: "pointer",
                        "&:hover": {
                          color: "primary.main",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {book.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {book.author}{" "}
                      {book.publisher ? `· ${book.publisher}` : ""}
                    </Typography>
                  </TableCell>

                  <TableCell
                    sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                  >
                    {book.isbn}
                  </TableCell>

                  <TableCell>{book.genreName || "—"}</TableCell>

                  {/* Tách riêng: Tổng số bản */}
                  <TableCell align="right">
                    <Typography fontWeight={600} sx={{ color: "#334155" }}>
                      {book.totalCopies}
                    </Typography>
                  </TableCell>

                  {/* Tách riêng: Hiện có */}
                  <TableCell align="right">
                    <Typography
                      fontWeight={700}
                      sx={{
                        color:
                          book.availableCopies > 0
                            ? "success.main"
                            : "error.main",
                      }}
                    >
                      {book.availableCopies}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <StatusChip status={book.active} type="active" />
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
                          onClick={() => openBook(book.id, true)}
                          disabled={actionBusy}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Xóa sách">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setDeleteError("");
                            setDeleteConfirm(book);
                          }}
                          disabled={actionBusy}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}

            {!loading && !result?.content?.length && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ py: 6, color: "text.secondary" }}
                >
                  Không tìm thấy đầu sách phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Thanh phân trang chuẩn hóa */}
      <TablePaginationBar
        page={page}
        totalPages={result?.totalPages ?? 1}
        totalElements={result?.totalElements ?? 0}
        itemLabel="đầu sách"
        loading={loading}
        onPageChange={(newPage) => {
          setLoading(true);
          setPage(newPage);
        }}
      />

      {/* Modal Form Thêm / Sửa Sách */}
      {formOpen && (
        <BookForm
          open
          original={editing}
          genres={genres}
          onClose={() => setFormOpen(false)}
          onSaved={saved}
        />
      )}

      {/* Modal Chi tiết sách nâng cao */}
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3.5, p: 0.5 } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pt: 2.5,
            px: 3,
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 750, color: "#0f172a" }}>
            Chi tiết đầu sách
          </Typography>
          <IconButton size="small" onClick={() => setDetail(null)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {detail && (
            <Stack spacing={2.5}>
              <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
                <Box
                  sx={{
                    width: 90,
                    height: 126,
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {detail.coverImageUrl ? (
                    <img
                      src={detail.coverImageUrl}
                      alt={detail.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <MenuBookRoundedIcon
                      sx={{ fontSize: 40, color: "#94a3b8" }}
                    />
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}
                  >
                    {detail.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Tác giả: <strong>{detail.author}</strong>
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <StatusChip status={detail.active} type="active" />
                  </Box>
                </Box>
              </Box>

              <Divider />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                  fontSize: "0.875rem",
                }}
              >
                <Typography variant="body2">
                  <strong>ISBN:</strong> {detail.isbn}
                </Typography>
                <Typography variant="body2">
                  <strong>Thể loại:</strong> {detail.genreName || "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Tồn kho:</strong> {detail.availableCopies} còn sẵn /{" "}
                  {detail.totalCopies} tổng
                </Typography>
                <Typography variant="body2">
                  <strong>Giá tham khảo:</strong>{" "}
                  {formatCurrencyVND(detail.price)}
                </Typography>
                <Typography variant="body2">
                  <strong>Nhà xuất bản:</strong> {detail.publisher || "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Ngày/năm xuất bản:</strong>{" "}
                  {formatPublicationInfo(
                    detail.publicationDate,
                    detail.publicationYear,
                  )}
                </Typography>
                <Typography variant="body2">
                  <strong>Số trang:</strong> {detail.pages ?? "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Ngôn ngữ:</strong> {detail.language || "—"}
                </Typography>
              </Box>

              {detail.description && (
                <Box sx={{ bgcolor: "#f8fafc", p: 2, borderRadius: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "#64748b",
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    MÔ TẢ NỘI DUNG
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#334155", lineHeight: 1.6 }}
                  >
                    {detail.description}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9" }}>
          <Button onClick={() => setDetail(null)} sx={{ borderRadius: 2 }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chỉ xóa cứng khi MySQL xác nhận không còn bản ghi liên kết. */}
      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Xác nhận xóa cứng sách?"
        content={`Sách "${deleteConfirm?.title}" sẽ bị xóa vĩnh viễn nếu chưa có lượt mượn, đặt giữ, đánh giá hoặc wishlist liên kết. Nếu đã có dữ liệu liên quan, hệ thống sẽ từ chối và giữ nguyên sách.`}
        error={deleteError}
        confirmText="Xóa vĩnh viễn"
        variant="danger"
        loading={actionBusy}
        onConfirm={deleteBook}
        onClose={() => setDeleteConfirm(null)}
      />
    </Box>
  );
};

export default AdminBooksPage;
