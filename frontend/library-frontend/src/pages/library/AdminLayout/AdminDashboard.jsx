import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import LocalLibraryRoundedIcon from "@mui/icons-material/LocalLibraryRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import PieChartRoundedIcon from "@mui/icons-material/PieChartRounded";

import { adminDashboardApi } from "../../../api/adminDashboard";
import { adminLoansApi } from "../../../api/adminLoans";
import { adminReservationsApi } from "../../../api/adminReservations";
import { adminUsersApi } from "../../../api/adminUsers";
import { adminFinanceApi } from "../../../api/adminFinance";
import { adminMembershipApi } from "../../../api/adminMembership";
import { adminReviewsApi } from "../../../api/adminReviews";
import {
  PageHeader,
  StatCard,
  StatCardGrid,
  StatusChip,
} from "../../../components/common";
import {
  formatCurrencyVND,
  formatDateTimeVN,
  formatDateVN,
} from "../../../utils/formatters";

const paymentTypeLabels = {
  FINE: "Đóng tiền phạt",
  MEMBERSHIP: "Gói thành viên",
};

const AdminDashboard = () => {
  const [reload, setReload] = useState(0);
  const [activityTab, setActivityTab] = useState("loans");

  // 1. Thống kê sách & mượn trả cốt lõi
  const [bookState, setBookState] = useState({
    loading: true,
    data: null,
    error: "",
  });
  const [loanSummaryState, setLoanSummaryState] = useState({
    loading: true,
    data: null,
    error: "",
  });

  // 2. Chi tiết cơ cấu lượt mượn & danh sách mượn gần đây
  const [loanDetails, setLoanDetails] = useState({
    loading: true,
    checkedOutCount: 0,
    returnedCount: 0,
    damagedOrLostCount: 0,
    recentLoans: [],
  });

  // 3. Người dùng
  const [userState, setUserState] = useState({
    loading: true,
    totalUsers: 0,
    readerCount: 0,
    adminCount: 0,
  });

  // 4. Doanh thu & Giao dịch gần đây
  const [revenueState, setRevenueState] = useState({
    loading: true,
    totalRevenue: 0,
    successCount: 0,
    recentPayments: [],
  });

  // 5. Hàng 2: Gói thành viên hoạt động, Đặt giữ chờ xử lý, Tổng đánh giá
  const [secondaryStats, setSecondaryStats] = useState({
    loading: true,
    activeMemberships: 0,
    pendingReservations: 0,
    readyReservations: 0,
    recentReservations: [],
    totalReviews: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // Tải thống kê sách
    adminDashboardApi
      .bookStats({ signal })
      .then((data) => {
        if (!signal.aborted) setBookState({ loading: false, data, error: "" });
      })
      .catch((error) => {
        if (!signal.aborted && error.name !== "AbortError") {
          setBookState({
            loading: false,
            data: null,
            error: error.message || "Không thể tải thống kê sách.",
          });
        }
      });

    // Tải tổng lượt mượn & quá hạn
    adminDashboardApi
      .loanSummary({ signal })
      .then((data) => {
        if (!signal.aborted)
          setLoanSummaryState({ loading: false, data, error: "" });
      })
      .catch((error) => {
        if (!signal.aborted && error.name !== "AbortError") {
          setLoanSummaryState({
            loading: false,
            data: null,
            error: error.message || "Không thể tải thống kê mượn sách.",
          });
        }
      });

    // Tải cơ cấu lượt mượn & 5 lượt mượn mới nhất
    Promise.allSettled([
      adminLoansApi.search({ page: 0, size: 5, mode: "all" }, { signal }),
      adminLoansApi.search(
        { page: 0, size: 1, mode: "status", value: "CHECKED_OUT" },
        { signal },
      ),
      adminLoansApi.search(
        { page: 0, size: 1, mode: "status", value: "RETURNED" },
        { signal },
      ),
      adminLoansApi.search(
        { page: 0, size: 1, mode: "status", value: "DAMAGED" },
        { signal },
      ),
      adminLoansApi.search(
        { page: 0, size: 1, mode: "status", value: "LOST" },
        { signal },
      ),
    ]).then((results) => {
      if (signal.aborted) return;
      const [recentRes, checkedOutRes, returnedRes, damagedRes, lostRes] =
        results;

      const recentPage =
        recentRes.status === "fulfilled" ? recentRes.value : null;
      const checkedOutPage =
        checkedOutRes.status === "fulfilled" ? checkedOutRes.value : null;
      const returnedPage =
        returnedRes.status === "fulfilled" ? returnedRes.value : null;
      const damagedPage =
        damagedRes.status === "fulfilled" ? damagedRes.value : null;
      const lostPage = lostRes.status === "fulfilled" ? lostRes.value : null;

      setLoanDetails({
        loading: false,
        checkedOutCount: checkedOutPage?.totalElements ?? 0,
        returnedCount: returnedPage?.totalElements ?? 0,
        damagedOrLostCount:
          (damagedPage?.totalElements ?? 0) + (lostPage?.totalElements ?? 0),
        recentLoans: recentPage?.content ?? [],
      });
    });

    // Tải thống kê người dùng
    adminUsersApi
      .list({ signal })
      .then((users) => {
        if (signal.aborted) return;
        const readers = users.filter((u) => u.role === "ROLE_USER").length;
        const admins = users.filter((u) => u.role === "ROLE_ADMIN").length;
        setUserState({
          loading: false,
          totalUsers: users.length,
          readerCount: readers,
          adminCount: admins,
        });
      })
      .catch(() => {
        if (!signal.aborted)
          setUserState({
            loading: false,
            totalUsers: 0,
            readerCount: 0,
            adminCount: 0,
          });
      });

    // Tải doanh thu & giao dịch gần đây
    adminFinanceApi
      .payments(
        { page: 0, size: 100, sortBy: "createdAt", sortDir: "DESC" },
        { signal },
      )
      .then(async (firstPage) => {
        if (signal.aborted) return;
        let allPayments = [...(firstPage?.content ?? [])];
        const totalPages = Math.min(firstPage?.totalPages ?? 1, 5);
        if (totalPages > 1) {
          const restPages = await Promise.allSettled(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              adminFinanceApi.payments(
                {
                  page: i + 1,
                  size: 100,
                  sortBy: "createdAt",
                  sortDir: "DESC",
                },
                { signal },
              ),
            ),
          );
          restPages.forEach((res) => {
            if (res.status === "fulfilled" && res.value?.content) {
              allPayments = allPayments.concat(res.value.content);
            }
          });
        }
        if (signal.aborted) return;
        const successPayments = allPayments.filter(
          (p) => p.status === "SUCCESS",
        );
        const sumRevenue = successPayments.reduce(
          (sum, p) => sum + (Number(p.amount) || 0),
          0,
        );
        setRevenueState({
          loading: false,
          totalRevenue: sumRevenue,
          successCount: successPayments.length,
          recentPayments: (firstPage?.content ?? []).slice(0, 5),
        });
      })
      .catch(() => {
        if (!signal.aborted) {
          setRevenueState({
            loading: false,
            totalRevenue: 0,
            successCount: 0,
            recentPayments: [],
          });
        }
      });

    // Tải Hàng 2: Gói đăng ký đang hoạt động, Yêu cầu đặt trước chờ xử lý, Tổng số đánh giá
    Promise.allSettled([
      adminMembershipApi.members(
        { page: 0, size: 1, active: "true" },
        { signal },
      ),
      adminReservationsApi.search(
        { page: 0, size: 5, activeOnly: true },
        { signal },
      ),
      adminReservationsApi.search(
        { page: 0, size: 1, status: "AVAILABLE" },
        { signal },
      ),
      adminReviewsApi.search({ page: 0, size: 1, active: "ALL" }, { signal }),
    ]).then(([membersRes, activeResvRes, readyResvRes, reviewsRes]) => {
      if (signal.aborted) return;
      const membersPage =
        membersRes.status === "fulfilled" ? membersRes.value : null;
      const activeResvPage =
        activeResvRes.status === "fulfilled" ? activeResvRes.value : null;
      const readyResvPage =
        readyResvRes.status === "fulfilled" ? readyResvRes.value : null;
      const reviewsPage =
        reviewsRes.status === "fulfilled" ? reviewsRes.value : null;

      setSecondaryStats({
        loading: false,
        activeMemberships: membersPage?.totalElements ?? 0,
        pendingReservations: activeResvPage?.totalElements ?? 0,
        readyReservations: readyResvPage?.totalElements ?? 0,
        recentReservations: activeResvPage?.content ?? [],
        totalReviews: reviewsPage?.totalElements ?? 0,
      });
    });

    return () => controller.abort();
  }, [reload]);

  const handleRefresh = () => {
    setBookState({ loading: true, data: null, error: "" });
    setLoanSummaryState({ loading: true, data: null, error: "" });
    setLoanDetails((prev) => ({ ...prev, loading: true }));
    setUserState((prev) => ({ ...prev, loading: true }));
    setRevenueState((prev) => ({ ...prev, loading: true }));
    setSecondaryStats((prev) => ({ ...prev, loading: true }));
    setReload((value) => value + 1);
  };

  const totalActive = bookState.data?.totalActiveBooks ?? 0;
  const totalAvailable = bookState.data?.totalAvailableBooks ?? 0;
  const availabilityRate =
    totalActive > 0 ? Math.round((totalAvailable / totalActive) * 100) : 0;

  const totalLoans = loanSummaryState.data?.totalLoans ?? 0;
  const overdueLoans = loanSummaryState.data?.overdueLoans ?? 0;

  // Cơ cấu trạng thái mượn sách
  const loanBreakdown = useMemo(() => {
    const total = Math.max(
      1,
      totalLoans ||
        loanDetails.checkedOutCount +
          loanDetails.returnedCount +
          overdueLoans +
          loanDetails.damagedOrLostCount,
    );
    return [
      {
        key: "CHECKED_OUT",
        label: "Đang mượn",
        count: loanDetails.checkedOutCount,
        percent:
          totalLoans > 0
            ? Math.round((loanDetails.checkedOutCount / total) * 100)
            : 0,
        color: "#315B4C",
      },
      {
        key: "RETURNED",
        label: "Đã hoàn trả",
        count: loanDetails.returnedCount,
        percent:
          totalLoans > 0
            ? Math.round((loanDetails.returnedCount / total) * 100)
            : 0,
        color: "#16a34a",
      },
      {
        key: "OVERDUE",
        label: "Đang quá hạn",
        count: overdueLoans,
        percent: totalLoans > 0 ? Math.round((overdueLoans / total) * 100) : 0,
        color: "#dc2626",
      },
      {
        key: "INCIDENT",
        label: "Hư hỏng / Báo mất",
        count: loanDetails.damagedOrLostCount,
        percent:
          totalLoans > 0
            ? Math.round((loanDetails.damagedOrLostCount / total) * 100)
            : 0,
        color: "#d97706",
      },
    ];
  }, [totalLoans, overdueLoans, loanDetails]);

  return (
    <Box
      component="section"
      aria-label="Trang chủ quản trị"
      sx={{ maxWidth: 1320, mx: "auto", py: { xs: 2.5, sm: 3.5 } }}
    >
      <PageHeader title="Tổng quan thư viện" />

      {bookState.error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Thử lại
            </Button>
          }
        >
          Không thể tải thống kê sách: {bookState.error}
        </Alert>
      )}

      {loanSummaryState.error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Thử lại
            </Button>
          }
        >
          Không thể tải thống kê mượn sách: {loanSummaryState.error}
        </Alert>
      )}

      {/* HÀNG 1: 4 THẺ THỐNG KÊ CỐT LÕI (Tổng số đầu sách · Tổng lượt mượn · Tổng người dùng · Tổng doanh thu)*/}
      <StatCardGrid columns={4} sx={{ mb: 2.5 }}>
        <StatCard
          title="Tổng số sách"
          value={
            bookState.data?.totalActiveBooks?.toLocaleString("vi-VN") ?? null
          }
          icon={<AutoStoriesRoundedIcon />}
          color="#315B4C"
          loading={bookState.loading}
        />
        <StatCard
          title="Tổng lượt mượn"
          value={
            loanSummaryState.data?.totalLoans?.toLocaleString("vi-VN") ?? null
          }
          icon={<LocalLibraryRoundedIcon />}
          color="#0284c7"
          loading={loanSummaryState.loading}
        />
        <StatCard
          title="Tổng số người dùng"
          value={userState.totalUsers.toLocaleString("vi-VN")}
          icon={<PeopleRoundedIcon />}
          color="#A98247"
          loading={userState.loading}
        />
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrencyVND(revenueState.totalRevenue)}
          icon={<PaymentsRoundedIcon />}
          color="#16a34a"
          loading={revenueState.loading}
        />
      </StatCardGrid>

      {/* =====================================================================
          HÀNG 2: 3 THẺ THỐNG KÊ NGHIỆP VỤ HOẠT ĐỘNG
          (Gói thành viên đang hoạt động · Đặt giữ sách chờ xử lý · Tổng lượt đánh giá)
      ===================================================================== */}
      <StatCardGrid columns={3} sx={{ mb: 3 }}>
        <StatCard
          title="Gói thành viên đang hoạt động"
          value={secondaryStats.activeMemberships.toLocaleString("vi-VN")}
          icon={<WorkspacePremiumRoundedIcon />}
          color="#315B4C"
          loading={secondaryStats.loading}
        />
        <StatCard
          title="Đặt giữ sách chờ xử lý"
          value={secondaryStats.pendingReservations.toLocaleString("vi-VN")}
          icon={<EventAvailableRoundedIcon />}
          color="#d97706"
          loading={secondaryStats.loading}
        />
        <StatCard
          title="Tổng lượt đánh giá sách"
          value={secondaryStats.totalReviews.toLocaleString("vi-VN")}
          icon={<RateReviewRoundedIcon />}
          color="#A98247"
          loading={secondaryStats.loading}
        />
      </StatCardGrid>

      {/* =====================================================================
          HÀNG 3: 2 KHỐI TRỰC QUAN
          (Khối trái 5/12: Tỷ lệ & Cơ cấu Lưu thông · Khối phải 7/12: Bảng Hoạt động Gần đây)
      ===================================================================== */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "5fr 7fr" },
          gap: 3,
        }}
      >
        {/* KHỐI TRÁI (5/12): Tỷ lệ & Cơ cấu Lưu thông */}
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            bgcolor: "background.paper",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2.5 }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: "#EBF1EE",
                    color: "#315B4C",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <PieChartRoundedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 750,
                      color: "text.primary",
                      lineHeight: 1.2,
                    }}
                  >
                    Tỷ lệ & Cơ cấu Lưu thông
                  </Typography>
                </Box>
              </Stack>
              <Chip
                label={`${totalLoans} lượt`}
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor: "#EBF1EE",
                  color: "#315B4C",
                }}
              />
            </Stack>

            {loanDetails.loading || loanSummaryState.loading ? (
              <Stack spacing={2} sx={{ my: 2 }}>
                <Skeleton variant="rounded" height={20} />
                <Skeleton variant="rounded" height={140} />
              </Stack>
            ) : (
              <>
                {/* Thanh tỷ lệ tổng hợp */}
                <Box
                  sx={{
                    display: "flex",
                    height: 12,
                    borderRadius: 6,
                    overflow: "hidden",
                    bgcolor: "action.hover",
                    mb: 2.5,
                  }}
                >
                  {loanBreakdown.map((item) =>
                    item.count > 0 ? (
                      <Box
                        key={item.key}
                        sx={{
                          width: `${Math.max(4, item.percent)}%`,
                          bgcolor: item.color,
                          transition: "width 0.3s ease",
                        }}
                        title={`${item.label}: ${item.count} (${item.percent}%)`}
                      />
                    ) : null,
                  )}
                </Box>

                {/* Lưới 2x2 chỉ số trạng thái mượn */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1.5,
                    mb: 2.5,
                  }}
                >
                  {loanBreakdown.map((item) => (
                    <Box
                      key={item.key}
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.default",
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 9,
                            height: 9,
                            borderRadius: "50%",
                            bgcolor: item.color,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ fontWeight: 600 }}
                        >
                          {item.label}
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="baseline"
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            color: "text.primary",
                            lineHeight: 1.2,
                          }}
                        >
                          {item.count.toLocaleString("vi-VN")}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, color: item.color }}
                        >
                          {item.percent}%
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>

          {/* Khối Tỷ lệ sách sẵn sàng phục vụ */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: "#EBF1EE",
              border: "1px solid rgba(49, 91, 76, 0.16)",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#1b2e27" }}
                >
                  Tỷ lệ sách sẵn sàng phục vụ
                </Typography>
                <Typography variant="caption" sx={{ color: "#315B4C" }}>
                  {totalAvailable} trên {totalActive} đầu sách hiện có bản sẵn
                  tại kệ
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: "#315B4C" }}
              >
                {availabilityRate}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={availabilityRate}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "rgba(49, 91, 76, 0.15)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  bgcolor: availabilityRate > 50 ? "#315B4C" : "#d97706",
                },
              }}
            />
          </Box>
        </Paper>

        {/* KHỐI PHẢI (7/12): Bảng Hoạt động Gần đây (Gộp 1 bảng có Tab chuyển nhanh) */}
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            bgcolor: "background.paper",
            borderColor: "divider",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 2.5 }, pb: 0 }}>
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 750,
                  color: "text.primary",
                  lineHeight: 1.2,
                }}
              >
                Hoạt động Nghiệp vụ Gần đây
              </Typography>
            </Box>

            <Tabs
              value={activityTab}
              onChange={(_, val) => setActivityTab(val)}
              sx={{
                minHeight: 42,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  minHeight: 42,
                  py: 0.75,
                  px: 2,
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#A98247",
                  height: 3,
                },
              }}
            >
              <Tab
                value="loans"
                label={`Mượn – Trả mới nhất (${loanDetails.recentLoans.length})`}
              />
              <Tab
                value="reservations"
                label={`Đặt giữ chờ xử lý (${secondaryStats.pendingReservations})`}
              />
              <Tab
                value="payments"
                label={`Giao dịch gần đây (${revenueState.recentPayments.length})`}
              />
            </Tabs>
          </Box>

          <Divider />

          <TableContainer sx={{ flex: 1 }}>
            {/* TAB 1: MƯỢN - TRẢ MỚI NHẤT */}
            {activityTab === "loans" && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Độc giả</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Đầu sách</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hạn trả</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Trạng thái
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loanDetails.loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={26} />
                      </TableCell>
                    </TableRow>
                  ) : loanDetails.recentLoans.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{ py: 6, color: "text.secondary" }}
                      >
                        Chưa có dữ liệu lượt mượn sách.
                      </TableCell>
                    </TableRow>
                  ) : (
                    loanDetails.recentLoans.map((loan) => (
                      <TableRow key={loan.id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: "text.primary" }}
                          >
                            {loan.userName || `Độc giả #${loan.userId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{loan.id} · Mượn: {formatDateVN(loan.checkoutDate)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 230 }}>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            {loan.bookTitle || `Sách #${loan.bookId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ISBN: {loan.bookIsbn || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: loan.status === "OVERDUE" ? 700 : 500,
                              color:
                                loan.status === "OVERDUE"
                                  ? "error.main"
                                  : "text.secondary",
                              fontSize: "0.8125rem",
                            }}
                          >
                            {formatDateVN(loan.dueDate)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <StatusChip status={loan.status} type="loan" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* TAB 2: ĐẶT GIỮ CHỜ XỬ LÝ */}
            {activityTab === "reservations" && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Độc giả</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Sách đặt trước
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Hàng đợi
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Trạng thái
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {secondaryStats.loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={26} />
                      </TableCell>
                    </TableRow>
                  ) : secondaryStats.recentReservations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{ py: 6, color: "text.secondary" }}
                      >
                        Hiện không có yêu cầu đặt giữ nào đang chờ xử lý.
                      </TableCell>
                    </TableRow>
                  ) : (
                    secondaryStats.recentReservations.map((res) => (
                      <TableRow key={res.id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: "text.primary" }}
                          >
                            {res.userName || `Độc giả #${res.userId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{res.id} · {formatDateVN(res.reservedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 230 }}>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            {res.bookTitle || `Sách #${res.bookId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ISBN: {res.bookIsbn || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`#${res.queuePosition ?? 1}`}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor:
                                res.queuePosition === 1
                                  ? "#EBF1EE"
                                  : "action.hover",
                              color:
                                res.queuePosition === 1
                                  ? "#315B4C"
                                  : "text.secondary",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <StatusChip status={res.status} type="reservation" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* TAB 3: GIAO DỊCH DOANH THU GẦN ĐÂY */}
            {activityTab === "payments" && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Mã & Độc giả</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Loại thanh toán
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Số tiền
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Trạng thái
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenueState.loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={26} />
                      </TableCell>
                    </TableRow>
                  ) : revenueState.recentPayments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{ py: 6, color: "text.secondary" }}
                      >
                        Chưa phát sinh giao dịch thanh toán nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    revenueState.recentPayments.map((payment) => (
                      <TableRow key={payment.id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: "text.primary" }}
                          >
                            #{payment.id} ·{" "}
                            {payment.userName || `Độc giả #${payment.userId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTimeVN(payment.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {paymentTypeLabels[payment.paymentType] ||
                              payment.paymentType}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 750, color: "primary.main" }}
                          >
                            {formatCurrencyVND(payment.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <StatusChip status={payment.status} type="payment" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
