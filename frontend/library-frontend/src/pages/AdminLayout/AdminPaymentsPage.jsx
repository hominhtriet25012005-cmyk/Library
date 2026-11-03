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
  Tooltip,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";

import { adminFinanceApi, canReconcilePayment } from "../../api/adminFinance";
import { paymentsEnabled } from "../Payments/paymentRules";
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
import { formatCurrencyVND, formatDateTimeVN } from "../../utils/formatters";

const statusNames = {
  PENDING: "Chờ thanh toán",
  PROCESSING: "Đang xác nhận",
  SUCCESS: "Đã xác nhận",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const typeNames = {
  FINE: "Tiền phạt",
  MEMBERSHIP: "Gói thành viên",
  LOST_BOOK_PENALTY: "Mất sách",
  DAMAGED_BOOK_PENALTY: "Hư hỏng sách",
};

const InfoRow = ({ label, value, highlight = false }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      py: 1,
      borderBottom: "1px dashed #e2e8f0",
    }}
  >
    <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        fontWeight: highlight ? 700 : 600,
        color: highlight ? "#102d62" : "#1e293b",
        textAlign: "right",
      }}
    >
      {value ?? "—"}
    </Typography>
  </Box>
);

const AdminPaymentsPage = () => {
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusReload, setStatusReload] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  // Bộ lọc cục bộ trên trang hiện tại
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const controller = new AbortController();
    adminFinanceApi
      .payments({ page }, { signal: controller.signal })
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
          setError(cause.message || "Không tải được danh sách thanh toán.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, reload]);

  useEffect(() => {
    if (!selected) return undefined;
    const controller = new AbortController();
    adminFinanceApi
      .status(selected.id, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setSnapshot(data);
          setStatusError("");
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted && cause.name !== "AbortError")
          setStatusError(
            cause.message || "Không đọc được trạng thái giao dịch.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatusLoading(false);
      });
    return () => controller.abort();
  }, [selected, statusReload]);

  const openDetail = (payment) => {
    setSelected(payment);
    setSnapshot(null);
    setStatusLoading(true);
    setStatusError("");
    setNotice("");
  };

  const reconcile = async () => {
    if (
      !paymentsEnabled ||
      !selected ||
      !canReconcilePayment({
        ...selected,
        status: snapshot?.status ?? selected.status,
      }) ||
      busy
    )
      return;
    setBusy(true);
    setStatusError("");
    setNotice("");
    try {
      const latest = await adminFinanceApi.reconcile(selected.id);
      setSnapshot(latest);
      setConfirming(false);
      setNotice(
        latest.status === "SUCCESS"
          ? `payOS đã xác nhận giao dịch #${selected.id} thành công; số liệu hệ thống đã được cập nhật.`
          : `Đã đối soát #${selected.id}; payOS chưa xác nhận hoàn tất giao dịch.`,
      );
      setLoading(true);
      setReload((value) => value + 1);
    } catch (cause) {
      setStatusError(cause.message || "Đối soát không thành công.");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  // Thống kê nhanh trên dữ liệu trang hiện tại
  const statistics = useMemo(() => {
    const list = result?.content || [];
    const successList = list.filter((p) => p.status === "SUCCESS");
    const pendingList = list.filter(
      (p) => p.status === "PENDING" || p.status === "PROCESSING",
    );
    const totalSuccessAmount = successList.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );

    return {
      totalOnPage: list.length,
      successCount: successList.length,
      pendingCount: pendingList.length,
      totalSuccessAmount,
    };
  }, [result]);

  // Lọc hiển thị cục bộ
  const filteredList = useMemo(() => {
    let list = result?.content || [];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          String(p.id).includes(q) ||
          p.userName?.toLowerCase().includes(q) ||
          p.userEmail?.toLowerCase().includes(q) ||
          p.gatewayOrderId?.toLowerCase().includes(q),
      );
    }
    if (typeFilter !== "ALL") {
      list = list.filter((p) => p.paymentType === typeFilter);
    }
    if (statusFilter !== "ALL") {
      list = list.filter((p) => p.status === statusFilter);
    }
    return list;
  }, [result, searchTerm, typeFilter, statusFilter]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <Box
      component="section"
      aria-label="Quản lý thanh toán"
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
        title="Quản lý thanh toán"
        subtitle="Đối soát và theo dõi toàn bộ giao dịch thanh toán trực tuyến qua cổng PayOS"
        badge={
          result?.totalElements
            ? `${result.totalElements} giao dịch`
            : undefined
        }
      />

      {/* Cảnh báo cấu hình thanh toán */}
      {!paymentsEnabled && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
          Chế độ thanh toán thực đang tắt ở môi trường thử nghiệm. Bạn có thể
          xem lịch sử giao dịch và trạng thái đã lưu.
        </Alert>
      )}

      {/* Thông báo lỗi / thành công */}
      {notice && (
        <Alert
          severity={snapshot?.status === "SUCCESS" ? "success" : "info"}
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
          sx={{ mb: 2.5, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Thẻ thống kê */}
      <StatCardGrid columns={{ xs: 1, sm: 2, lg: 4 }} sx={{ mb: 3 }}>
        <StatCard
          title="Tổng giao dịch (Trang)"
          value={loading ? "—" : statistics.totalOnPage}
          subtitle="Số bản ghi thanh toán hiển thị"
          icon={PaymentRoundedIcon}
          color="primary"
        />
        <StatCard
          title="Thành công (Trang)"
          value={loading ? "—" : statistics.successCount}
          subtitle="Giao dịch PayOS hợp lệ"
          icon={CheckCircleRoundedIcon}
          color="success"
        />
        <StatCard
          title="Chờ xác nhận (Trang)"
          value={loading ? "—" : statistics.pendingCount}
          subtitle="Giao dịch đang chờ thanh toán"
          icon={PendingActionsRoundedIcon}
          color="warning"
        />
        <StatCard
          title="Doanh thu thực thu (Trang)"
          value={
            loading ? "—" : formatCurrencyVND(statistics.totalSuccessAmount)
          }
          subtitle="Tổng tiền giao dịch thành công"
          icon={AccountBalanceWalletRoundedIcon}
          color="navy"
        />
      </StatCardGrid>

      {/* Bộ lọc tìm kiếm */}
      <SearchFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={handleResetFilters}
        searchPlaceholder="Tìm theo ID, người nộp, email, mã đơn..."
        searchLabel="Tra cứu giao dịch"
        showSearchButton={false}
        filters={
          <>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="payment-type-filter-label">
                Loại giao dịch
              </InputLabel>
              <Select
                labelId="payment-type-filter-label"
                label="Loại giao dịch"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="ALL">Tất cả loại</MenuItem>
                {Object.entries(typeNames).map(([key, val]) => (
                  <MenuItem key={key} value={key}>
                    {val}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="payment-status-filter-label">
                Trạng thái
              </InputLabel>
              <Select
                labelId="payment-status-filter-label"
                label="Trạng thái"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                {Object.entries(statusNames).map(([key, val]) => (
                  <MenuItem key={key} value={key}>
                    {val}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        }
      />

      {/* Bảng danh sách thanh toán */}
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
        <Table sx={{ minWidth: 900 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 80, color: "#1e293b" }}>
                Mã
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 180, color: "#1e293b" }}
              >
                Người thanh toán
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 130, color: "#1e293b" }}
              >
                Loại
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, minWidth: 140, color: "#1e293b" }}
              >
                Số tiền
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, minWidth: 100, color: "#1e293b" }}
              >
                Cổng
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, minWidth: 140, color: "#1e293b" }}
              >
                Trạng thái
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 150, color: "#1e293b" }}
              >
                Thời gian
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: 90, color: "#1e293b" }}
              >
                Chi tiết
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                  <Typography
                    variant="body2"
                    sx={{ mt: 1.5, color: "#64748b" }}
                  >
                    Đang tải danh sách thanh toán...
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && filteredList.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ p: 0 }}>
                  <EmptyState
                    title="Chưa có giao dịch thanh toán"
                    description="Không tìm thấy lịch sử giao dịch phù hợp với điều kiện tra cứu."
                  />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !error &&
              filteredList.map((payment) => (
                <TableRow
                  key={payment.id}
                  hover
                  sx={{
                    "&:hover": { bgcolor: "#f8fafc" },
                    "& td": { borderColor: "#f1f5f9" },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: "#64748b" }}>
                    #{payment.id}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "#1e293b" }}
                    >
                      {payment.userName || `#${payment.userId}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", display: "block" }}
                    >
                      {payment.userEmail || `ID: #${payment.userId}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#334155" }}
                    >
                      {typeNames[payment.paymentType] || payment.paymentType}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 750, color: "#102d62" }}
                    >
                      {payment.currency === "VND"
                        ? formatCurrencyVND(payment.amount)
                        : `${payment.amount} ${payment.currency}`}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        px: 1.25,
                        py: 0.5,
                        borderRadius: "6px",
                        bgcolor: "#f1f5f9",
                        color: "#475569",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {payment.gateway}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <StatusChip type="payment" status={payment.status} />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ color: "#475569", fontSize: "0.8125rem" }}
                    >
                      {formatDateTimeVN(payment.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xem chi tiết giao dịch">
                      <IconButton
                        size="small"
                        aria-label={`Chi tiết thanh toán #${payment.id}`}
                        onClick={() => openDetail(payment)}
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
        loading={loading}
        onPageChange={(nextPage) => {
          setLoading(true);
          setPage(nextPage);
        }}
        itemLabel="giao dịch"
      />

      {/* Dialog chi tiết hóa đơn thanh toán */}
      <Dialog
        open={Boolean(selected)}
        onClose={busy ? undefined : () => setSelected(null)}
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
              Giao dịch #{selected?.id}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Bằng chứng thanh toán và trạng thái đối soát
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setSelected(null)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selected && (
            <Stack spacing={2}>
              {statusError && <Alert severity="error">{statusError}</Alert>}
              {statusLoading && (
                <Stack
                  direction="row"
                  gap={1.5}
                  alignItems="center"
                  sx={{ py: 1 }}
                >
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Đang tra cứu trạng thái giao dịch từ hệ thống...
                  </Typography>
                </Stack>
              )}

              {/* Thông tin hóa đơn thanh toán */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: "#f8fafc",
                  borderColor: "#e2e8f0",
                }}
              >
                <InfoRow
                  label="Người thanh toán"
                  value={`${selected.userName || "—"} (#${selected.userId})`}
                />
                <InfoRow label="Email liên hệ" value={selected.userEmail} />
                <InfoRow
                  label="Loại dịch vụ"
                  value={
                    typeNames[selected.paymentType] || selected.paymentType
                  }
                />
                <InfoRow
                  label="Số tiền thanh toán"
                  value={
                    selected.currency === "VND"
                      ? formatCurrencyVND(selected.amount)
                      : `${selected.amount} ${selected.currency}`
                  }
                  highlight
                />
                <InfoRow label="Cổng xử lý" value={selected.gateway} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1,
                    borderBottom: "1px dashed #e2e8f0",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#64748b", fontWeight: 500 }}
                  >
                    Trạng thái ghi nhận
                  </Typography>
                  <StatusChip
                    type="payment"
                    status={snapshot ? snapshot.status : selected.status}
                  />
                </Box>
                {selected.fineId && (
                  <InfoRow
                    label="Mã khoản phạt"
                    value={`#${selected.fineId}`}
                  />
                )}
                {selected.subscriptionId && (
                  <InfoRow
                    label="Mã đăng ký gói"
                    value={`#${selected.subscriptionId}`}
                  />
                )}
                {selected.gatewayOrderId && (
                  <InfoRow
                    label="Mã đơn PayOS"
                    value={selected.gatewayOrderId}
                  />
                )}
                {(selected.gatewayPaymentId || selected.transactionId) && (
                  <InfoRow
                    label="Mã tham chiếu ngân hàng"
                    value={selected.gatewayPaymentId || selected.transactionId}
                  />
                )}
                <InfoRow
                  label="Thời gian tạo đơn"
                  value={formatDateTimeVN(selected.createdAt)}
                />
                {(snapshot?.completedAt || selected.completedAt) && (
                  <InfoRow
                    label="Thời gian hoàn tất"
                    value={formatDateTimeVN(
                      snapshot?.completedAt || selected.completedAt,
                    )}
                  />
                )}
                {selected.description && (
                  <InfoRow
                    label="Nội dung chuyển khoản"
                    value={selected.description}
                  />
                )}
                {selected.failureReason && (
                  <InfoRow
                    label="Lý do thất bại"
                    value={selected.failureReason}
                  />
                )}
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            disabled={busy || statusLoading}
            startIcon={<SyncRoundedIcon />}
            onClick={() => {
              setStatusLoading(true);
              setStatusReload((value) => value + 1);
            }}
            sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
          >
            Làm mới trạng thái
          </Button>

          {paymentsEnabled &&
            canReconcilePayment({
              ...selected,
              status: snapshot?.status ?? selected?.status,
            }) && (
              <Button
                disabled={busy || statusLoading}
                variant="outlined"
                color="primary"
                onClick={() => setConfirming(true)}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Đối soát PayOS
              </Button>
            )}

          <Button
            variant="contained"
            disabled={busy}
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

      {/* Modal xác nhận đối soát PayOS */}
      <ConfirmDialog
        open={confirming}
        title={`Đối soát giao dịch #${selected?.id}?`}
        message="Hệ thống sẽ kết nối trực tiếp đến cổng PayOS để kiểm tra bằng chứng giao dịch thực tế. Trạng thái chỉ được cập nhật khi PayOS xác nhận đã chuyển khoản thành công."
        confirmLabel="Tiến hành đối soát"
        cancelLabel="Hủy bỏ"
        variant="primary"
        loading={busy}
        onConfirm={reconcile}
        onCancel={() => setConfirming(false)}
      />
    </Box>
  );
};

export default AdminPaymentsPage;
