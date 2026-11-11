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
      sx={{
        color: "text.secondary",
        fontWeight: 500,
        display: "block",
        mb: 0.25,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        overflowWrap: "anywhere",
        fontWeight: 600,
        color: "text.primary",
        fontSize: "0.875rem",
      }}
    >
      {value ?? "—"}
    </Typography>
  </Box>
);

const initialFilter = { userId: "", status: "ALL", type: "ALL" };

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

  const openAction = (fine) => {
    setSelected(null);
    setAction({ fine });
    setActionError("");
    setWaiveReason("");
  };

  const submitAction = async () => {
    if (!action || busy) return;
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      const saved = await adminFinanceApi.waiveFine(action.fine.id, waiveReason);
      setNotice(`Đã miễn phần còn nợ của khoản phạt #${saved.id}.`);
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
          title="Chờ thanh toán "
          value={loading ? "—" : statistics.pendingCount}
          icon={HourglassTopRoundedIcon}
          color="warning"
        />
        <StatCard
          title="Đã thanh toán "
          value={loading ? "—" : statistics.paidCount}
          icon={CheckCircleOutlineRoundedIcon}
          color="success"
        />
        <StatCard
          title="Tổng đã thu "
          value={loading ? "—" : formatCurrencyVND(statistics.totalCollected)}
          icon={PaidRoundedIcon}
          color="primary"
        />
        <StatCard
          title="Tổng còn nợ "
          value={loading ? "—" : formatCurrencyVND(statistics.totalDebt)}
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
          bgcolor: "background.paper",
          borderColor: "divider",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}
      >
        <Table sx={{ minWidth: 850 }}>
          <TableHead
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "action.hover" : "#f8fafc",
            }}
          >
            <TableRow>
              <TableCell
                sx={{ fontWeight: 700, width: 80, color: "text.primary" }}
              >
                Mã
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 180, color: "text.primary" }}
              >
                Độc giả
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 200, color: "text.primary" }}
              >
                Sách / Lượt mượn
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 120, color: "text.primary" }}
              >
                Loại phạt
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, minWidth: 160, color: "text.primary" }}
              >
                Tổng phạt / Còn nợ
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, minWidth: 140, color: "text.primary" }}
              >
                Trạng thái
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: 100, color: "text.primary" }}
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
                    "&:hover": { bgcolor: "action.hover" },
                    "& td": { borderColor: "divider" },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                    #{fine.id}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "text.primary" }}
                    >
                      {fine.userName || `#${fine.userId}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block" }}
                    >
                      {fine.userEmail || `ID: ${fine.userId}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "text.primary" }}
                    >
                      {fine.bookTitle || `Lượt mượn #${fine.bookLoanId}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block" }}
                    >
                      Mã mượn: #{fine.bookLoanId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: "text.primary" }}
                    >
                      {fineTypes[fine.type] || fine.type}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "text.primary" }}
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
                          color: "primary.main",
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(59,130,246,0.15)"
                              : "rgba(23,105,255,0.06)",
                          "&:hover": {
                            bgcolor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "rgba(59,130,246,0.25)"
                                : "rgba(23,105,255,0.12)",
                          },
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
            <Typography
              variant="h6"
              fontWeight={750}
              sx={{ color: "text.primary" }}
            >
              Khoản phạt #{selected?.id}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
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
                    color: "text.secondary",
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
              onClick={() => openAction(selected)}
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

      {/* Dialog miễn khoản phạt */}
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
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Miễn khoản phạt #{action?.fine?.id}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setAction(null)}
            disabled={busy}
            sx={{
              color: "text.secondary",
              "&:hover": { bgcolor: "action.hover", color: "text.primary" },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Chỉ miễn phần còn nợ (
              {formatCurrencyVND(action?.fine?.amountOutstanding)}). Số tiền đã
              thanh toán trước đó sẽ không tự động hoàn. Thao tác miễn giảm
              không thể hoàn tác.
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
            borderTop: 1,
            borderColor: "divider",
            gap: 1,
          }}
        >
          <Button
            disabled={busy}
            onClick={() => setAction(null)}
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "10px",
              px: 2.5,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            disabled={busy}
            variant="contained"
            color="warning"
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
