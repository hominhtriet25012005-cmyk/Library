import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
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
  Tab,
  Tabs,
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
import { Link as RouterLink } from "react-router-dom";
import LocalLibraryRoundedIcon from "@mui/icons-material/LocalLibraryRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

import {
  adminLoansApi,
  canCheckinLoan,
  canRenewLoan,
} from "../../api/adminLoans";
import {
  PageHeader,
  SearchFilterBar,
  StatusChip,
  TablePaginationBar,
} from "../../components/common";
import { formatDateVN } from "../../utils/formatters";

const loanTabs = [
  { id: "all", label: "Tất cả", mode: "all", value: "" },
  {
    id: "CHECKED_OUT",
    label: "Đang mượn",
    mode: "status",
    value: "CHECKED_OUT",
  },
  { id: "overdue", label: "Quá hạn", mode: "overdue", value: "" },
  { id: "RETURNED", label: "Đã trả", mode: "status", value: "RETURNED" },
  { id: "LOST", label: "Báo mất", mode: "status", value: "LOST" },
  { id: "DAMAGED", label: "Hư hỏng", mode: "status", value: "DAMAGED" },
];

const statusNames = {
  CHECKED_OUT: "Đang mượn",
  OVERDUE: "Quá hạn",
  RETURNED: "Đã trả",
  LOST: "Báo mất",
  DAMAGED: "Hư hỏng",
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

const AdminLoansPage = () => {
  const [currentTab, setCurrentTab] = useState("all");
  const [counts, setCounts] = useState({});
  const [searchType, setSearchType] = useState("user");
  const [searchValue, setSearchValue] = useState("");
  const [filter, setFilter] = useState({ mode: "all", value: "" });
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [operation, setOperation] = useState(null);
  const [form, setForm] = useState({
    userId: "",
    bookId: "",
    checkoutDays: "",
    notes: "",
    condition: "RETURNED",
    extensionDays: "",
  });
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  // Tải số lượng bản ghi tương ứng cho từng Tab (Ý tưởng 2)
  useEffect(() => {
    const controller = new AbortController();
    const fetchCounts = async () => {
      try {
        const [
          allRes,
          activeRes,
          overdueRes,
          returnedRes,
          lostRes,
          damagedRes,
        ] = await Promise.allSettled([
          adminLoansApi.search(
            { mode: "all", page: 0, size: 1 },
            { signal: controller.signal },
          ),
          adminLoansApi.search(
            { mode: "status", value: "CHECKED_OUT", page: 0, size: 1 },
            { signal: controller.signal },
          ),
          adminLoansApi.search(
            { mode: "overdue", page: 0, size: 1 },
            { signal: controller.signal },
          ),
          adminLoansApi.search(
            { mode: "status", value: "RETURNED", page: 0, size: 1 },
            { signal: controller.signal },
          ),
          adminLoansApi.search(
            { mode: "status", value: "LOST", page: 0, size: 1 },
            { signal: controller.signal },
          ),
          adminLoansApi.search(
            { mode: "status", value: "DAMAGED", page: 0, size: 1 },
            { signal: controller.signal },
          ),
        ]);

        if (!controller.signal.aborted) {
          setCounts({
            all:
              allRes.status === "fulfilled" ? allRes.value.totalElements : null,
            CHECKED_OUT:
              activeRes.status === "fulfilled"
                ? activeRes.value.totalElements
                : null,
            overdue:
              overdueRes.status === "fulfilled"
                ? overdueRes.value.totalElements
                : null,
            RETURNED:
              returnedRes.status === "fulfilled"
                ? returnedRes.value.totalElements
                : null,
            LOST:
              lostRes.status === "fulfilled"
                ? lostRes.value.totalElements
                : null,
            DAMAGED:
              damagedRes.status === "fulfilled"
                ? damagedRes.value.totalElements
                : null,
          });
        }
      } catch {
        // Bỏ qua lỗi phụ nếu có
      }
    };
    fetchCounts();
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    const controller = new AbortController();
    adminLoansApi
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
          setLoadError(error.message || "Không thể tải lượt mượn.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filter, page, reload]);

  const handleTabChange = (tabId) => {
    const targetTab = loanTabs.find((t) => t.id === tabId);
    if (!targetTab) return;
    setCurrentTab(tabId);
    setSearchValue("");
    setNotice("");
    setLoadError("");
    setLoading(true);
    setPage(0);
    setFilter({ mode: targetTab.mode, value: targetTab.value });
  };

  const handleSearchSubmit = () => {
    const trimmed = searchValue.trim();
    if (!trimmed) {
      handleTabChange("all");
      return;
    }
    const idNum = Number(trimmed);
    if (!Number.isSafeInteger(idNum) || idNum < 1) {
      setLoadError(
        `${searchType === "user" ? "ID người dùng" : "ID sách"} phải là số nguyên dương.`,
      );
      return;
    }
    setNotice("");
    setLoadError("");
    setLoading(true);
    setPage(0);
    setCurrentTab(false); // Bỏ chọn tab vì đang tìm theo ID
    setFilter({ mode: searchType, value: trimmed });
  };

  const handleResetFilters = () => {
    setSearchValue("");
    handleTabChange("all");
  };

  const retry = () => {
    setLoading(true);
    setLoadError("");
    setReload((value) => value + 1);
  };

  const openAction = (type, loan = null) => {
    setSelected(null);
    setOperation({ type, loan });
    setActionError("");
    setForm({
      userId: "",
      bookId: "",
      checkoutDays: "",
      notes: "",
      condition: "RETURNED",
      extensionDays: "",
    });
  };

  const closeAction = () => {
    if (!busy) setOperation(null);
  };

  const submitAction = async () => {
    if (!operation || busy) return;
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      let updated;
      if (operation.type === "checkout") {
        updated = await adminLoansApi.checkout(form);
        setNotice(`Đã cấp sách và tạo lượt mượn #${updated.id}.`);
      } else if (operation.type === "checkin") {
        updated = await adminLoansApi.checkin(
          operation.loan.id,
          form.condition,
        );
        setNotice(`Đã ghi nhận trả sách cho lượt mượn #${updated.id}.`);
      } else if (operation.type === "renew") {
        updated = await adminLoansApi.renew(
          operation.loan.id,
          form.extensionDays,
        );
        setNotice(`Đã gia hạn lượt mượn #${updated.id}.`);
      } else {
        const response = await adminLoansApi.updateOverdue();
        setNotice(response.message || "Đã cập nhật các lượt mượn quá hạn.");
      }
      if (updated) setSelected(updated);
      setOperation(null);
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
        title="Quản lý mượn – trả sách"
        subtitle="Tra cứu lượt mượn toàn hệ thống, cấp sách tại quầy, xử lý trả, gia hạn và cập nhật quá hạn."
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => openAction("checkout")}
            >
              Cấp sách
            </Button>
            <Button
              variant="outlined"
              startIcon={<UpdateRoundedIcon />}
              onClick={() => openAction("overdue")}
            >
              Cập nhật quá hạn
            </Button>
          </Stack>
        }
      />

      {/* Thanh tìm kiếm & bộ lọc chuẩn hóa */}
      <SearchFilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchSubmit={handleSearchSubmit}
        showSearchButton={false}
        searchPlaceholder={
          searchType === "user"
            ? "Nhập ID người dùng (VD: 2)..."
            : "Nhập ID sách (VD: 15)..."
        }
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
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel id="search-type-label">Tra cứu theo</InputLabel>
          <Select
            labelId="search-type-label"
            label="Tra cứu theo"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <MenuItem value="user">ID người dùng</MenuItem>
            <MenuItem value="book">ID sách</MenuItem>
          </Select>
        </FormControl>
      </SearchFilterBar>

      {/* Thanh Tab phân loại nhanh theo trạng thái (Ý tưởng 2) */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          borderColor: "#e2e8f0",
          bgcolor: "#ffffff",
          mb: 2.5,
          overflow: "hidden",
        }}
      >
        <Tabs
          variant="scrollable"
          scrollButtons="auto"
          value={currentTab === "" ? false : currentTab}
          onChange={(_, tabId) => handleTabChange(tabId)}
          aria-label="Phân loại lượt mượn theo trạng thái"
          sx={{
            px: 1.5,
            minHeight: 52,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              minHeight: 52,
              py: 1,
              px: 2,
              color: "#64748b",
              "&.Mui-selected": {
                color: "#1769ff",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#1769ff",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          {loanTabs.map((tab) => {
            const count = counts[tab.id];
            const isSelected = currentTab === tab.id;
            const isOverdue = tab.id === "overdue";
            const isWarning =
              (isOverdue || tab.id === "LOST" || tab.id === "DAMAGED") &&
              Number(count) > 0;
            return (
              <Tab
                key={tab.id}
                value={tab.id}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{tab.label}</span>
                    {count != null && (
                      <Chip
                        label={count}
                        size="small"
                        sx={{
                          height: 20,
                          minWidth: 24,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          borderRadius: "10px",
                          cursor: "pointer",
                          bgcolor: isWarning
                            ? "#fee2e2"
                            : isSelected
                              ? "#e0e7ff"
                              : "#f1f5f9",
                          color: isWarning
                            ? "#dc2626"
                            : isSelected
                              ? "#3730a3"
                              : "#64748b",
                        }}
                      />
                    )}
                  </Stack>
                }
              />
            );
          })}
        </Tabs>
      </Paper>

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

      {/* Bảng danh sách mượn */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 3, borderColor: "#e2e8f0" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}>Mã lượt</TableCell>
              <TableCell>Người mượn</TableCell>
              <TableCell>Thông tin sách</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell>Ngày mượn</TableCell>
              <TableCell>Hạn trả</TableCell>
              <TableCell align="center">Ngày trả</TableCell>
              <TableCell align="center" sx={{ width: 150 }}>
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
              (result?.content ?? []).map((loan) => (
                <TableRow key={loan.id} hover>
                  <TableCell
                    sx={{ fontFamily: "monospace", color: "text.secondary" }}
                  >
                    #{loan.id}
                  </TableCell>

                  <TableCell>
                    <Typography
                      fontWeight={700}
                      sx={{ color: "#0f172a", fontSize: "0.875rem" }}
                    >
                      {loan.userName || `Độc giả #${loan.userId}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {loan.userEmail || `ID: #${loan.userId}`}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography
                      fontWeight={650}
                      sx={{ color: "#0f172a", fontSize: "0.875rem" }}
                    >
                      {loan.bookTitle || `Sách #${loan.bookId}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ISBN: {loan.bookIsbn || "—"}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <StatusChip status={loan.status} type="loan" />
                  </TableCell>

                  <TableCell
                    sx={{ fontSize: "0.8125rem", color: "text.secondary" }}
                  >
                    {formatDateVN(loan.checkoutDate)}
                  </TableCell>

                  <TableCell sx={{ fontSize: "0.8125rem" }}>
                    <Typography
                      sx={{
                        fontSize: "0.8125rem",
                        fontWeight: loan.status === "OVERDUE" ? 700 : 500,
                        color:
                          loan.status === "OVERDUE"
                            ? "error.main"
                            : "text.secondary",
                      }}
                    >
                      {formatDateVN(loan.dueDate)}
                    </Typography>
                    {loan.status === "OVERDUE" &&
                      loan.remainingDays != null &&
                      loan.remainingDays < 0 && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "error.main",
                            fontWeight: 700,
                            display: "block",
                          }}
                        >
                          (Quá hạn {Math.abs(loan.remainingDays)} ngày)
                        </Typography>
                      )}
                    {loan.status === "CHECKED_OUT" &&
                      loan.remainingDays != null && (
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              loan.remainingDays <= 2
                                ? "warning.main"
                                : "text.secondary",
                            display: "block",
                            fontWeight: loan.remainingDays <= 2 ? 600 : 400,
                          }}
                        >
                          {loan.remainingDays === 0
                            ? "(Hôm nay đến hạn)"
                            : loan.remainingDays > 0
                              ? `(Còn ${loan.remainingDays} ngày)`
                              : ""}
                        </Typography>
                      )}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ fontSize: "0.8125rem", color: "text.secondary" }}
                  >
                    {loan.returnDate ? formatDateVN(loan.returnDate) : "—"}
                  </TableCell>

                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={0.75}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => setSelected(loan)}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {canCheckinLoan(loan) && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => openAction("checkin", loan)}
                          sx={{
                            height: 28,
                            fontSize: "0.75rem",
                            px: 1.25,
                            fontWeight: 600,
                            borderRadius: 1.5,
                            boxShadow: "none",
                            textTransform: "none",
                          }}
                        >
                          Trả sách
                        </Button>
                      )}

                      {canRenewLoan(loan) && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => openAction("renew", loan)}
                          sx={{
                            height: 28,
                            fontSize: "0.75rem",
                            px: 1,
                            borderRadius: 1.5,
                            textTransform: "none",
                          }}
                        >
                          Gia hạn
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}

            {!loading && !loadError && result?.content?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ py: 6, color: "text.secondary" }}
                >
                  Không tìm thấy lượt mượn phù hợp với bộ lọc.
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
        itemLabel="lượt mượn"
        loading={loading}
        onPageChange={(newPage) => {
          setLoading(true);
          setPage(newPage);
        }}
      />

      {/* Modal Chi tiết lượt mượn */}
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
            Chi tiết lượt mượn #{selected?.id}
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
                label="Người mượn"
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
                  <StatusChip status={selected.status} type="loan" />
                </Box>
              </Box>
              <Detail
                label="Ngày mượn"
                value={formatDateVN(selected.checkoutDate)}
              />
              <Detail label="Hạn trả" value={formatDateVN(selected.dueDate)} />
              <Detail
                label="Ngày trả thực tế"
                value={formatDateVN(selected.returnDate)}
              />
              <Detail
                label="Số lần gia hạn"
                value={`${selected.renewalCount ?? 0}/${selected.maxRenewals ?? 0}`}
              />
              <Detail
                label="Số ngày quá hạn"
                value={
                  selected.overdueDays
                    ? `${selected.overdueDays} ngày`
                    : "0 ngày"
                }
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
          {canRenewLoan(selected) && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => openAction("renew", selected)}
            >
              Gia hạn
            </Button>
          )}
          {canCheckinLoan(selected) && (
            <Button
              variant="contained"
              color="success"
              onClick={() => openAction("checkin", selected)}
            >
              Ghi nhận trả sách
            </Button>
          )}
          <Button onClick={() => setSelected(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Thao tác (Cấp sách / Trả sách / Gia hạn / Cập nhật quá hạn) */}
      <Dialog
        open={Boolean(operation)}
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
            {operation?.type === "checkout"
              ? "Cấp sách cho độc giả"
              : operation?.type === "checkin"
                ? `Ghi nhận trả sách · Lượt #${operation.loan.id}`
                : operation?.type === "renew"
                  ? `Gia hạn lượt mượn · Lượt #${operation.loan.id}`
                  : "Cập nhật các lượt mượn quá hạn"}
          </Typography>
          <IconButton size="small" onClick={closeAction} disabled={busy}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {operation?.type === "checkout" && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Nhập mã ID độc giả và ID sách. Hệ thống sẽ tự động kiểm tra
                  tồn kho và hạn mức mượn của gói hội viên khi xác nhận.
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
                  label="Số ngày mượn"
                  type="number"
                  required
                  placeholder="VD: 14"
                  value={form.checkoutDays}
                  onChange={(event) =>
                    setForm({ ...form, checkoutDays: event.target.value })
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

            {operation?.type === "checkin" && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Chọn tình trạng thực tế của cuốn sách khi nhận lại tại quầy.
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Tình trạng sách khi trả</InputLabel>
                  <Select
                    label="Tình trạng sách khi trả"
                    value={form.condition}
                    onChange={(event) =>
                      setForm({ ...form, condition: event.target.value })
                    }
                  >
                    <MenuItem value="RETURNED">
                      Bình thường (Còn nguyên vẹn)
                    </MenuItem>
                    <MenuItem value="LOST">Báo mất sách</MenuItem>
                    <MenuItem value="DAMAGED">Hư hỏng / Rách nát</MenuItem>
                  </Select>
                </FormControl>
                {form.condition === "DAMAGED" && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    Vui lòng kiểm tra kỹ tình trạng sách và tạo khoản phạt hư
                    hỏng tương ứng ở mục Tiền phạt.
                  </Alert>
                )}
              </>
            )}

            {operation?.type === "renew" && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Gia hạn thêm số ngày vào thời hạn trả hiện tại của lượt mượn #
                  {operation?.loan?.id}.
                </Typography>
                <TextField
                  label="Số ngày gia hạn thêm"
                  type="number"
                  required
                  placeholder="VD: 7"
                  value={form.extensionDays}
                  onChange={(event) =>
                    setForm({ ...form, extensionDays: event.target.value })
                  }
                />
              </>
            )}

            {operation?.type === "overdue" && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Hệ thống sẽ quét toàn bộ các lượt mượn chưa trả đã qua hạn và
                  cập nhật trạng thái sang "Quá hạn" cùng số ngày quá hạn thực
                  tế.
                </Typography>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Thao tác này chỉ cập nhật trạng thái quá hạn trên hệ thống và
                  không tự động trừ tiền phạt.
                </Alert>
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
          sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9", gap: 1 }}
        >
          <Button
            disabled={busy}
            onClick={closeAction}
            sx={{ color: "#64748b" }}
          >
            Hủy
          </Button>
          <Button variant="contained" disabled={busy} onClick={submitAction}>
            {busy ? "Đang xử lý…" : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminLoansPage;
