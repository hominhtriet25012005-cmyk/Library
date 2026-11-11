import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
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
      aria-label="Sách đặt giữ "
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
        pb: 4,
      }}
    >
      {/* Header */}
      <PageHeader
        title="Sách đặt giữ "
        subtitle={
          preview
            ? "Bản xem thử với dữ liệu mẫu, không làm thay đổi các đặt giữ thật."
            : "Theo dõi vị trí hàng đợi và lịch hẹn nhận sách khi sách được hoàn trả tại thư viện."
        }
        icon={EventAvailableRoundedIcon}
        badge={!preview ? `${entries.length} lượt đặt giữ` : undefined}
      />

      {/* Thẻ thống kê */}
      <StatCardGrid columns={{ xs: 1, sm: 3 }} sx={{ mb: 2.5 }}>
        <StatCard
          title="Tổng lượt đặt giữ"
          value={loading || error ? "—" : counts.total}
          icon={Book}
          color="primary"
          onClick={() => setActiveTab(0)}
        />
        <StatCard
          title="Đang xếp hàng"
          value={
            loading || error
              ? "—"
              : Math.max(0, counts.active - counts.available)
          }
          icon={HourglassTopRoundedIcon}
          color="navy"
          onClick={() => setActiveTab(1)}
        />
        <StatCard
          title="Sẵn sàng nhận sách"
          value={loading || error ? "—" : counts.available}
          icon={CalendarToday}
          color="success"
          onClick={() => setActiveTab(2)}
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

      {/* Thanh 3 Tab lọc trạng thái liền mạch, đồng bộ với 3 thẻ ở trên */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: "divider",
          bgcolor: "background.paper",
          mb: 3,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="fullWidth"
          aria-label="Lọc đặt giữ"
          sx={{
            minHeight: 52,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "0.85rem", sm: "0.9375rem" },
              minHeight: 52,
              py: 1.5,
              color: "text.secondary",
              transition: "all 0.2s ease",
              "&:not(:last-of-type)": {
                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
              },
              "&.Mui-selected": {
                color: "primary.main",
                fontWeight: 700,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(23, 105, 255, 0.08)"
                    : "rgba(23, 105, 255, 0.04)",
              },
              "&:hover": {
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.02)",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
              height: 3,
            },
          }}
        >
          {tabs.map((tab, idx) => {
            const count =
              tab.value === "all"
                ? counts.total
                : tab.value === "pending"
                  ? Math.max(0, counts.active - counts.available)
                  : counts.available;
            return (
              <Tab
                key={tab.value}
                icon={tab.icon}
                iconPosition="start"
                label={
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <span>{tab.label}</span>
                    <Box
                      component="span"
                      sx={{
                        px: 0.9,
                        py: 0.15,
                        borderRadius: "10px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        bgcolor:
                          activeTab === idx
                            ? "primary.main"
                            : (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(255, 255, 255, 0.08)"
                                  : "#e2e8f0",
                        color: activeTab === idx ? "#ffffff" : "text.secondary",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {count}
                    </Box>
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      </Paper>

      {/* Danh sách thẻ đặt giữ */}
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
