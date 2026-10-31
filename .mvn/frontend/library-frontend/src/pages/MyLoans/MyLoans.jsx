import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

import { loansApi, loadLoanPages } from "../../api/loans.js";
import { filterLoans, renewalDays, effectiveLoanStatus } from "./loanRules.js";
import { tabs } from "./tab.js";
import { loans as previewLoans } from "./loans.js";
import LoanCard from "./LoanCard.jsx";
import {
  PageHeader,
  StatCard,
  StatCardGrid,
  EmptyState,
} from "../../components/common";

const MyLoans = ({ preview = false }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loans, setLoans] = useState(preview ? previewLoans : []);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [action, setAction] = useState(null);
  const [days, setDays] = useState("14");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    loadLoanPages(loansApi.list, { signal: controller.signal })
      .then((entries) => {
        setLoans(entries);
        setError("");
      })
      .catch((failure) => {
        if (failure.name !== "AbortError") setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [preview, refresh]);

  const openAction = (loan, kind) => {
    setAction({ loan, kind });
    setDays("14");
    setActionError("");
  };

  const confirmAction = async () => {
    const extensionDays = renewalDays(days);
    if (action.kind === "renew" && extensionDays === null) {
      setActionError("Số ngày gia hạn phải là số nguyên dương.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      if (action.kind === "renew")
        await loansApi.renew(action.loan.id, extensionDays);
      else await loansApi.checkin(action.loan.id);
      setMessage(
        action.kind === "renew"
          ? "Đã gia hạn thành công. Danh sách đang được làm mới."
          : "Đã xác nhận trả sách. Danh sách đang được làm mới.",
      );
      setAction(null);
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const visibleLoans = filterLoans(loans, tabs[activeTab].value);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const all = loans || [];
    const active = all.filter(
      (l) => effectiveLoanStatus(l) === "CHECKED_OUT",
    ).length;
    const overdue = all.filter(
      (l) => effectiveLoanStatus(l) === "OVERDUE",
    ).length;
    const returned = all.filter(
      (l) => effectiveLoanStatus(l) === "RETURNED",
    ).length;
    return { total: all.length, active, overdue, returned };
  }, [loans]);

  return (
    <Box
      component="section"
      aria-label="Sách mượn của tôi"
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
        pb: 4,
      }}
    >
      {/* Header */}
      <PageHeader
        title="Sách mượn của tôi"
        subtitle={
          preview
            ? "Bản xem thử với dữ liệu mẫu, không làm thay đổi các khoản mượn thật."
            : "Theo dõi các cuốn sách bạn đang mượn, hạn trả và lịch sử hoàn tất."
        }
        icon={LibraryBooksRoundedIcon}
        badge={!preview ? `${loans.length} lượt mượn` : undefined}
      />

      {/* Thẻ thống kê */}
      <StatCardGrid columns={{ xs: 1, sm: 2, lg: 4 }} sx={{ mb: 3 }}>
        <StatCard
          title="Tổng lượt mượn"
          value={loading ? "—" : stats.total}
          subtitle="Tất cả các lần mượn từ trước tới nay"
          icon={LibraryBooksRoundedIcon}
          color="primary"
        />
        <StatCard
          title="Đang mượn"
          value={loading ? "—" : stats.active}
          subtitle="Sách đang trong thời hạn mượn"
          icon={AutoStoriesRoundedIcon}
          color="navy"
        />
        <StatCard
          title="Quá hạn trả"
          value={loading ? "—" : stats.overdue}
          subtitle="Sách đã trễ hạn, cần hoàn trả sớm"
          icon={WarningAmberRoundedIcon}
          color="error"
        />
        <StatCard
          title="Đã trả hoàn tất"
          value={loading ? "—" : stats.returned}
          subtitle="Sách đã trả lại thư viện an toàn"
          icon={CheckCircleOutlineRoundedIcon}
          color="success"
        />
      </StatCardGrid>

      {/* Alerts */}
      {message && (
        <Alert
          severity="success"
          sx={{ mb: 2.5, borderRadius: 2 }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setLoading(true);
                setRefresh((value) => value + 1);
              }}
            >
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Tabs Filter Bar */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          borderColor: "divider",
          bgcolor: "background.paper",
          mb: 3,
        }}
      >
        <Tabs
          variant="scrollable"
          scrollButtons="auto"
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          aria-label="Lọc lượt mượn"
          sx={{
            px: 2,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9375rem",
              minHeight: 48,
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
          {tabs.map((tab) => (
            <Tab key={tab.label} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Danh sách lượt mượn */}
      {loading ? (
        <Box
          sx={{
            py: 8,
            textAlign: "center",
            bgcolor: "background.paper",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Đang tải dữ liệu mượn sách...
          </Typography>
        </Box>
      ) : !error && visibleLoans.length === 0 ? (
        <EmptyState
          icon={LibraryBooksRoundedIcon}
          title="Không có lượt mượn nào"
          description="Bạn không có cuốn sách nào trong danh mục lọc này."
        />
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {visibleLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              preview={preview}
              onAction={openAction}
            />
          ))}
        </Box>
      )}

      {/* Dialog Gia hạn / Trả sách */}
      <Dialog
        open={Boolean(action)}
        onClose={busy ? undefined : () => setAction(null)}
        fullWidth
        maxWidth="xs"
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
          <Typography variant="h6" sx={{ fontWeight: 750, color: "#102d62" }}>
            {action?.kind === "renew"
              ? "Gia hạn lượt mượn"
              : "Xác nhận trả sách"}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setAction(null)}
            disabled={busy}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: "#f8fafc",
                borderRadius: 2,
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 750, color: "#1e293b" }}
              >
                {action?.loan.bookTitle}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Mã mượn: #{action?.loan.id} · Tác giả: {action?.loan.bookAuthor}
              </Typography>
            </Box>

            {action?.kind === "renew" ? (
              <>
                <Alert
                  severity="info"
                  sx={{ borderRadius: 2, fontSize: "0.8125rem" }}
                >
                  Hệ thống sẽ cộng thêm số ngày gia hạn vào hạn trả hiện tại nếu
                  bạn còn lượt gia hạn hợp lệ.
                </Alert>
                <TextField
                  autoFocus
                  fullWidth
                  size="small"
                  type="number"
                  label="Số ngày gia hạn mong muốn"
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </>
            ) : (
              <Alert
                severity="warning"
                sx={{ borderRadius: 2, fontSize: "0.8125rem" }}
              >
                Sách sẽ được chuyển sang trạng thái đã hoàn tất trả sách. Hãy
                xác nhận khi bạn đã trao lại sách cho thủ thư tại quầy.
              </Alert>
            )}

            {actionError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {actionError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            disabled={busy}
            onClick={() => setAction(null)}
            sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
          >
            Hủy
          </Button>
          <Button
            disabled={busy}
            variant="contained"
            onClick={confirmAction}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
            }}
          >
            {busy ? "Đang xử lý…" : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyLoans;
