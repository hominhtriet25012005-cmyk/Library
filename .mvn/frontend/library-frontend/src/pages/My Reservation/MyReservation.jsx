import { useEffect, useState } from "react";
import { Alert, Box, Button, Paper, Tab, Tabs } from "@mui/material";
import AccessAlarm from "@mui/icons-material/AccessAlarmRounded";
import Book from "@mui/icons-material/BookRounded";
import CalendarToday from "@mui/icons-material/CalendarTodayRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";

import {
  reservationsApi,
  loadReservationPages,
} from "../../api/reservations.js";
import { filterReservations, reservationCounts } from "./reservationRules.js";
import { tabs } from "./tabs.jsx";
import MyReservationCard from "./MyReservationCard.jsx";
import { myReservation as previewReservations } from "./reservation.js";
import {
  PageHeader,
  StatCard,
  StatCardGrid,
  ConfirmDialog,
  EmptyState,
} from "../../components/common";

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
      .then((items) => {
        setEntries(items);
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

  const openAction = (reservation, kind) => {
    setAction({ reservation, kind });
    setActionError("");
  };

  const confirmAction = async () => {
    setBusy(true);
    setActionError("");
    try {
      await reservationsApi.cancel(action.reservation.id);
      setMessage("Đã hủy đặt giữ thành công. Danh sách đang được làm mới.");
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

  return (
    <Box
      component="section"
      aria-label="Sách đặt giữ của tôi"
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
        pb: 4,
      }}
    >
      {/* Header */}
      <PageHeader
        title="Sách đặt giữ của tôi"
        subtitle={
          preview
            ? "Bản xem thử với dữ liệu mẫu, không làm thay đổi các đặt giữ thật."
            : "Theo dõi vị trí hàng đợi và lịch hẹn nhận sách khi sách được hoàn trả tại thư viện."
        }
        icon={EventAvailableRoundedIcon}
        badge={!preview ? `${entries.length} lượt đặt giữ` : undefined}
      />

      {/* Thẻ thống kê */}
      <StatCardGrid columns={{ xs: 1, sm: 3 }} sx={{ mb: 3 }}>
        <StatCard
          title="Tổng lượt đặt giữ"
          value={loading || error ? "—" : counts.total}
          subtitle="Tất cả các lượt đăng ký xếp hàng"
          icon={Book}
          color="primary"
        />
        <StatCard
          title="Đang xếp hàng"
          value={loading || error ? "—" : counts.active}
          subtitle="Đang chờ bạn đọc khác hoàn trả sách"
          icon={HourglassTopRoundedIcon}
          color="navy"
        />
        <StatCard
          title="Sẵn sàng nhận sách"
          value={loading || error ? "—" : counts.available}
          subtitle="Sách đã về quầy, mời bạn đến mượn"
          icon={CalendarToday}
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
          borderColor: "#e2e8f0",
          bgcolor: "#fff",
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Lọc đặt giữ"
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
            <Tab
              key={tab.value}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Danh sách thẻ đặt giữ */}
      {loading ? (
        <Box
          sx={{
            py: 8,
            textAlign: "center",
            bgcolor: "#fff",
            borderRadius: 3,
            border: "1px solid #e2e8f0",
          }}
        >
          <Alert severity="info" sx={{ display: "inline-flex" }}>
            Đang tải danh sách đặt giữ...
          </Alert>
        </Box>
      ) : !error && visible.length === 0 ? (
        <EmptyState
          icon={EventAvailableRoundedIcon}
          title="Không có lượt đặt giữ nào"
          description="Hiện tại bạn không có cuốn sách nào trong danh mục lọc này."
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2.5,
          }}
        >
          {visible.map((reservation) => (
            <MyReservationCard
              key={reservation.id}
              reservation={reservation}
              preview={preview}
              onAction={openAction}
            />
          ))}
        </Box>
      )}

      {/* Modal xác nhận hủy đặt giữ */}
      <ConfirmDialog
        open={Boolean(action)}
        title={`Hủy đặt giữ "${action?.reservation.bookTitle}"?`}
        message="Bạn sẽ rời khỏi hàng đợi nhận cuốn sách này và không thể khôi phục thứ hạng hiện tại. Bạn có chắc chắn muốn hủy không?"
        confirmLabel="Xác nhận hủy"
        cancelLabel="Giữ lại"
        variant="danger"
        loading={busy}
        error={actionError}
        onConfirm={confirmAction}
        onCancel={() => {
          if (!busy) setAction(null);
        }}
      />
    </Box>
  );
};

export default MyReservation;
