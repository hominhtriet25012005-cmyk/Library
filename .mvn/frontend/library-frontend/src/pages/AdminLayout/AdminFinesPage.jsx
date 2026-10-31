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
  InputAdornment,
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
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";

import { adminFinanceApi, canWaiveFine } from "../../api/adminFinance";
import {
  PageHeader,
  StatCard,
  StatCardGrid,
  SearchFilterBar,
  StatusChip,
  TablePaginationBar,
  EmptyState,
} from "../../components/common";
import { formatCurrencyVND, formatDateTimeVN } from "../../utils/formatters";

const fineStatuses = {
  PENDING: "Chưa thanh toán",
  PARTIALLY_PAID: "Đã trả một phần",
  PAID: "Đã thanh toán",
  WAIVED: "Đã miễn",
};

const fineTypes = {
  OVERDUE: "Quá hạn",
  DAMAGE: "Hư hỏng",
  LOSS: "Mất sách",
  PROCESSING: "Phí xử lý",
};

const InfoItem = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      sx={{ color: "#64748b", fontWeight: 500, display: "block", mb: 0.25 }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        overflowWrap: "anywhere",
        fontWeight: 600,
        color: "#1e293b",
        fontSize: "0.875rem",
      }}
    >
      {value ?? "—"}
    </Typography>
  </Box>
);

