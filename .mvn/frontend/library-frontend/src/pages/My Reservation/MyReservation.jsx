import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs } from "@mui/material";
import AccessAlarm from "@mui/icons-material/AccessAlarmRounded";
import Book from "@mui/icons-material/BookRounded";
import CalendarToday from "@mui/icons-material/CalendarTodayRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import { reservationsApi, loadReservationPages } from "../../api/reservations.js";
import { filterReservations, reservationCounts } from "./reservationRules.js";
import { tabs } from "./tabs.jsx";
import MyReservationCard from "./MyReservationCard.jsx";
import { myReservation as previewReservations } from "./reservation.js";

const MyReservation = ({ preview = false }) => {
  const [entries, setEntries] = useState(preview ? previewReservations : []);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [action, setAction] = useState(null);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    loadReservationPages(reservationsApi.list, { signal: controller.signal })
      .then((items) => { setEntries(items); setError(""); })
      .catch((failure) => { if (failure.name !== "AbortError") setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [preview, refresh]);

  const openAction = (reservation, kind) => {
    setAction({ reservation, kind });
    setActionError("");
  };

  const confirmAction = async () => {
    setBusy(true);
    setActionError("");
    try {
      await reservationsApi.cancel(action.reservation.id);
      setMessage("Đã hủy đặt giữ. Danh sách đang được cập nhật.");
      setAction(null);
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const counts = reservationCounts(entries);
  const visible = filterReservations(entries, tabs[activeTab].value);
  const summaries = [
    { title: "Tổng lượt đặt giữ", value: counts.total, icon: <Book /> },
    { title: "Đang xử lý", value: counts.active, icon: <AccessAlarm /> },
    { title: "Sẵn sàng nhận", value: counts.available, icon: <CalendarToday /> },
  ];

  return <div className="min-h-screen bg-blue-50 px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900"><MenuBookRoundedIcon sx={{ color: "#1769ff", fontSize: 38 }} />Sách đặt giữ của tôi</h1>
        <p className="mt-2 text-slate-600">{preview ? "Bản xem thử với dữ liệu mẫu, không thay đổi đặt giữ thật." : "Theo dõi hàng đợi và thời hạn nhận sách. Khi đến lượt, ADMIN sẽ xác nhận giao sách tại thư viện."}</p>
      </div>
      {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
      {error && <Alert severity="error" action={<Button onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-3">{summaries.map((item) => <Card key={item.title} sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><p className="text-sm text-slate-600">{item.title}</p><p className="mt-1 text-3xl font-bold text-slate-900">{loading || error ? "—" : item.value}</p></div>
        <span className="rounded-xl bg-blue-100 p-3 text-blue-700">{item.icon}</span>
      </Card>)}</div>
      <Card><Box sx={{ borderBottom: 1, borderColor: "divider" }}><Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable" scrollButtons="auto" aria-label="Lọc đặt giữ">
        {tabs.map((tab) => <Tab key={tab.value} icon={tab.icon} iconPosition="start" label={tab.label} />)}
      </Tabs></Box></Card>
      {loading ? <p role="status" className="rounded-xl bg-white p-6 text-slate-600">Đang tải đặt giữ...</p>
        : !error && visible.length === 0 ? <Alert severity="info">Không có lượt đặt giữ trong mục này.</Alert>
          : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((reservation) => <MyReservationCard key={reservation.id} reservation={reservation} preview={preview} onAction={openAction} />)}</div>}
    </div>
    <Dialog open={Boolean(action)} onClose={busy ? undefined : () => setAction(null)} fullWidth maxWidth="xs">
      <DialogTitle>Hủy đặt giữ?</DialogTitle>
      <DialogContent>
        <p className="text-slate-700">{action?.reservation.bookTitle}</p>
        <p className="mt-3 text-sm text-slate-600">Bạn sẽ rời hàng đợi; không thể khôi phục vị trí này.</p>
        {actionError && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setAction(null)}>Đóng</Button>
        <Button disabled={busy} variant="contained" color="error" onClick={confirmAction}>{busy ? "Đang xử lý..." : "Xác nhận"}</Button>
      </DialogActions>
    </Dialog>
  </div>;
};

export default MyReservation;
