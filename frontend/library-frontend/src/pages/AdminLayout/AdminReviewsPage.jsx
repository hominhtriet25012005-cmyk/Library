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
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Rating,
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
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";

import { adminReviewsApi } from "../../api/adminReviews";
import {
  PageHeader,
  StatCard,
  StatCardGrid,
  SearchFilterBar,
  StatusChip,
  TablePaginationBar,
  ConfirmDialog,
  EmptyState,
} from "../../components/common";
import { formatDateTimeVN } from "../../utils/formatters";

const emptyFilter = { userId: "", bookId: "", active: "ALL" };

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
    adminReviewsApi
      .search({ ...filter, page }, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (page > 0 && page >= data.totalPages) {
          setPage(Math.max(0, data.totalPages - 1));
          return;
        }
        setResult(data);
        setLoadError("");
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError")
          setLoadError(error.message || "Không thể tải danh sách đánh giá.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filter, page, reload]);

  const search = () => {
    setFilter({ ...draft });
    setPage(0);
    setResult(null);
    setLoadError("");
    setLoading(true);
  };

  const handleReset = () => {
    setDraft(emptyFilter);
    setFilter(emptyFilter);
    setPage(0);
    setResult(null);
    setLoadError("");
    setLoading(true);
  };

  const retry = () => {
    setLoadError("");
    setLoading(true);
    setReload((value) => value + 1);
  };

  const hide = async () => {
    if (!confirm || busy) return;
    setBusy(true);
    setActionError("");
    try {
      const updated = await adminReviewsApi.hide(confirm.id);
      setNotice(`Đã ẩn thành công bài đánh giá #${updated.id}.`);
      setConfirm(null);
      setSelected(updated);
      setLoading(true);
      setReload((value) => value + 1);
    } catch (error) {
      setActionError(error.message || "Không thể ẩn đánh giá này.");
    } finally {
      setBusy(false);
    }
  };

  const stats = useMemo(() => {
    const list = result?.content || [];
    const activeCount = list.filter((r) => r.isActive).length;
    const hiddenCount = list.length - activeCount;
    const avgRating =
      list.length > 0
        ? (
            list.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) /
            list.length
          ).toFixed(1)
        : "—";

    return {
      totalOnPage: list.length,
      activeCount,
      hiddenCount,
      avgRating,
    };
  }, [result]);

  return (
    <Box
      component="section"
      aria-label="Kiểm duyệt đánh giá"
      sx={{
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
        px: { xs: 2, sm: 3, md: 3.5 },
        py: { xs: 2, sm: 3 },
      }}
    >
      {/* Header */}
      <PageHeader
        title="Kiểm duyệt đánh giá"
        subtitle="Quản lý và kiểm duyệt các bài nhận xét, xếp hạng sách từ độc giả để bảo đảm tiêu chuẩn cộng đồng"
        badge={
          result?.totalElements ? `${result.totalElements} đánh giá` : undefined
        }
      />

      {/* Thông báo Alert */}
      {notice && (
        <Alert
          severity="success"
          onClose={() => setNotice("")}
          sx={{ mb: 2.5, borderRadius: 2 }}
        >
          {notice}
        </Alert>
      )}
      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={retry}>
              Thử lại
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      {/* Thẻ thống kê */}
      <StatCardGrid columns={{ xs: 1, sm: 2, lg: 4 }} sx={{ mb: 3 }}>
        <StatCard
          title="Đánh giá (Trang)"
          value={loading ? "—" : stats.totalOnPage}
          subtitle="Số nhận xét đang hiển thị"
          icon={RateReviewRoundedIcon}
          color="primary"
        />
        <StatCard
          title="Đang hiển thị"
          value={loading ? "—" : stats.activeCount}
          subtitle="Đánh giá công khai trên trang sách"
          icon={CheckCircleRoundedIcon}
          color="success"
        />
        <StatCard
          title="Đã ẩn"
          value={loading ? "—" : stats.hiddenCount}
          subtitle="Đánh giá bị kiểm duyệt ẩn đi"
          icon={BlockRoundedIcon}
          color="error"
        />
        <StatCard
          title="Điểm trung bình (Trang)"
          value={loading ? "—" : stats.avgRating}
          subtitle="Xếp hạng sao bình quân"
          icon={StarRoundedIcon}
          color="warning"
        />
      </StatCardGrid>

      {/* Thanh tìm kiếm & bộ lọc */}
      <SearchFilterBar
        searchValue={draft.userId}
        onSearchChange={(v) => setDraft((prev) => ({ ...prev, userId: v }))}
        onSearchSubmit={search}
        onReset={handleReset}
        searchPlaceholder="Nhập ID người dùng..."
        searchLabel="ID người dùng"
        submitLabel="Tra cứu"
        filters={
          <>
            <TextField
              size="small"
              type="number"
              label="ID sách"
              placeholder="Nhập ID sách..."
              value={draft.bookId}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, bookId: e.target.value }))
              }
              sx={{
                minWidth: 140,
                "& .MuiOutlinedInput-root": { borderRadius: "10px" },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="review-active-filter-label">
                Trạng thái
              </InputLabel>
              <Select
                labelId="review-active-filter-label"
                label="Trạng thái"
                value={draft.active}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, active: e.target.value }))
                }
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                <MenuItem value="true">Đang hiển thị</MenuItem>
                <MenuItem value="false">Đã ẩn</MenuItem>
              </Select>
            </FormControl>
          </>
        }
      />

      {/* Bảng danh sách đánh giá */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          overflowX: "auto",
          bgcolor: "#fff",
          borderColor: "#e2e8f0",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}
      >
        <Table sx={{ minWidth: 850 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 80, color: "#1e293b" }}>
                Mã
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 160, color: "#1e293b" }}
              >
                Người đánh giá
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 180, color: "#1e293b" }}
              >
                Sách được nhận xét
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 150, color: "#1e293b" }}
              >
                Điểm xếp hạng
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, minWidth: 130, color: "#1e293b" }}
              >
                Trạng thái
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 140, color: "#1e293b" }}
              >
                Thời gian
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: 110, color: "#1e293b" }}
              >
                Thao tác
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                  <Typography
                    variant="body2"
                    sx={{ mt: 1.5, color: "#64748b" }}
                  >
                    Đang tải danh sách đánh giá...
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && !loadError && result?.content?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ p: 0 }}>
                  <EmptyState
                    title="Không có đánh giá nào phù hợp"
                    description="Không tìm thấy nhận xét hoặc đánh giá nào khớp với điều kiện lọc."
                  />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !loadError &&
              result?.content?.map((entry) => (
                <TableRow
                  key={entry.id}
                  hover
                  sx={{
                    "&:hover": { bgcolor: "#f8fafc" },
                    "& td": { borderColor: "#f1f5f9" },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: "#64748b" }}>
                    #{entry.id}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "#1e293b" }}
                    >
                      {entry.userName || `Độc giả #${entry.userId}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", display: "block" }}
                    >
                      ID: #{entry.userId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#102d62" }}
                    >
                      {entry.bookTitle || `Sách #${entry.bookId}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", display: "block" }}
                    >
                      ID sách: #{entry.bookId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Rating
                        value={Number(entry.rating) || 0}
                        readOnly
                        size="small"
                        sx={{ color: "#f59e0b" }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "#b45309" }}
                      >
                        {entry.rating}/5
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <StatusChip
                      type="active"
                      status={entry.isActive ? "ACTIVE" : "INACTIVE"}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ color: "#475569", fontSize: "0.8125rem" }}
                    >
                      {formatDateTimeVN(entry.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="center"
                    >
                      <Tooltip title="Xem nội dung chi tiết">
                        <IconButton
                          size="small"
                          aria-label={`Xem đánh giá #${entry.id}`}
                          onClick={() => setSelected(entry)}
                          sx={{
                            color: "#1769ff",
                            bgcolor: "rgba(23,105,255,0.06)",
                            "&:hover": { bgcolor: "rgba(23,105,255,0.12)" },
                          }}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {entry.isActive && (
                        <Tooltip title="Ẩn đánh giá này">
                          <IconButton
                            size="small"
                            aria-label={`Ẩn đánh giá #${entry.id}`}
                            onClick={() => {
                              setConfirm(entry);
                              setActionError("");
                            }}
                            sx={{
                              color: "#ef4444",
                              bgcolor: "rgba(239,68,68,0.06)",
                              "&:hover": { bgcolor: "rgba(239,68,68,0.12)" },
                            }}
                          >
                            <VisibilityOffOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phân trang Server-side */}
      <TablePaginationBar
        page={page}
        totalPages={result?.totalPages || 0}
        totalElements={result?.totalElements}
        loading={loading}
        onPageChange={(nextPage) => {
          setLoading(true);
          setPage(nextPage);
        }}
        itemLabel="đánh giá"
      />

      {/* Dialog xem chi tiết bài đánh giá */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={750} sx={{ color: "#102d62" }}>
              Đánh giá #{selected?.id}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Chi tiết nhận xét từ độc giả
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setSelected(null)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5 }}>
          {selected && (
            <Stack spacing={2.5}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#f8fafc",
                  borderRadius: 2.5,
                  border: "1px solid #e2e8f0",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 750, color: "#1e293b" }}
                    >
                      {selected.userName || `Độc giả #${selected.userId}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Nhận xét cuốn:{" "}
                      <strong>
                        {selected.bookTitle || `ID: #${selected.bookId}`}
                      </strong>
                    </Typography>
                  </Box>
                  <StatusChip
                    type="active"
                    status={selected.isActive ? "ACTIVE" : "INACTIVE"}
                  />
                </Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
                >
                  <Rating
                    value={Number(selected.rating) || 0}
                    readOnly
                    size="small"
                    sx={{ color: "#f59e0b" }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "#b45309" }}
                  >
                    ({selected.rating} / 5 sao)
                  </Typography>
                </Box>
              </Box>

              {selected.title && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#64748b", fontWeight: 600, display: "block" }}
                  >
                    Tiêu đề bài viết
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "#1e293b" }}
                  >
                    {selected.title}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#64748b",
                    fontWeight: 600,
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  Nội dung nhận xét
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#fff",
                    borderColor: "#e2e8f0",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      lineHeight: 1.6,
                      color: "#334155",
                    }}
                  >
                    {selected.reviewText || "Không có nội dung mô tả chi tiết."}
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{ display: "flex", gap: 3 }}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Ngày tạo:{" "}
                  <strong>{formatDateTimeVN(selected.createdAt)}</strong>
                </Typography>
                {selected.updatedAt && (
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Cập nhật:{" "}
                    <strong>{formatDateTimeVN(selected.updatedAt)}</strong>
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {selected?.isActive && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setConfirm(selected);
                setSelected(null);
                setActionError("");
              }}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Ẩn đánh giá
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => setSelected(null)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal xác nhận ẩn bài đánh giá */}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={`Ẩn đánh giá #${confirm?.id}?`}
        message="Bài nhận xét này sẽ không còn hiển thị công khai cho độc giả trên website. Dữ liệu gốc vẫn được bảo toàn trong hệ thống quản trị."
        confirmLabel="Xác nhận ẩn"
        cancelLabel="Hủy bỏ"
        variant="danger"
        loading={busy}
        error={actionError}
        onConfirm={hide}
        onCancel={() => {
          if (!busy) setConfirm(null);
        }}
      />
    </Box>
  );
};

export default AdminReviewsPage;
