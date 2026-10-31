import React from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import RecommendRoundedIcon from "@mui/icons-material/RecommendRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";

import CurrentLoans from "./CurrentLoans";
import Reservation from "./Reservation";
import ReadingHistory from "./ReadingHistory";
import Recommandation from "./Recommandation";
import { loans } from "../MyLoans/loans";
import { myReservation } from "../My Reservation/reservation";
import { loansApi, loadLoanPages } from "../../api/loans.js";
import {
  reservationsApi,
  loadReservationPages,
} from "../../api/reservations.js";
import { finesApi } from "../../api/fines.js";
import { effectiveLoanStatus } from "../MyLoans/loanRules.js";
import { fineSummary } from "../Fines/fineRules.js";
import { PageHeader, StatCard, StatCardGrid } from "../../components/common";
import { formatCurrencyVND } from "../../utils/formatters";

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
      .then((entries) => {
        setRealLoans(entries);
        setError("");
      })
      .catch((failure) => {
        if (failure.name !== "AbortError") setError(failure.message);
      });
    return () => controller.abort();
  }, [preview, refresh]);

  React.useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    loadReservationPages(reservationsApi.list, { signal: controller.signal })
      .then((entries) => {
        if (!controller.signal.aborted) {
          setRealReservations(entries);
          setReservationError("");
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted && failure.name !== "AbortError")
          setReservationError(failure.message);
      });
    return () => controller.abort();
  }, [preview, reservationRefresh]);

  React.useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    finesApi
      .mine({}, { signal: controller.signal })
      .then((entries) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(entries))
          throw new Error("Dữ liệu tiền phạt không hợp lệ.");
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

  const myLoansData = preview ? loans : realLoans;
  const myReservationsData = preview ? myReservation : realReservations;
  const finesData = preview ? null : realFines;

  // Tính toán số liệu thống kê an toàn
  const activeLoansCount = Array.isArray(myLoansData)
    ? myLoansData.filter((loan) =>
        ["CHECKED_OUT", "OVERDUE"].includes(effectiveLoanStatus(loan)),
      ).length
    : "—";

  const activeReservationsCount = Array.isArray(myReservationsData)
    ? myReservationsData.filter((r) =>
        ["PENDING", "AVAILABLE"].includes(r?.status),
      ).length
    : "—";

  const outstandingFines = Array.isArray(finesData)
    ? fineSummary(finesData).outstanding
    : 0;

  return (
    <Box
      component="section"
      aria-label="Tổng quan bạn đọc"
      sx={{
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
      }}
    >
      {/* Header */}
      <PageHeader
        title="Tổng quan bạn đọc"
        subtitle={
          preview
            ? "Bản xem trước giao diện độc giả với dữ liệu mẫu trực quan."
            : "Theo dõi tình hình mượn sách, lịch hẹn nhận sách và công nợ tài khoản."
        }
        icon={AutoStoriesRoundedIcon}
        action={{
          label: "Khám phá sách",
          icon: ExploreRoundedIcon,
          to: preview ? "/demo/books" : "/user/books",
        }}
      />

      {/* Thông báo lỗi nếu có */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setRefresh((v) => v + 1)}
            >
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {reservationError && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setReservationRefresh((v) => v + 1)}
            >
              Thử lại
            </Button>
          }
        >
          Không tải được đặt giữ: {reservationError}
        </Alert>
      )}
      {fineError && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setFineRefresh((v) => v + 1)}
            >
              Thử lại
            </Button>
          }
        >
          Không tải được tiền phạt: {fineError}
        </Alert>
      )}

      {/* Thẻ thống kê */}
      <StatCardGrid columns={{ xs: 1, sm: 2, lg: 3 }} sx={{ mb: 3.5 }}>
        <StatCard
          title="Sách đang mượn"
          value={activeLoansCount}
          subtitle="Số cuốn sách bạn đang giữ"
          icon={AutoStoriesRoundedIcon}
          color="primary"
        />
        <StatCard
          title="Sách đặt giữ"
          value={activeReservationsCount}
          subtitle="Lượt xếp hàng chờ nhận sách"
          icon={EventAvailableRoundedIcon}
          color="navy"
        />
        <StatCard
          title="Tiền phạt còn nợ"
          value={
            !Array.isArray(finesData) && !preview
              ? "—"
              : formatCurrencyVND(outstandingFines)
          }
          subtitle={
            !Array.isArray(finesData)
              ? "Chưa có thông tin"
              : `${fineSummary(finesData).payable} khoản cần thanh toán`
          }
          icon={ReceiptLongRoundedIcon}
          color={outstandingFines > 0 ? "error" : "success"}
        />
      </StatCardGrid>

      {/* Tabs nội dung chính */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}
      >
        <Box
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "#17243a" : "#f8fafc",
            px: 2,
          }}
        >
          <Tabs
            variant="scrollable"
            scrollButtons="auto"
            value={activeTab}
            onChange={handleTabChange}
            aria-label="Các mục tổng quan bạn đọc"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9375rem",
                minHeight: 52,
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
            <Tab
              label="Sách đang mượn"
              icon={<AutoStoriesRoundedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
            <Tab
              label="Sách đặt giữ"
              icon={<EventAvailableRoundedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
            <Tab
              label="Lịch sử đọc"
              icon={<HistoryRoundedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
            <Tab
              label="Gợi ý sách"
              icon={<RecommendRoundedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Nội dung từng Tab */}
        {activeTab === 0 &&
          (preview || realLoans ? (
            <CurrentLoans
              loans={preview ? loans : realLoans}
              preview={preview}
            />
          ) : (
            !error && (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Đang tải danh sách sách mượn...
                </Typography>
              </Box>
            )
          ))}

        {activeTab === 1 &&
          (preview || realReservations ? (
            <Reservation
              entries={preview ? myReservation : realReservations}
              preview={preview}
            />
          ) : (
            !reservationError && (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Đang tải danh sách đặt giữ...
                </Typography>
              </Box>
            )
          ))}

        {activeTab === 2 && (
          <ReadingHistory
            loans={preview ? loans : realLoans}
            preview={preview}
          />
        )}

        {activeTab === 3 && <Recommandation preview={preview} />}
      </Paper>
    </Box>
  );
};

export default Dashboard;
