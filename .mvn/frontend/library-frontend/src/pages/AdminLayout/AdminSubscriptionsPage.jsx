import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CardMembershipRoundedIcon from "@mui/icons-material/CardMembershipRounded";
import LoyaltyRoundedIcon from "@mui/icons-material/LoyaltyRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";

import {
  adminMembershipApi,
  buildPlanPayload,
  membershipStatus,
} from "../../api/adminMembership";
import {
  PageHeader,
  StatCard,
  StatCardGrid,
  SearchFilterBar,
  StatusChip,
  TablePaginationBar,
  EmptyState,
} from "../../components/common";
import { formatCurrencyVND, formatDateVN } from "../../utils/formatters";

const emptyPlan = {
  planCode: "",
  name: "",
  description: "",
  durationDays: "30",
  price: "",
  maxBooksAllowed: "",
  maxDaysPerBook: "",
  displayOrder: "0",
  isActive: true,
  isFeatured: false,
  badgeText: "",
  adminNotes: "",
};

const SubscriptionsHeader = ({ activeTab, actionButton = null }) => (
  <Box sx={{ mb: 3 }}>
    <PageHeader
      title="Quản lý gói thành viên"
      subtitle="Thiết lập các gói hội viên mượn sách và theo dõi lịch sử độc giả đăng ký dịch vụ"
      action={actionButton}
    />
    <Tabs
      value={activeTab}
      aria-label="Tab gói thành viên"
      sx={{
        borderBottom: "1px solid #e2e8f0",
        "& .MuiTab-root": {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9375rem",
          minHeight: 44,
          px: 2.5,
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
        label="Chính sách các gói"
        value="plans"
        component={RouterLink}
        to="/admin/subscriptions/plans"
        icon={<LoyaltyRoundedIcon sx={{ fontSize: 18, mr: 0.5 }} />}
        iconPosition="start"
      />
      <Tab
        label="Thành viên đăng ký"
        value="members"
        component={RouterLink}
        to="/admin/subscriptions/members"
        icon={<PeopleAltRoundedIcon sx={{ fontSize: 18, mr: 0.5 }} />}
        iconPosition="start"
      />
    </Tabs>
  </Box>
);

const DetailRow = ({ label, children }) => (
  <Box>
    <Typography
      variant="caption"
      sx={{ color: "#64748b", fontWeight: 500, display: "block", mb: 0.25 }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        overflowWrap: "anywhere",
        fontWeight: 600,
        color: "#1e293b",
        fontSize: "0.875rem",
      }}
    >
      {children ?? "—"}
    </Typography>
  </Box>
);

const PlanCreateDialog = ({ open, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyPlan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const change = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = async () => {
    setError("");
    try {
      const payload = buildPlanPayload(form);
      setBusy(true);
      const created = await adminMembershipApi.createPlan(payload);
      setForm(emptyPlan);
      onSaved(created);
    } catch (cause) {
      setError(cause.message || "Không tạo được gói mới.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3.5,
            p: 0.5,
            boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.15)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          pt: 2.5,
          px: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#102d62" }}>
          Thêm gói thành viên mới
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          disabled={busy}
          sx={{
            color: "#94a3b8",
            "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ borderRadius: 2, fontSize: "0.85rem" }}>
            Giá cước tính theo số nguyên VNĐ. Quyền lợi gói được lưu cố định tại
            thời điểm độc giả đăng ký và không ảnh hưởng đến các lượt đã mua
            trước đó.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Mã gói (Plan Code)"
              placeholder="VD: VIP_GOLD"
              required
              value={form.planCode}
              onChange={change("planCode")}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
            <TextField
              label="Tên gói hiển thị"
              placeholder="VD: Hội viên Vàng"
              required
              value={form.name}
              onChange={change("name")}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </Box>

          <TextField
            label="Mô tả quyền lợi gói"
            placeholder="Mô tả ngắn gọn về đặc quyền dành cho độc giả..."
            multiline
            minRows={2}
            value={form.description}
            onChange={change("description")}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Thời hạn sử dụng"
              type="number"
              placeholder="30"
              required
              value={form.durationDays}
              onChange={change("durationDays")}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">ngày</InputAdornment>
                  ),
                  inputProps: { min: 1, step: 1 },
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
            <TextField
              fullWidth
              label="Giá cước"
              type="number"
              placeholder="50000"
              required
              value={form.price}
              onChange={change("price")}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">₫</InputAdornment>
                  ),
                  inputProps: { min: 1, max: 99999999, step: 1000 },
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Số sách mượn tối đa"
              type="number"
              placeholder="5"
              required
              value={form.maxBooksAllowed}
              onChange={change("maxBooksAllowed")}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">cuốn</InputAdornment>
                  ),
                  inputProps: { min: 1, step: 1 },
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
            <TextField
              fullWidth
              label="Hạn mượn tối đa/cuốn"
              type="number"
              placeholder="14"
              required
              value={form.maxDaysPerBook}
              onChange={change("maxDaysPerBook")}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">ngày</InputAdornment>
                  ),
                  inputProps: { min: 1, step: 1 },
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Thứ tự hiển thị"
              type="number"
              value={form.displayOrder}
              onChange={change("displayOrder")}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
            <TextField
              label="Huy hiệu nổi bật (Badge)"
              placeholder="VD: Phổ biến nhất"
              value={form.badgeText}
              onChange={change("badgeText")}
              slotProps={{ htmlInput: { maxLength: 255 } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </Box>

          <TextField
            label="Ghi chú quản trị (Nội bộ)"
            placeholder="Ghi chú chiến dịch hoặc lưu ý cho thủ thư..."
            value={form.adminNotes}
            onChange={change("adminNotes")}
            slotProps={{ htmlInput: { maxLength: 255 } }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />

          <Stack direction="row" spacing={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isFeatured}
                  onChange={(event) =>
                    setForm({ ...form, isFeatured: event.target.checked })
                  }
                  color="primary"
                />
              }
              label="Gói nổi bật"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm({ ...form, isActive: event.target.checked })
                  }
                  color="primary"
                />
              }
              label="Mở bán ngay"
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid #f1f5f9",
          gap: 1,
        }}
      >
        <Button
          disabled={busy}
          onClick={onClose}
          sx={{
            color: "#64748b",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "10px",
            px: 2.5,
            "&:hover": { bgcolor: "#f1f5f9" },
          }}
        >
          Hủy bỏ
        </Button>
        <Button
          disabled={busy}
          variant="contained"
          onClick={save}
          sx={{
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "10px",
            px: 3,
            height: 40,
          }}
        >
          {busy ? "Đang xử lý…" : "Tạo gói"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const AdminSubscriptionPlansPage = () => {
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [status, setStatus] = useState("ALL");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    adminMembershipApi
      .plans({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setPlans(data);
          setError("");
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted && cause.name !== "AbortError")
          setError(cause.message || "Không tải được danh sách gói.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  const visible = (plans ?? []).filter(
    (plan) =>
      (status === "ALL" || plan.isActive === (status === "SELLING")) &&
      (!query.trim() ||
        `${plan.planCode} ${plan.name}`
          .toLocaleLowerCase("vi-VN")
          .includes(query.trim().toLocaleLowerCase("vi-VN"))),
  );

  const stats = useMemo(() => {
    const all = plans || [];
    const active = all.filter((p) => p.isActive).length;
    const inactive = all.length - active;
    return { total: all.length, active, inactive };
  }, [plans]);

  return (
    <Box
      component="section"
      aria-label="Quản lý chính sách gói thành viên"
      sx={{
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
        px: { xs: 2, sm: 3, md: 3.5 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <SubscriptionsHeader
        activeTab="plans"
        actionButton={{
          label: "Thêm gói mới",
          icon: AddRoundedIcon,
          onClick: () => setCreating(true),
        }}
      />

      {notice && (
        <Alert
          severity="success"
          sx={{ mb: 2.5, borderRadius: 2 }}
          onClose={() => setNotice("")}
        >
          {notice}
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
                setReload((value) => value + 1);
              }}
            >
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Thẻ thống kê */}
      <StatCardGrid columns={{ xs: 1, sm: 3 }} sx={{ mb: 3 }}>
        <StatCard
          title="Tổng số gói"
          value={loading ? "—" : stats.total}
          subtitle="Tất cả chính sách gói đã tạo"
          icon={LoyaltyRoundedIcon}
          color="primary"
        />
        <StatCard
          title="Đang mở bán"
          value={loading ? "—" : stats.active}
          subtitle="Gói độc giả có thể mua trên ứng dụng"
          icon={CheckCircleOutlineRoundedIcon}
          color="success"
        />
        <StatCard
          title="Tạm ngừng bán"
          value={loading ? "—" : stats.inactive}
          subtitle="Gói tạm thời ẩn khỏi cửa hàng"
          icon={BlockRoundedIcon}
          color="warning"
        />
      </StatCardGrid>

      {/* Bộ lọc tìm kiếm */}
      <SearchFilterBar
        searchValue={query}
        onSearchChange={setQuery}
        onReset={() => {
          setQuery("");
          setStatus("ALL");
        }}
        searchPlaceholder="Tìm theo mã gói hoặc tên gói..."
        searchLabel="Tra cứu gói"
        showSearchButton={false}
        filters={
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="plan-status-filter-label">
              Trạng thái bán
            </InputLabel>
            <Select
              labelId="plan-status-filter-label"
              label="Trạng thái bán"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ borderRadius: "10px" }}
            >
              <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
              <MenuItem value="SELLING">Đang mở bán</MenuItem>
              <MenuItem value="STOPPED">Đã ngừng bán</MenuItem>
            </Select>
          </FormControl>
        }
      />

      {/* Bảng danh sách gói */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          overflowX: "auto",
          bgcolor: "#fff",
          borderColor: "#e2e8f0",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}
      >
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 200, color: "#1e293b" }}
              >
                Gói thành viên
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, minWidth: 140, color: "#1e293b" }}
              >
                Giá cước
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 110, color: "#1e293b" }}
              >
                Thời hạn
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 200, color: "#1e293b" }}
              >
                Quyền lợi mượn
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, minWidth: 130, color: "#1e293b" }}
              >
                Trạng thái
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: 90, color: "#1e293b" }}
              >
                Chi tiết
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                  <Typography
                    variant="body2"
                    sx={{ mt: 1.5, color: "#64748b" }}
                  >
                    Đang tải danh sách các gói...
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ p: 0 }}>
                  <EmptyState
                    title="Không có gói nào phù hợp"
                    description="Không tìm thấy chính sách gói thành viên khớp với điều kiện tìm kiếm."
                  />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !error &&
              visible.map((plan) => (
                <TableRow
                  key={plan.id}
                  hover
                  sx={{
                    "&:hover": { bgcolor: "#f8fafc" },
                    "& td": { borderColor: "#f1f5f9" },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "#1e293b" }}
                      >
                        {plan.name}
                      </Typography>
                      {plan.badgeText && (
                        <Typography
                          variant="caption"
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: "12px",
                            bgcolor: "rgba(23,105,255,0.1)",
                            color: "#1769ff",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                          }}
                        >
                          {plan.badgeText}
                        </Typography>
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", display: "block" }}
                    >
                      Mã: <code>{plan.planCode}</code> · ID: #{plan.id}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 750, color: "#102d62" }}
                    >
                      {formatCurrencyVND(plan.price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#334155" }}
                    >
                      {plan.durationDays} ngày
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#1e293b" }}
                    >
                      Tối đa {plan.maxBooksAllowed} cuốn
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", display: "block" }}
                    >
                      {plan.maxDaysPerBook} ngày / cuốn sách
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <StatusChip
                      type="active"
                      status={plan.isActive ? "ACTIVE" : "INACTIVE"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xem chi tiết gói">
                      <IconButton
                        size="small"
                        aria-label={`Chi tiết gói #${plan.id}`}
                        onClick={() => setSelected(plan)}
                        sx={{
                          color: "#1769ff",
                          bgcolor: "rgba(23,105,255,0.06)",
                          "&:hover": { bgcolor: "rgba(23,105,255,0.12)" },
                        }}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography
        variant="caption"
        sx={{ mt: 1.5, display: "block", color: "#64748b" }}
      >
        Hiển thị {visible.length}/{plans?.length ?? 0} gói. Thông tin gói đã lưu
        được bảo toàn cho các đăng ký cũ.
      </Typography>

      <PlanCreateDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(created) => {
          setCreating(false);
          setNotice(
            `Đã tạo thành công gói thành viên #${created.id} (${created.name}).`,
          );
          setLoading(true);
          setReload((value) => value + 1);
        }}
      />

      {/* Modal chi tiết gói */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
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
          <Box>
            <Typography variant="h6" fontWeight={750} sx={{ color: "#102d62" }}>
              Gói #{selected?.id} · {selected?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Chi tiết đặc quyền và chính sách giá
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setSelected(null)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selected && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <DetailRow label="Tên gói">{selected.name}</DetailRow>
              <DetailRow label="Mã định danh">{selected.planCode}</DetailRow>
              <DetailRow label="Giá niêm yết">
                {formatCurrencyVND(selected.price)}
              </DetailRow>
              <DetailRow label="Thời hạn gói">
                {selected.durationDays} ngày
              </DetailRow>
              <DetailRow label="Số sách mượn cùng lúc">
                {selected.maxBooksAllowed} cuốn
              </DetailRow>
              <DetailRow label="Thời hạn mượn/sách">
                {selected.maxDaysPerBook} ngày
              </DetailRow>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#64748b",
                    fontWeight: 500,
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  Trạng thái kinh doanh
                </Typography>
                <StatusChip
                  type="active"
                  status={selected.isActive ? "ACTIVE" : "INACTIVE"}
                />
              </Box>
              <DetailRow label="Đánh dấu nổi bật">
                {selected.isFeatured ? "Có" : "Không"}
              </DetailRow>
              {selected.badgeText && (
                <DetailRow label="Huy hiệu hiển thị">
                  {selected.badgeText}
                </DetailRow>
              )}
              {selected.description && (
                <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                  <DetailRow label="Mô tả quyền lợi">
                    {selected.description}
                  </DetailRow>
                </Box>
              )}
              {selected.adminNotes && (
                <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                  <DetailRow label="Ghi chú quản trị">
                    {selected.adminNotes}
                  </DetailRow>
                </Box>
              )}
              <DetailRow label="Ngày tạo chính sách">
                {formatDateVN(selected.createdAt)}
              </DetailRow>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={() => setSelected(null)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export const AdminSubscriptionMembersPage = () => {
  const [draft, setDraft] = useState({ userId: "", planId: "", active: "ALL" });
  const [filter, setFilter] = useState(draft);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    adminMembershipApi
      .members({ ...filter, page }, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (page > 0 && page >= data.totalPages) {
          setPage(Math.max(0, data.totalPages - 1));
          return;
        }
        setResult(data);
        setError("");
      })
      .catch((cause) => {
        if (!controller.signal.aborted && cause.name !== "AbortError")
          setError(
            cause.message || "Không tải được danh sách độc giả đăng ký.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filter, page, reload]);

  const search = () => {
    setPage(0);
    setResult(null);
    setFilter({ ...draft });
    setLoading(true);
    setError("");
  };

  const handleReset = () => {
    const resetValues = { userId: "", planId: "", active: "ALL" };
    setDraft(resetValues);
    setFilter(resetValues);
    setPage(0);
    setResult(null);
    setLoading(true);
    setError("");
  };

  return (
    <Box
      component="section"
      aria-label="Danh sách thành viên đăng ký gói"
      sx={{
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
        px: { xs: 2, sm: 3, md: 3.5 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <SubscriptionsHeader activeTab="members" />

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
                setReload((value) => value + 1);
              }}
            >
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Thanh tìm kiếm và bộ lọc */}
      <SearchFilterBar
        searchValue={draft.userId}
        onSearchChange={(v) => setDraft((prev) => ({ ...prev, userId: v }))}
        onSearchSubmit={search}
        onReset={handleReset}
        searchPlaceholder="Nhập ID người dùng cần tra..."
        searchLabel="ID người dùng"
        submitLabel="Tra cứu"
        filters={
          <>
            <TextField
              size="small"
              type="number"
              label="ID gói"
              placeholder="VD: 1"
              value={draft.planId}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, planId: e.target.value }))
              }
              sx={{
                minWidth: 120,
                "& .MuiOutlinedInput-root": { borderRadius: "10px" },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="member-active-filter-label">
                Cờ hiệu lực
              </InputLabel>
              <Select
                labelId="member-active-filter-label"
                label="Cờ hiệu lực"
                value={draft.active}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, active: e.target.value }))
                }
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="ALL">Tất cả</MenuItem>
                <MenuItem value="true">Đang kích hoạt</MenuItem>
                <MenuItem value="false">Đã tắt / Hết hạn</MenuItem>
              </Select>
            </FormControl>
          </>
        }
      />

      {/* Bảng danh sách thành viên */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          overflowX: "auto",
          bgcolor: "#fff",
          borderColor: "#e2e8f0",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}
      >
        <Table sx={{ minWidth: 850 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 80, color: "#1e293b" }}>
                Mã
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 180, color: "#1e293b" }}
              >
                Độc giả
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 160, color: "#1e293b" }}
              >
                Gói đăng ký
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 180, color: "#1e293b" }}
              >
                Thời hạn hiệu lực
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, minWidth: 130, color: "#1e293b" }}
              >
                Giá thanh toán
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, minWidth: 140, color: "#1e293b" }}
              >
                Trạng thái
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: 90, color: "#1e293b" }}
              >
                Chi tiết
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                  <Typography
                    variant="body2"
                    sx={{ mt: 1.5, color: "#64748b" }}
                  >
                    Đang tải danh sách thành viên đăng ký...
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && result?.content?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ p: 0 }}>
                  <EmptyState
                    title="Chưa có lượt đăng ký nào"
                    description="Không tìm thấy lượt đăng ký gói thành viên khớp với điều kiện tìm kiếm."
                  />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !error &&
              result?.content?.map((entry) => {
                const statusText = membershipStatus(entry);
                return (
                  <TableRow
                    key={entry.id}
                    hover
                    sx={{
                      "&:hover": { bgcolor: "#f8fafc" },
                      "& td": { borderColor: "#f1f5f9" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: "#64748b" }}>
                      #{entry.id}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 750, color: "#1e293b" }}
                      >
                        {entry.userName || `Độc giả #${entry.userId}`}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748b", display: "block" }}
                      >
                        {entry.userEmail || `ID: #${entry.userId}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "#102d62" }}
                      >
                        {entry.planName ||
                          entry.planCode ||
                          `Gói #${entry.planId}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ color: "#334155", fontSize: "0.8125rem" }}
                      >
                        {formatDateVN(entry.startDate)} –{" "}
                        {formatDateVN(entry.endDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "#1e293b" }}
                      >
                        {entry.currency === "VND"
                          ? formatCurrencyVND(entry.price)
                          : `${entry.price ?? "—"} ${entry.currency ?? ""}`}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <StatusChip
                        status={
                          statusText === "Đang hiệu lực"
                            ? "ACTIVE"
                            : statusText === "Đã hủy"
                              ? "CANCELLED"
                              : "EXPIRED"
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xem chi tiết đăng ký">
                        <IconButton
                          size="small"
                          aria-label={`Chi tiết đăng ký #${entry.id}`}
                          onClick={() => setSelected(entry)}
                          sx={{
                            color: "#1769ff",
                            bgcolor: "rgba(23,105,255,0.06)",
                            "&:hover": { bgcolor: "rgba(23,105,255,0.12)" },
                          }}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phân trang Server-side */}
      <TablePaginationBar
        page={page}
        totalPages={result?.totalPages || 0}
        totalElements={result?.totalElements}
        loading={loading}
        onPageChange={(nextPage) => {
          setLoading(true);
          setPage(nextPage);
        }}
        itemLabel="lượt đăng ký"
      />

      {/* Dialog chi tiết đăng ký thành viên */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
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
          <Box>
            <Typography variant="h6" fontWeight={750} sx={{ color: "#102d62" }}>
              Lượt đăng ký #{selected?.id}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Thông tin quyền lợi và hạn sử dụng của độc giả
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setSelected(null)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selected && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <DetailRow label="Người đăng ký">
                {selected.userName || `#${selected.userId}`} ·{" "}
                {selected.userEmail}
              </DetailRow>
              <DetailRow label="Gói đăng ký">
                {selected.planName ||
                  selected.planCode ||
                  `#${selected.planId}`}
              </DetailRow>
              <DetailRow label="Giá đã ghi nhận">
                {selected.currency === "VND"
                  ? formatCurrencyVND(selected.price)
                  : `${selected.price ?? "—"} ${selected.currency ?? ""}`}
              </DetailRow>
              <DetailRow label="Trạng thái hiệu lực">
                {membershipStatus(selected)}
              </DetailRow>
              <DetailRow label="Ngày bắt đầu">
                {formatDateVN(selected.startDate)}
              </DetailRow>
              <DetailRow label="Ngày kết thúc">
                {formatDateVN(selected.endDate)}
              </DetailRow>
              <DetailRow label="Số sách tối đa">
                {selected.maxBooksAllowed} cuốn
              </DetailRow>
              <DetailRow label="Hạn mượn tối đa/cuốn">
                {selected.maxDaysPerBook} ngày
              </DetailRow>
              {selected.cancelledAt && (
                <>
                  <DetailRow label="Thời điểm hủy">
                    {formatDateVN(selected.cancelledAt)}
                  </DetailRow>
                  <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                    <DetailRow label="Lý do hủy">
                      {selected.cancellationReason || "—"}
                    </DetailRow>
                  </Box>
                </>
              )}
              {selected.notes && (
                <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                  <DetailRow label="Ghi chú">{selected.notes}</DetailRow>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={() => setSelected(null)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
