import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import QueueRoundedIcon from "@mui/icons-material/QueueRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import {
  adminReservationsApi,
  canAdminCancel,
  canAdminFulfill,
} from "../../api/adminReservations";
import {
  ConfirmDialog,
  PageHeader,
  SearchFilterBar,
  StatusChip,
  TablePaginationBar,
} from "../../components/common";
import { formatDateTimeVN } from "../../utils/formatters";

const statusNames = {
  PENDING: "Đang chờ",
  AVAILABLE: "Sẵn sàng nhận",
  FULFILLED: "Đã giao sách",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const emptyFilter = {
  userId: "",
  bookId: "",
  status: "ALL",
  activeOnly: false,
  sortDirection: "DESC",
};

const Detail = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ fontWeight: 600 }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        overflowWrap: "anywhere",
        fontWeight: 500,
        color: "#0f172a",
        mt: 0.25,
      }}
    >
      {value ?? "—"}
    </Typography>
  </Box>
);

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
    adminReservationsApi
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
          setLoadError(error.message || "Không thể tải danh sách đặt giữ.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filter, page, reload]);

  const applyFilter = (next) => {
    setDraft(next);
    setFilter(next);
    setPage(0);
    setResult(null);
    setLoading(true);
    setLoadError("");
    setNotice("");
  };

  const showQueue = (bookId) =>
    applyFilter({
      userId: "",
      bookId: String(bookId),
      status: "ALL",
      activeOnly: true,
      sortDirection: "ASC",
    });

  const retry = () => {
    setLoading(true);
    setLoadError("");
    setReload((value) => value + 1);
  };

  const openAction = (kind, reservation = null) => {
    setSelected(null);
    setAction({ kind, reservation });
    setActionError("");
    setForm({ userId: "", bookId: "", notes: "" });
  };

  const closeAction = () => {
    if (!busy) setAction(null);
  };

  const submitAction = async () => {
    if (!action || busy) return;
    setBusy(true);
    setActionError("");
    setNotice("");
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
        setNotice(`Đã xác nhận giao sách cho đặt giữ #${updated.id}.`);
      }
      setSelected(updated);
      setAction(null);
      setLoading(true);
      setReload((value) => value + 1);
    } catch (error) {
      setActionError(
        error.message || "Thao tác không thành công. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      component="section"
      sx={{ maxWidth: 1240, mx: "auto", py: { xs: 2.5, sm: 3.5 } }}
    >
      <PageHeader
        title="Quản lý đặt giữ sách"
        subtitle="Theo dõi hàng đợi đặt giữ, tiếp nhận yêu cầu tại quầy, hủy hoặc xác nhận giao sách cho độc giả."
        action={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => openAction("create")}
          >
            Tạo đặt giữ
          </Button>
        }
      />

      {/* Thanh bộ lọc */}
      <SearchFilterBar
        onReset={() => applyFilter(emptyFilter)}
        actions={
          <Button
            variant="outlined"
            onClick={() => applyFilter(draft)}
            sx={{ height: 40, px: 2.5, borderRadius: 2 }}
          >
            Lọc dữ liệu
          </Button>
        }
      >
        <TextField
          size="small"
          type="number"
          label="ID người dùng"
          placeholder="Nhập User ID..."
          value={draft.userId}
          onChange={(event) =>
            setDraft({ ...draft, userId: event.target.value })
          }
          sx={{ minWidth: 140 }}
        />

        <TextField
          size="small"
          type="number"
          label="ID sách"
          placeholder="Nhập Book ID..."
          value={draft.bookId}
          onChange={(event) =>
            setDraft({ ...draft, bookId: event.target.value })
          }
          sx={{ minWidth: 140 }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            label="Trạng thái"
            value={draft.status}
            onChange={(event) =>
              setDraft({ ...draft, status: event.target.value })
            }
          >
            <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
            {Object.entries(statusNames).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              checked={draft.activeOnly}
              onChange={(event) =>
                setDraft({ ...draft, activeOnly: event.target.checked })
              }
            />
          }
          label={
            <Typography variant="body2">
              Chỉ xem hàng đợi (chờ/sẵn sàng)
            </Typography>
          }
        />
      </SearchFilterBar>

      {notice && (
        <Alert
          severity="success"
          onClose={() => setNotice("")}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {notice}
        </Alert>
      )}

      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={retry}>
              Thử lại
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      {/* Bảng danh sách đặt giữ */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 3, borderColor: "#e2e8f0" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}>Mã ĐG</TableCell>
              <TableCell>Độc giả</TableCell>
              <TableCell>Sách đặt trước</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center">Vị trí hàng đợi</TableCell>
              <TableCell>Hạn nhận sách</TableCell>
              <TableCell align="center" sx={{ width: 140 }}>
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
              (result?.content ?? []).map((res) => (
                <TableRow key={res.id} hover>
                  <TableCell
                    sx={{ fontFamily: "monospace", color: "text.secondary" }}
                  >
                    #{res.id}
                  </TableCell>

                  <TableCell>
                    <Typography
                      fontWeight={700}
                      sx={{ color: "#0f172a", fontSize: "0.875rem" }}
                    >
                      {res.userName || `Độc giả #${res.userId}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {res.userEmail || `ID: #${res.userId}`}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography
                      fontWeight={650}
                      sx={{ color: "#0f172a", fontSize: "0.875rem" }}
                    >
                      {res.bookTitle || `Sách #${res.bookId}`}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 0.25,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        ISBN: {res.bookIsbn || "—"}
                      </Typography>
                      {res.bookId && (
                        <Tooltip title="Xem hàng đợi của cuốn sách này">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => showQueue(res.bookId)}
                            sx={{ p: 0.25 }}
                          >
                            <QueueRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    <StatusChip status={res.status} type="reservation" />
                  </TableCell>

                  <TableCell align="center">
                    <Typography
                      fontWeight={700}
                      color={
                        res.queuePosition === 1
                          ? "primary.main"
                          : "text.secondary"
                      }
                    >
                      {res.queuePosition ? `#${res.queuePosition}` : "—"}
                    </Typography>
                  </TableCell>

                  <TableCell
                    sx={{ fontSize: "0.8125rem", color: "text.secondary" }}
                  >
                    {formatDateTimeVN(res.availableUntil)}
                  </TableCell>

                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="center"
                    >
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => setSelected(res)}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {canAdminFulfill(res) && (
                        <Tooltip title="Xác nhận giao sách">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => openAction("fulfill", res)}
                          >
                            <CheckCircleOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canAdminCancel(res) && (
                        <Tooltip title="Hủy đặt giữ">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openAction("cancel", res)}
                          >
                            <CancelOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}

            {!loading && !loadError && result?.content?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 6, color: "text.secondary" }}
                >
                  Không tìm thấy lượt đặt giữ phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phân trang */}
      <TablePaginationBar
        page={page}
        totalPages={result?.totalPages ?? 1}
        totalElements={result?.totalElements ?? 0}
        itemLabel="đặt giữ"
        loading={loading}
        onPageChange={(newPage) => {
          setLoading(true);
          setPage(newPage);
        }}
      />

      {/* Modal Chi tiết đặt giữ */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
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
            Chi tiết đặt giữ #{selected?.id}
          </Typography>
          <IconButton size="small" onClick={() => setSelected(null)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {selected && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
                pt: 1,
              }}
            >
              <Detail
                label="Độc giả"
                value={`${selected.userName || "—"} · #${selected.userId}`}
              />
              <Detail label="Email" value={selected.userEmail} />
              <Detail
                label="Sách"
                value={`${selected.bookTitle || "—"} · #${selected.bookId}`}
              />
              <Detail label="ISBN" value={selected.bookIsbn} />
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Trạng thái
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusChip status={selected.status} type="reservation" />
                </Box>
              </Box>
              <Detail
                label="Vị trí hàng đợi"
                value={
                  selected.queuePosition ? `#${selected.queuePosition}` : "—"
                }
              />
              <Detail
                label="Ngày tạo"
                value={formatDateTimeVN(selected.createdAt)}
              />
              <Detail
                label="Hạn nhận sách"
                value={formatDateTimeVN(selected.availableUntil)}
              />
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Detail
                  label="Ghi chú"
                  value={selected.notes || "Không có ghi chú"}
                />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9", gap: 1 }}
        >
          {canAdminFulfill(selected) && (
            <Button
              variant="contained"
              color="success"
              onClick={() => openAction("fulfill", selected)}
            >
              Xác nhận giao sách
            </Button>
          )}
          {canAdminCancel(selected) && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => openAction("cancel", selected)}
            >
              Hủy đặt giữ
            </Button>
          )}
          <Button onClick={() => setSelected(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Thao tác Tạo mới / Hủy / Giao sách */}
      <Dialog
        open={Boolean(action)}
        onClose={closeAction}
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
            {action?.kind === "create"
              ? "Tạo đặt giữ mới cho độc giả"
              : action?.kind === "cancel"
                ? `Xác nhận hủy đặt giữ · #${action?.reservation?.id}`
                : `Xác nhận giao sách · #${action?.reservation?.id}`}
          </Typography>
          <IconButton size="small" onClick={closeAction} disabled={busy}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {action?.kind === "create" && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Đặt giữ chỉ hợp lệ khi sách đã hết bản sẵn. Độc giả phải chưa
                  mượn hoặc chưa đặt giữ cuốn sách này.
                </Typography>
                <TextField
                  label="ID người dùng (User ID)"
                  type="number"
                  required
                  placeholder="VD: 2"
                  value={form.userId}
                  onChange={(event) =>
                    setForm({ ...form, userId: event.target.value })
                  }
                />
                <TextField
                  label="ID sách (Book ID)"
                  type="number"
                  required
                  placeholder="VD: 12"
                  value={form.bookId}
                  onChange={(event) =>
                    setForm({ ...form, bookId: event.target.value })
                  }
                />
                <TextField
                  label="Ghi chú (không bắt buộc)"
                  multiline
                  maxRows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                />
              </>
            )}

            {action?.kind === "cancel" && (
              <Typography variant="body2" color="text.secondary">
                Bạn có chắc chắn muốn hủy đặt giữ{" "}
                <strong>#{action?.reservation?.id}</strong> cho cuốn sách{" "}
                <strong>"{action?.reservation?.bookTitle}"</strong>? Thao tác
                này sẽ giải phóng thứ tự hàng đợi cho người tiếp theo.
              </Typography>
            )}

            {action?.kind === "fulfill" && (
              <Typography variant="body2" color="text.secondary">
                Xác nhận đã bàn giao cuốn sách{" "}
                <strong>"{action?.reservation?.bookTitle}"</strong> cho độc giả{" "}
                <strong>{action?.reservation?.userName}</strong>. Hệ thống sẽ
                chuyển đổi đặt giữ này sang lượt mượn chính thức.
              </Typography>
            )}

            {actionError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {actionError}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9", gap: 1 }}
        >
          <Button
            disabled={busy}
            onClick={closeAction}
            sx={{ color: "#64748b" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color={action?.kind === "cancel" ? "error" : "primary"}
            disabled={busy}
            onClick={submitAction}
          >
            {busy ? "Đang xử lý…" : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminReservationsPage;
