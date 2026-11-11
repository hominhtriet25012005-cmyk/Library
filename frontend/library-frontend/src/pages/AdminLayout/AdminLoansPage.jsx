import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Checkbox,
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

import {
  adminLoansApi,
  canCheckinLoan,
  canRenewLoan,
  needsCheckinDescription,
} from "../../api/adminLoans";
import {
  PageHeader,
  SearchFilterBar,
  StatusChip,
  TablePaginationBar,
} from "../../components/common";
import { formatCurrencyVND, formatDateTimeVN, formatDateVN } from "../../utils/formatters";

const loanTabs = [
  {
    id: "returnRequests",
    label: "Chờ xác nhận trả",
    mode: "returnRequests",
    value: "",
  },
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

const localDateToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const minimumReceivedDate = (loan) => {
  const checkoutDate = loan?.checkoutDate || "";
  const requestedDate = loan?.returnRequestedAt?.slice(0, 10) || "";
  return requestedDate > checkoutDate ? requestedDate : checkoutDate;
};

const hasPendingReturnRequest = (loan) =>
  Boolean(loan?.returnRequestedAt && !loan?.checkedInAt);

const canRenewInAdmin = (loan) =>
  canRenewLoan(loan) && !hasPendingReturnRequest(loan);

const daysBetweenLocalDates = (start, end) => {
  if (!start || !end) return 0;
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  const startTime = Date.UTC(startYear, startMonth - 1, startDay);
  const endTime = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.max(0, Math.floor((endTime - startTime) / 86_400_000));
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
        color: "text.primary",
        mt: 0.25,
      }}
    >
      {value ?? "—"}
    </Typography>
  </Box>
);

const AdminLoansPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState(() =>
    searchParams.get("tab") === "returnRequests" ? "returnRequests" : "all",
  );
  const [counts, setCounts] = useState({});
  const [searchType, setSearchType] = useState("user");
  const [searchValue, setSearchValue] = useState("");
  const [filter, setFilter] = useState(() =>
    searchParams.get("tab") === "returnRequests"
      ? { mode: "returnRequests", value: "" }
      : { mode: "all", value: "" },
  );
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
    damageLevel: "",
    receivedDate: localDateToday(),
    confirmDefaultReferencePrice: false,
    extensionDays: "",
  });
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [returnFinePreview, setReturnFinePreview] = useState(null);
  const [finePreviewLoading, setFinePreviewLoading] = useState(false);
  const [finePreviewError, setFinePreviewError] = useState("");

  useEffect(() => {
    if (searchParams.get("tab") !== "returnRequests") return;
    setCurrentTab("returnRequests");
    setSearchValue("");
    setNotice("");
    setLoadError("");
    setLoading(true);
    setPage(0);
    setFilter({ mode: "returnRequests", value: "" });
  }, [searchParams]);

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
          returnRequestsRes,
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
          adminLoansApi.returnRequests(
            { page: 0, size: 1 },
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
            returnRequests:
              returnRequestsRes.status === "fulfilled"
                ? returnRequestsRes.value.totalElements
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
    const request =
      filter.mode === "returnRequests"
        ? adminLoansApi.returnRequests({ page, size: 10 }, { signal: controller.signal })
        : adminLoansApi.search({ ...filter, page }, { signal: controller.signal });
    request
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

  useEffect(() => {
    if (operation?.type !== "checkin" || !operation.loan?.id) {
      return undefined;
    }

    if (!form.receivedDate || (form.condition === "DAMAGED" && !form.damageLevel)) {
      return undefined;
    }

    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setReturnFinePreview(null);
      setFinePreviewLoading(true);
      setFinePreviewError("");
    });
    adminLoansApi
      .previewCheckin(
        operation.loan.id,
        {
          condition: form.condition,
          damageLevel: form.damageLevel,
          receivedDate: form.receivedDate,
        },
        { signal: controller.signal },
      )
      .then((preview) => {
        if (!controller.signal.aborted) setReturnFinePreview(preview);
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError")
          setFinePreviewError(error.message || "Không thể xem trước tiền phạt.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setFinePreviewLoading(false);
      });
    return () => controller.abort();
  }, [operation, form.condition, form.damageLevel, form.receivedDate]);

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
    const nextSearchParams = new URLSearchParams(searchParams);
    if (tabId === "returnRequests") nextSearchParams.set("tab", "returnRequests");
    else nextSearchParams.delete("tab");
    setSearchParams(nextSearchParams, { replace: true });
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
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("tab");
    setSearchParams(nextSearchParams, { replace: true });
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
    setReturnFinePreview(null);
    setFinePreviewLoading(type === "checkin");
    setFinePreviewError("");
    setForm({
      userId: "",
      bookId: "",
      checkoutDays: "",
      notes: "",
      condition: "RETURNED",
      damageLevel: "",
      receivedDate: localDateToday(),
      confirmDefaultReferencePrice: false,
      extensionDays: "",
    });
  };

  const closeAction = () => {
    if (!busy) setOperation(null);
  };

  const submitAction = async () => {
    if (!operation || busy) return;
    if (operation.type === "checkin") {
      const minimumDate = minimumReceivedDate(operation.loan);
      const today = localDateToday();
      if (!form.receivedDate || form.receivedDate < minimumDate || form.receivedDate > today) {
        setActionError(
          operation.loan.returnRequestedAt
            ? "Ngày nhận sách không được trước ngày độc giả gửi yêu cầu trả hoặc sau hôm nay."
            : "Ngày nhận sách không được trước ngày mượn hoặc sau hôm nay.",
        );
        return;
      }
    }
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
          {
            condition: form.condition,
            damageLevel: form.damageLevel,
            receivedDate: form.receivedDate,
            inspectionNote: form.notes,
            confirmDefaultReferencePrice: form.confirmDefaultReferencePrice,
          },
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

  const requiresDefaultPriceConfirmation =
    returnFinePreview?.requiresDefaultReferencePriceConfirmation === true;
  const finePreviewReady =
    form.condition !== "DAMAGED" || Boolean(form.damageLevel);

  return (
    <Box
      component="section"
      sx={{ maxWidth: 1240, mx: "auto", py: { xs: 2.5, sm: 3.5 } }}
    >
      <PageHeader
        title="Quản lý mượn – trả sách"
        subtitle="Tra cứu lượt mượn, xử lý yêu cầu trả tại quầy, gia hạn và cập nhật quá hạn."
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
      {currentTab !== "returnRequests" && (
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
                  color: "text.secondary",
                  borderColor: "divider",
                  "&:hover": {
                    borderColor: "text.secondary",
                    bgcolor: "action.hover",
                  },
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
      )}

      {/* Thanh Tab phân loại nhanh theo trạng thái và hàng chờ trả */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          borderColor: "divider",
          bgcolor: "background.paper",
          mb: 2.5,
          overflow: "hidden",
        }}
      >
        <Tabs
          variant="scrollable"
          scrollButtons="auto"
          value={currentTab === "" ? false : currentTab}
          onChange={(_, tabId) => handleTabChange(tabId)}
          aria-label="Phân loại lượt mượn và yêu cầu trả sách"
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
              color: "text.secondary",
              "&.Mui-selected": {
                color: "primary.main",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
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
                          bgcolor: (theme) =>
                            isWarning
                              ? theme.palette.mode === "dark"
                                ? "rgba(239, 68, 68, 0.2)"
                                : "#fee2e2"
                              : isSelected
                                ? theme.palette.mode === "dark"
                                  ? "rgba(99, 102, 241, 0.2)"
                                  : "#e0e7ff"
                                : theme.palette.mode === "dark"
                                  ? "rgba(255, 255, 255, 0.08)"
                                  : "#f1f5f9",
                          color: isWarning
                            ? "error.main"
                            : isSelected
                              ? "primary.main"
                              : "text.secondary",
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
        sx={{ borderRadius: 3, borderColor: "divider" }}
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
              <TableCell align="center">
                {currentTab === "returnRequests" ? "Yêu cầu trả" : "Ngày trả"}
              </TableCell>
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
                      sx={{ color: "text.primary", fontSize: "0.875rem" }}
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
                      sx={{ color: "text.primary", fontSize: "0.875rem" }}
                    >
                      {loan.bookTitle || `Sách #${loan.bookId}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ISBN: {loan.bookIsbn || "—"}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Stack spacing={0.5} alignItems="center">
                      <StatusChip status={loan.status} type="loan" />
                      {hasPendingReturnRequest(loan) && (
                        <Chip
                          label="Chờ tiếp nhận"
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
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
                        fontWeight:
                          loan.status === "OVERDUE" ||
                          (currentTab === "returnRequests" &&
                            daysBetweenLocalDates(loan.dueDate, localDateToday()) > 0)
                            ? 700
                            : 500,
                        color:
                          loan.status === "OVERDUE" ||
                          (currentTab === "returnRequests" &&
                            daysBetweenLocalDates(loan.dueDate, localDateToday()) > 0)
                            ? "error.main"
                            : "text.secondary",
                      }}
                    >
                      {formatDateVN(loan.dueDate)}
                    </Typography>
                    {loan.status === "OVERDUE" &&
                      currentTab !== "returnRequests" &&
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
                    {currentTab === "returnRequests" &&
                      daysBetweenLocalDates(loan.dueDate, localDateToday()) > 0 && (
                        <Typography
                          variant="caption"
                          sx={{ color: "error.main", fontWeight: 700, display: "block" }}
                        >
                          (Quá hạn {daysBetweenLocalDates(loan.dueDate, localDateToday())} ngày)
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
                    {currentTab === "returnRequests" ? (
                      <Stack spacing={0.25} alignItems="center">
                        <Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
                          {formatDateTimeVN(loan.returnRequestedAt)}
                        </Typography>
                        {loan.returnRequestNote && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ maxWidth: 220, whiteSpace: "normal", overflowWrap: "anywhere" }}
                          >
                            {loan.returnRequestNote}
                          </Typography>
                        )}
                      </Stack>
                    ) : loan.returnDate ? formatDateVN(loan.returnDate) : "—"}
                  </TableCell>

                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={0.75}
                      justifyContent="center"
                      alignItems="center"
                      sx={{
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
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
                          {currentTab === "returnRequests" || hasPendingReturnRequest(loan)
                            ? "Kiểm tra & nhận"
                            : "Tiếp nhận sách"}
                        </Button>
                      )}

                      {canRenewInAdmin(loan) && (
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
                  {currentTab === "returnRequests"
                    ? "Hiện không có yêu cầu trả sách nào đang chờ xác nhận."
                    : "Không tìm thấy lượt mượn phù hợp với bộ lọc."}
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
          <Typography
            variant="h6"
            sx={{ fontWeight: 750, color: "text.primary" }}
          >
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
                label="Thời điểm yêu cầu trả"
                value={formatDateTimeVN(selected.returnRequestedAt)}
              />
              <Detail
                label="Ngày ADMIN tiếp nhận"
                value={formatDateVN(selected.checkedInAt)}
              />
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Detail
                  label="Ghi chú yêu cầu trả của độc giả"
                  value={selected.returnRequestNote || "Không có ghi chú"}
                />
              </Box>
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Detail
                  label="Kết quả kiểm tra của ADMIN"
                  value={selected.inspectionNote || "Chưa có ghi chú kiểm tra"}
                />
              </Box>
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
          sx={{ px: 3, py: 2, borderTop: 1, borderColor: "divider", gap: 1 }}
        >
          {canRenewInAdmin(selected) && (
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
          <Typography
            variant="h6"
            sx={{ fontWeight: 750, color: "text.primary" }}
          >
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
                  label="ID người dùng "
                  type="number"
                  required
                  value={form.userId}
                  onChange={(event) =>
                    setForm({ ...form, userId: event.target.value })
                  }
                />
                <TextField
                  label="ID sách "
                  type="number"
                  required
                  value={form.bookId}
                  onChange={(event) =>
                    setForm({ ...form, bookId: event.target.value })
                  }
                />
                <TextField
                  label="Số ngày mượn"
                  type="number"
                  required
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
                  Kiểm tra sách thực tế tại quầy. Khi xác nhận, hệ thống hoàn tất lượt mượn và tự tạo các khoản phạt nếu phát sinh.
                </Typography>
                {operation.loan.returnRequestedAt && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Độc giả gửi yêu cầu trả lúc {formatDateTimeVN(operation.loan.returnRequestedAt)}.
                    {operation.loan.returnRequestNote ? ` Ghi chú: ${operation.loan.returnRequestNote}` : ""}
                  </Alert>
                )}
                <FormControl fullWidth>
                  <InputLabel>Tình trạng sách khi trả</InputLabel>
                  <Select
                    label="Tình trạng sách khi trả"
                    value={form.condition}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        condition: event.target.value,
                        damageLevel:
                          event.target.value === "DAMAGED"
                            ? previous.damageLevel
                            : "",
                      }))
                    }
                  >
                    <MenuItem value="RETURNED">
                      Bình thường (Còn nguyên vẹn)
                    </MenuItem>
                    <MenuItem value="LOST">Báo mất sách</MenuItem>
                    <MenuItem value="DAMAGED">Hư hỏng sách</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Ngày thư viện thực tế nhận sách"
                  type="date"
                  required
                  value={form.receivedDate}
                  onChange={(event) =>
                    setForm({ ...form, receivedDate: event.target.value })
                  }
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: {
                      min: minimumReceivedDate(operation.loan),
                      max: localDateToday(),
                    },
                  }}
                  helperText={
                    operation.loan.returnRequestedAt
                      ? `Ngày nhận không được trước yêu cầu trả (${formatDateVN(minimumReceivedDate(operation.loan))}) hoặc sau hôm nay.`
                      : `Ngày nhận không được trước ngày mượn (${formatDateVN(minimumReceivedDate(operation.loan))}) hoặc sau hôm nay.`
                  }
                />
                {form.condition === "DAMAGED" && (
                  <FormControl fullWidth required>
                    <InputLabel>Mức độ hư hỏng</InputLabel>
                    <Select
                      label="Mức độ hư hỏng"
                      value={form.damageLevel}
                      onChange={(event) =>
                        setForm({ ...form, damageLevel: event.target.value })
                      }
                    >
                      <MenuItem value="LIGHT">Hư hỏng nhẹ · phạt 25%</MenuItem>
                      <MenuItem value="SEVERE">Hư hỏng nặng · phạt 75%</MenuItem>
                    </Select>
                  </FormControl>
                )}
                <TextField
                  label={
                    needsCheckinDescription(form.condition)
                      ? "Mô tả kết quả kiểm tra *"
                      : "Ghi chú trả sách (không bắt buộc)"
                  }
                  multiline
                  minRows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  helperText={
                    needsCheckinDescription(form.condition)
                      ? `Bắt buộc mô tả rõ tình trạng sách. ${form.notes.length}/500 ký tự.`
                      : `${form.notes.length}/500 ký tự.`
                  }
                  slotProps={{ htmlInput: { maxLength: 500 } }}
                />
                {finePreviewLoading && (
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      Đang để Backend tính tiền phạt dự kiến…
                    </Typography>
                  </Stack>
                )}
                {finePreviewError && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {finePreviewError} Chưa thể xác nhận trả sách khi chưa đối chiếu được tiền phạt.
                  </Alert>
                )}
                {form.condition === "DAMAGED" && !form.damageLevel && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Chọn mức độ hư hỏng để xem đầy đủ khoản phạt dự kiến.
                  </Alert>
                )}
                {!finePreviewLoading && !finePreviewError && returnFinePreview?.items?.length > 0 && finePreviewReady && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                    <Typography fontWeight={700} sx={{ mb: 1 }}>
                      Tiền phạt dự kiến
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                      Giá tham chiếu: {formatCurrencyVND(returnFinePreview.referencePrice)}
                      {returnFinePreview.usesDefaultReferencePrice ? " (mức mặc định)" : " (giá sách)"}
                    </Typography>
                    {returnFinePreview.items.map((item) => (
                      <Stack
                        key={item.label}
                        direction="row"
                        justifyContent="space-between"
                        spacing={2}
                        sx={{ py: 0.35 }}
                      >
                        <Typography variant="body2">{item.label}</Typography>
                        <Typography variant="body2" fontWeight={650}>
                          {formatCurrencyVND(item.amount)}
                        </Typography>
                      </Stack>
                    ))}
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: "divider" }}
                    >
                      <Typography fontWeight={700}>Tổng dự kiến</Typography>
                      <Typography color="primary.main" fontWeight={800}>
                        {formatCurrencyVND(returnFinePreview.totalAmount)}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Số tiền cuối cùng do Backend tính lại khi ADMIN xác nhận.
                    </Typography>
                  </Paper>
                )}
                {requiresDefaultPriceConfirmation && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    Sách chưa có giá hợp lệ. Xác nhận dùng giá tham chiếu 100.000đ để tính khoản phạt.
                    <FormControlLabel
                      sx={{ display: "flex", mt: 0.5, ml: 0 }}
                      control={
                        <Checkbox
                          checked={form.confirmDefaultReferencePrice}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              confirmDefaultReferencePrice: event.target.checked,
                            })
                          }
                        />
                      }
                      label="Tôi xác nhận dùng giá tham chiếu 100.000đ"
                    />
                  </Alert>
                )}
                {returnFinePreview && returnFinePreview.items?.length === 0 && !finePreviewError && (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Theo ngày nhận và tình trạng đã chọn, không phát sinh tiền phạt.
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
          sx={{ px: 3, py: 2, borderTop: 1, borderColor: "divider", gap: 1 }}
        >
          <Button
            disabled={busy}
            onClick={closeAction}
            sx={{ color: "text.secondary" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={
              busy ||
              (operation?.type === "checkin" &&
                (finePreviewLoading ||
                  Boolean(finePreviewError) ||
                  !returnFinePreview ||
                  (requiresDefaultPriceConfirmation && !form.confirmDefaultReferencePrice) ||
                  (form.condition === "DAMAGED" && !form.damageLevel) ||
                  (needsCheckinDescription(form.condition) && !form.notes.trim()) ||
                  !form.receivedDate))
            }
            onClick={submitAction}
          >
            {busy ? "Đang xử lý…" : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminLoansPage;