const initialFilter = { userId: "", status: "ALL", type: "ALL" };
const initialForm = {
  bookLoanId: "",
  type: "OVERDUE",
  amount: "",
  reason: "",
  notes: "",
};

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
    adminFinanceApi
      .fines({ ...filter, page }, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (page > 0 && page >= data.totalPages) {
          setPage(Math.max(0, data.totalPages - 1));
          return;
        }
        setResult(data);
        setError("");
      })
      .catch((cause) => {
        if (!controller.signal.aborted && cause.name !== "AbortError")
          setError(cause.message || "Không tải được danh sách tiền phạt.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filter, page, reload]);

  const applyFilter = () => {
    setFilter({ ...draft });
    setPage(0);
    setResult(null);
    setLoading(true);
    setError("");
  };

  const handleReset = () => {
    setDraft(initialFilter);
    setFilter(initialFilter);
    setPage(0);
    setResult(null);
    setLoading(true);
    setError("");
  };

  const retry = () => {
    setLoading(true);
    setError("");
    setReload((value) => value + 1);
  };

  const openAction = (kind, fine = null) => {
    setSelected(null);
    setAction({ kind, fine });
    setActionError("");
    setForm(initialForm);
    setWaiveReason("");
  };

  const submitAction = async () => {
    if (!action || busy) return;
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      const saved =
        action.kind === "create"
          ? await adminFinanceApi.createFine(form)
          : await adminFinanceApi.waiveFine(action.fine.id, waiveReason);
      setNotice(
        action.kind === "create"
          ? `Đã tạo thành công khoản phạt #${saved.id}.`
          : `Đã miễn phần còn nợ của khoản phạt #${saved.id}.`,
      );
      setAction(null);
      setSelected(saved);
      setLoading(true);
      setReload((value) => value + 1);
    } catch (cause) {
      setActionError(cause.message || "Thao tác không thành công.");
    } finally {
      setBusy(false);
    }
  };

  const statistics = useMemo(() => {
    const list = result?.content || [];
    const pendingCount = list.filter(
      (f) => f.status === "PENDING" || f.status === "PARTIALLY_PAID",
    ).length;
    const paidCount = list.filter((f) => f.status === "PAID").length;
    const totalCollected = list.reduce(
      (sum, f) => sum + (Number(f.amountPaid) || 0),
      0,
    );
    const totalDebt = list.reduce(
      (sum, f) => sum + (Number(f.amountOutstanding) || 0),
      0,
    );

    return {
      pendingCount,
      paidCount,
      totalCollected,
      totalDebt,
    };
  }, [result]);

  return (
    <Box
      component="section"
      aria-label="Quản lý tiền phạt"
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
        title="Quản lý tiền phạt"
        subtitle="Theo dõi công nợ thư viện, quản lý các khoản phạt theo lượt mượn sách và xử lý miễn giảm"
        badge={
          result?.totalElements
            ? `${result.totalElements} khoản phạt`
            : undefined
        }
        action={{
          label: "Tạo khoản phạt",
          icon: AddRoundedIcon,
          onClick: () => openAction("create"),
        }}
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
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={retry}>
              Thử lại
            </Button>
          }
          sx={{ mb: 2.5, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Thẻ thống kê */}
      <StatCardGrid columns={{ xs: 1, sm: 2, lg: 4 }} sx={{ mb: 3 }}>
        <StatCard
          title="Chờ thanh toán (Trang)"
          value={loading ? "—" : statistics.pendingCount}
          subtitle="Khoản phạt còn nợ trên trang"
          icon={HourglassTopRoundedIcon}
          color="warning"
        />
        <StatCard
          title="Đã thanh toán (Trang)"
          value={loading ? "—" : statistics.paidCount}
          subtitle="Khoản phạt đã thu đủ"
          icon={CheckCircleOutlineRoundedIcon}
          color="success"
        />
        <StatCard
          title="Tổng đã thu (Trang)"
          value={loading ? "—" : formatCurrencyVND(statistics.totalCollected)}
          subtitle="Tiền phạt thực tế đã thu"
          icon={PaidRoundedIcon}
          color="primary"
        />
        <StatCard
          title="Tổng còn nợ (Trang)"
          value={loading ? "—" : formatCurrencyVND(statistics.totalDebt)}
          subtitle="Tiền phạt chưa thanh toán"
          icon={ReportProblemRoundedIcon}
          color="error"
        />
      </StatCardGrid>

      {/* Thanh tìm kiếm & bộ lọc */}
      <SearchFilterBar
        searchValue={draft.userId}
        onSearchChange={(v) => setDraft((prev) => ({ ...prev, userId: v }))}
        onSearchSubmit={applyFilter}
        onReset={handleReset}
        searchPlaceholder="Nhập ID người dùng cần tra cứu..."
        searchLabel="ID người dùng"
        submitLabel="Tra cứu"
        filters={
          <>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="fine-status-filter-label">Trạng thái</InputLabel>
              <Select
                labelId="fine-status-filter-label"
                label="Trạng thái"
                value={draft.status}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, status: e.target.value }))
                }
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                {Object.entries(fineStatuses).map(([key, val]) => (
                  <MenuItem key={key} value={key}>
                    {val}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="fine-type-filter-label">Loại vi phạm</InputLabel>
              <Select
                labelId="fine-type-filter-label"
                label="Loại vi phạm"
                value={draft.type}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, type: e.target.value }))
                }
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="ALL">Tất cả loại</MenuItem>
                {Object.entries(fineTypes).map(([key, val]) => (
                  <MenuItem key={key} value={key}>
                    {val}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        }
      />

      {/* Bảng dữ liệu */}
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
                sx={{ fontWeight: 700, minWidth: 180, color: "#1e293b" }}
              >
                Độc giả
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 200, color: "#1e293b" }}
              >
                Sách / Lượt mượn
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 120, color: "#1e293b" }}
              >
                Loại phạt
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, minWidth: 160, color: "#1e293b" }}
              >
                Tổng phạt / Còn nợ
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, minWidth: 140, color: "#1e293b" }}
              >
                Trạng thái
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: 100, color: "#1e293b" }}
              >
                Chi tiết
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
                    Đang tải danh sách khoản phạt...
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && result?.content?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ p: 0 }}>
                  <EmptyState
                    title="Không có khoản phạt nào"
                    description="Không tìm thấy bản ghi khoản phạt nào khớp với điều kiện tra cứu."
                  />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !error &&
              result?.content?.map((fine) => (
                <TableRow
                  key={fine.id}
                  hover
                  sx={{
                    "&:hover": { bgcolor: "#f8fafc" },
                    "& td": { borderColor: "#f1f5f9" },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: "#64748b" }}>
                    #{fine.id}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "#1e293b" }}
                    >
                      {fine.userName || `#${fine.userId}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", display: "block" }}
                    >
                      {fine.userEmail || `ID: ${fine.userId}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#1e293b" }}
                    >
                      {fine.bookTitle || `Lượt mượn #${fine.bookLoanId}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", display: "block" }}
                    >
                      Mã mượn: #{fine.bookLoanId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: "#334155" }}
                    >
                      {fineTypes[fine.type] || fine.type}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "#1e293b" }}
                    >
                      {formatCurrencyVND(fine.amount)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontWeight: 600,
                        color:
                          fine.amountOutstanding > 0
                            ? "error.main"
                            : "success.main",
                      }}
                    >
                      {fine.amountOutstanding > 0
                        ? `Còn nợ: ${formatCurrencyVND(fine.amountOutstanding)}`
                        : "Đã xong"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <StatusChip type="fine" status={fine.status} />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xem chi tiết khoản phạt">
                      <IconButton
                        size="small"
                        aria-label={`Xem chi tiết khoản phạt #${fine.id}`}
                        onClick={() => setSelected(fine)}
                        sx={{
                          color: "#1769ff",
                          bgcolor: "rgba(23,105,255,0.06)",
                          "&:hover": { bgcolor: "rgba(23,105,255,0.12)" },
                        }}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
        pageSize={20}
        loading={loading}
        onPageChange={(nextPage) => {
          setLoading(true);
          setPage(nextPage);
        }}
        itemLabel="khoản phạt"
      />

      {/* Dialog xem chi tiết khoản phạt */}
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
              Khoản phạt #{selected?.id}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Chi tiết công nợ và lịch sử thanh toán
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setSelected(null)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selected && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <InfoItem
                label="Độc giả"
                value={`${selected.userName || "—"} (ID: #${selected.userId})`}
              />
              <InfoItem label="Email liên hệ" value={selected.userEmail} />
              <InfoItem label="Sách liên quan" value={selected.bookTitle} />
              <InfoItem
                label="Mã lượt mượn"
                value={`#${selected.bookLoanId}`}
              />
              <InfoItem
                label="Loại vi phạm"
                value={fineTypes[selected.type] || selected.type}
              />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#64748b",
                    fontWeight: 500,
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  Trạng thái
                </Typography>
                <StatusChip type="fine" status={selected.status} />
              </Box>
              <InfoItem
                label="Tổng số tiền phạt"
                value={formatCurrencyVND(selected.amount)}
              />
              <InfoItem
                label="Đã thanh toán"
                value={formatCurrencyVND(selected.amountPaid)}
              />
              <InfoItem
                label="Số tiền còn nợ"
                value={formatCurrencyVND(selected.amountOutstanding)}
              />
              <InfoItem
                label="Ngày lập khoản phạt"
                value={formatDateTimeVN(selected.createdAt)}
              />
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <InfoItem
                  label="Lý do xử phạt"
                  value={selected.reason || "—"}
                />
              </Box>
              {selected.notes && (
                <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                  <InfoItem label="Ghi chú thêm" value={selected.notes} />
                </Box>
              )}
              {selected.waivedAt && (
                <>
                  <InfoItem
                    label="Thời điểm miễn phạt"
                    value={formatDateTimeVN(selected.waivedAt)}
                  />
                  <InfoItem
                    label="Cán bộ miễn"
                    value={selected.waivedByUserName || "—"}
                  />
                  <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                    <InfoItem
                      label="Lý do miễn nợ"
                      value={selected.waiverReason || "—"}
                    />
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {canWaiveFine(selected) && (
            <Button
              variant="outlined"
              color="warning"
              onClick={() => openAction("waive", selected)}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Miễn phần còn nợ
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

      {/* Dialog Tạo mới / Miễn tiền phạt */}
      <Dialog
        open={Boolean(action)}
        onClose={busy ? undefined : () => setAction(null)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3.5,
              p: 0.5,
              boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.15)",
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#102d62" }}>
            {action?.kind === "create"
              ? "Tạo khoản phạt mới"
              : `Miễn khoản phạt #${action?.fine?.id}`}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setAction(null)}
            disabled={busy}
            sx={{
              color: "#94a3b8",
              "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {action?.kind === "create" ? (
              <>
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: 2,
                    fontSize: "0.875rem",
                    alignItems: "center",
                  }}
                >
                  Độc giả phải nộp phạt sẽ được tự động trích xuất từ ID lượt
                  mượn sách tương ứng.
                </Alert>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Mã lượt mượn (Book Loan ID)"
                    type="number"
                    placeholder="VD: 102"
                    required
                    value={form.bookLoanId}
                    onChange={(event) =>
                      setForm({ ...form, bookLoanId: event.target.value })
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                    }}
                  />
                  <FormControl required fullWidth>
                    <InputLabel id="fine-type-label">Loại vi phạm</InputLabel>
                    <Select
                      labelId="fine-type-label"
                      label="Loại vi phạm"
                      value={form.type}
                      onChange={(event) =>
                        setForm({ ...form, type: event.target.value })
                      }
                      sx={{ borderRadius: "10px" }}
                    >
                      {Object.entries(fineTypes).map(([key, value]) => (
                        <MenuItem key={key} value={key}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <TextField
                  label="Số tiền phạt"
                  type="number"
                  placeholder="Nhập số tiền VNĐ..."
                  required
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: event.target.value })
                  }
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">₫</InputAdornment>
                      ),
                      inputProps: { min: 1, step: 1000 },
                    },
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Lý do xử phạt"
                    placeholder="VD: Trả trễ 5 ngày, làm hỏng gáy sách..."
                    multiline
                    minRows={2}
                    value={form.reason}
                    onChange={(event) =>
                      setForm({ ...form, reason: event.target.value })
                    }
                    slotProps={{ htmlInput: { maxLength: 500 } }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                    }}
                  />
                  <TextField
                    label="Ghi chú nội bộ"
                    placeholder="Ghi chú thêm nếu cần..."
                    multiline
                    minRows={2}
                    value={form.notes}
                    onChange={(event) =>
                      setForm({ ...form, notes: event.target.value })
                    }
                    slotProps={{ htmlInput: { maxLength: 1000 } }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                    }}
                  />
                </Box>
              </>
            ) : (
              <>
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  Chỉ miễn phần còn nợ (
                  {formatCurrencyVND(action?.fine?.amountOutstanding)}). Số tiền
                  đã thanh toán trước đó sẽ không tự động hoàn. Thao tác miễn
                  giảm không thể hoàn tác.
                </Alert>
                <TextField
                  label="Lý do miễn phạt"
                  required
                  multiline
                  minRows={3}
                  placeholder="Nhập lý do miễn giảm nợ cho độc giả..."
                  value={waiveReason}
                  onChange={(event) => setWaiveReason(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 500 } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </>
            )}

            {actionError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {actionError}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #f1f5f9",
            gap: 1,
          }}
        >
          <Button
            disabled={busy}
            onClick={() => setAction(null)}
            sx={{
              color: "#64748b",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "10px",
              px: 2.5,
              "&:hover": { bgcolor: "#f1f5f9" },
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            disabled={busy}
            variant="contained"
            color={action?.kind === "waive" ? "warning" : "primary"}
            onClick={submitAction}
            sx={{
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "10px",
              px: 3,
              height: 40,
            }}
          >
            {busy ? "Đang xử lý…" : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFinesPage;
