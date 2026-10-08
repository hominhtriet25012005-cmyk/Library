import React from "react";
import StatesCard from "./StatesCard";
import { Alert, Box, Button, Tabs, Tab } from "@mui/material";
import { statsConfig } from "./StateConfig";
import CurrentLoans from "./CurrentLoans";
import Reservation from "./Reservation";
import ReadingHistory from "./ReadingHistory";
import Recommandation from "./Recommandation";
import { loans } from "../MyLoans/loans";
import { myReservation } from "../My Reservation/reservation";
import { loansApi, loadLoanPages } from "../../api/loans.js";
import { reservationsApi, loadReservationPages } from "../../api/reservations.js";
import { finesApi } from "../../api/fines.js";

const Dashboard = ({ preview = false }) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [realLoans, setRealLoans] = React.useState(null);
  const [error, setError] = React.useState("");
  const [refresh, setRefresh] = React.useState(0);
  const [realReservations, setRealReservations] = React.useState(null);
  const [reservationError, setReservationError] = React.useState("");
  const [reservationRefresh, setReservationRefresh] = React.useState(0);
  const [realFines, setRealFines] = React.useState(null);
  const [fineError, setFineError] = React.useState("");
  const [fineRefresh, setFineRefresh] = React.useState(0);

  React.useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    loadLoanPages(loansApi.list, { signal: controller.signal })
      .then((entries) => { setRealLoans(entries); setError(""); })
      .catch((failure) => { if (failure.name !== "AbortError") setError(failure.message); });
    return () => controller.abort();
  }, [preview, refresh]);

  React.useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    loadReservationPages(reservationsApi.list, { signal: controller.signal })
      .then((entries) => { if (!controller.signal.aborted) { setRealReservations(entries); setReservationError(""); } })
      .catch((failure) => { if (!controller.signal.aborted && failure.name !== "AbortError") setReservationError(failure.message); });
    return () => controller.abort();
  }, [preview, reservationRefresh]);

  React.useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    finesApi.mine({}, { signal: controller.signal })
      .then((entries) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(entries)) throw new Error("Dữ liệu tiền phạt không hợp lệ.");
        setRealFines(entries);
        setFineError("");
      })
      .catch((failure) => {
        if (controller.signal.aborted || failure.name === "AbortError") return;
        setRealFines(null);
        setFineError(failure.message || "Không thể tải tiền phạt.");
      });
    return () => controller.abort();
  }, [preview, fineRefresh]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const stateData = statsConfig({
    myLoans: preview ? loans : realLoans,
    reservations: preview ? myReservation : realReservations,
    fines: preview ? null : realFines,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 py-8">
      <div className=" px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-blue-700 mb-2">
            <span className="bg-gradient-to-r from-blue-700 to-sky-700 bg-clip-text text-transparent">
              Tổng quan của tôi
            </span>
          </h1>

          <p className="text-lg text-gray-600">
            {preview ? "Bản xem thử với dữ liệu mẫu." : "Theo dõi sách đang mượn của bạn từ dữ liệu hệ thống."}
          </p>
        </div>

        {error && <Alert severity="error" sx={{ mb: 3 }} action={<Button onClick={() => setRefresh((value) => value + 1)}>Thử lại</Button>}>{error}</Alert>}
        {reservationError && <Alert severity="error" sx={{ mb: 3 }} action={<Button onClick={() => setReservationRefresh((value) => value + 1)}>Thử lại</Button>}>Không tải được đặt giữ: {reservationError}</Alert>}
        {fineError && <Alert severity="error" sx={{ mb: 3 }} action={<Button onClick={() => setFineRefresh((value) => value + 1)}>Thử lại</Button>}>Không tải được tiền phạt: {fineError}</Alert>}

        {/* state card */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stateData.map((item, index) => (
            <StatesCard
              bgColor={item.bgColor}
              textColor={item.textColor}
              icon={item.icon}
              value={item.value}
              title={item.title}
              subtitle={item.subtitle}
              key={index}
            />
          ))}
        </div>

        {/* tab section */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              variant="scrollable"
              scrollButtons="auto"
              value={activeTab}
              onChange={handleTabChange}
              aria-label="Các mục tổng quan"
            >
              <Tab label="Sách đang mượn" />
              <Tab label="Sách đặt giữ" />
              <Tab label="Lịch sử đọc" />
              <Tab label="Gợi ý sách" />
            </Tabs>
          </Box>

          {/* current loans tab */}
          {activeTab === 0 && (preview || realLoans ? <CurrentLoans loans={preview ? loans : realLoans} preview={preview} /> : !error && <p role="status" className="p-6 text-slate-600">Đang tải lượt mượn...</p>)}
          {/* Reservations Tab */}
          {activeTab === 1 && (preview || realReservations ? <Reservation entries={preview ? myReservation : realReservations} preview={preview} /> : !reservationError && <p role="status" className="p-6 text-slate-600">Đang tải đặt giữ...</p>)}

          {/* Reading History Tab */}
          {activeTab === 2 && <ReadingHistory />}

          {/* Recommendations Tab */}
          {activeTab === 3 && <Recommandation />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
