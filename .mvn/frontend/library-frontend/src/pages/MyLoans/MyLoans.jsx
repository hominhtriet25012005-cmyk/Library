import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs, TextField } from "@mui/material";
import { loansApi, loadLoanPages } from "../../api/loans.js";
import { filterLoans, renewalDays } from "./loanRules.js";
import { tabs } from "./tab.js";
import { loans as previewLoans } from "./loans.js";
import LoanCard from "./LoanCard.jsx";

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
      .then((entries) => { setLoans(entries); setError(""); })
      .catch((failure) => { if (failure.name !== "AbortError") setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
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
      if (action.kind === "renew") await loansApi.renew(action.loan.id, extensionDays);
      else await loansApi.checkin(action.loan.id);
      setMessage(action.kind === "renew" ? "Đã gia hạn. Danh sách đang được cập nhật." : "Đã trả sách. Danh sách đang được cập nhật.");
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
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Sách của tôi</h1>
        <p className="mt-2 text-slate-600">{preview ? "Bản xem thử với dữ liệu mẫu, không thay đổi khoản mượn thật." : "Theo dõi lượt mượn, thời hạn trả và lịch sử của bạn."}</p>
      </div>
      {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
      {error && <Alert severity="error" action={<Button onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>}
      <Card><Box sx={{ borderBottom: 1, borderColor: "divider" }}><Tabs variant="scrollable" scrollButtons="auto" value={activeTab}
        onChange={(_, value) => setActiveTab(value)} aria-label="Lọc lượt mượn">
        {tabs.map((tab) => <Tab key={tab.label} label={tab.label} />)}
      </Tabs></Box></Card>
      {loading ? <p role="status" className="rounded-xl bg-white p-6 text-slate-600">Đang tải lượt mượn...</p>
        : !error && visibleLoans.length === 0 ? <Alert severity="info">Không có lượt mượn trong mục này.</Alert>
          : <div className="space-y-4">{visibleLoans.map((loan) => <LoanCard key={loan.id} loan={loan} preview={preview} onAction={openAction} />)}</div>}
    </div>
    <Dialog open={Boolean(action)} onClose={busy ? undefined : () => setAction(null)} fullWidth maxWidth="xs">
      <DialogTitle>{action?.kind === "renew" ? "Gia hạn lượt mượn" : "Xác nhận trả sách"}</DialogTitle>
      <DialogContent>
        <p className="mb-4 text-slate-700">{action?.loan.bookTitle}</p>
        {action?.kind === "renew" ? <TextField autoFocus fullWidth type="number" label="Số ngày gia hạn" value={days}
          onChange={(event) => setDays(event.target.value)} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
          : <p className="text-sm text-slate-600">Sách sẽ được ghi nhận đã trả. Hãy xác nhận khi bạn thực sự trả sách.</p>}
        {actionError && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setAction(null)}>Hủy</Button>
        <Button disabled={busy} variant="contained" onClick={confirmAction}>{busy ? "Đang xử lý..." : "Xác nhận"}</Button>
      </DialogActions>
    </Dialog>
  </div>;
};

export default MyLoans;
