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
import LoyaltyRoundedIcon from "@mui/icons-material/LoyaltyRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";

import {
  adminMembershipApi,
  buildPlanPayload,
  membershipStatus,
} from "../../../api/adminMembership";
import {
  PageHeader,
  StatCard,
  StatCardGrid,
  SearchFilterBar,
  StatusChip,
  TablePaginationBar,
  EmptyState,
} from "../../../components/common";
import { formatCurrencyVND, formatDateVN } from "../../../utils/formatters";

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

const planToForm = (plan) =>
  plan
    ? {
        planCode: plan.planCode ?? "",
        name: plan.name ?? "",
        description: plan.description ?? "",
        durationDays: String(plan.durationDays ?? ""),
        price: String(plan.price ?? ""),
        maxBooksAllowed: String(plan.maxBooksAllowed ?? ""),
        maxDaysPerBook: String(plan.maxDaysPerBook ?? ""),
        displayOrder: String(plan.displayOrder ?? 0),
        isActive: plan.isActive !== false,
        isFeatured: plan.isFeatured === true,
        badgeText: plan.badgeText ?? "",
        adminNotes: plan.adminNotes ?? "",
      }
    : { ...emptyPlan };

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
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTab-root": {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9375rem",
          minHeight: 44,
          px: 2.5,
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
      sx={{
        color: "text.secondary",
        fontWeight: 500,
        display: "block",
        mb: 0.25,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        overflowWrap: "anywhere",
        fontWeight: 600,
        color: "text.primary",
        fontSize: "0.875rem",
      }}
    >
      {children ?? "—"}
    </Typography>
  </Box>
);

const PlanDialog = ({ open, plan = null, onClose, onSaved }) => {
  const [form, setForm] = useState(() => planToForm(plan));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(plan?.id);

  const change = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = async () => {
    setError("");
    try {
      const payload = buildPlanPayload(form);
      setBusy(true);
      const saved = editing
        ? await adminMembershipApi.updatePlan(plan.id, payload)
        : await adminMembershipApi.createPlan(payload);
      setForm({ ...emptyPlan });
      onSaved(saved, editing);
    } catch (cause) {
      setError(
        cause.message ||
          (editing
            ? "Không cập nhật được gói thành viên."
            : "Không tạo được gói mới."),
      );
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
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "text.primary" }}
        >
          {editing ? "Sửa gói thành viên" : "Thêm gói thành viên mới"}
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          disabled={busy}
          sx={{
            color: "text.secondary",
            "&:hover": { bgcolor: "action.hover", color: "text.primary" },
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
              disabled={editing}
              helperText={editing ? "Mã gói được giữ cố định sau khi tạo." : ""}
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
              label="Huy hiệu nổi bật "
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
          borderTop: 1,
          borderColor: "divider",
          gap: 1,
        }}
      >
        <Button
          disabled={busy}
          onClick={onClose}
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "10px",
            px: 2.5,
            "&:hover": { bgcolor: "action.hover" },
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
          {busy ? "Đang xử lý…" : editing ? "Lưu thay đổi" : "Tạo gói"}
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
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

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

  const deletePlan = async () => {
    if (!deleting || actionBusy) return;
    setActionBusy(true);
    setActionError("");
    try {
      const response = await adminMembershipApi.deletePlan(deleting.id);
      setNotice(response.message || "Đã cập nhật trạng thái gói thành viên.");
      setDeleting(null);
      setLoading(true);
      setReload((value) => value + 1);
    } catch (cause) {
      setActionError(
        cause.message || "Không thể xóa hoặc ngừng bán gói thành viên.",
      );
    } finally {
      setActionBusy(false);
    }
  };

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
          icon={LoyaltyRoundedIcon}
          color="primary"
        />
        <StatCard
          title="Đang mở bán"
          value={loading ? "—" : stats.active}
          icon={CheckCircleOutlineRoundedIcon}
          color="success"
        />
        <StatCard
          title="Tạm ngừng bán"
          value={loading ? "—" : stats.inactive}
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
          bgcolor: "background.paper",
          borderColor: "divider",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}
      >
        <Table sx={{ minWidth: 800 }}>
          <TableHead
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "action.hover" : "#f8fafc",
            }}
          >
            <TableRow>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 200, color: "text.primary" }}
              >
                Gói thành viên
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, minWidth: 140, color: "text.primary" }}
              >
                Giá cước
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 110, color: "text.primary" }}
              >
                Thời hạn
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 200, color: "text.primary" }}
              >
                Quyền lợi mượn
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, minWidth: 130, color: "text.primary" }}
              >
                Trạng thái
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: 90, color: "text.primary" }}
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
                    sx={{ mt: 1.5, color: "text.secondary" }}
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
                    "&:hover": { bgcolor: "action.hover" },
                    "& td": { borderColor: "divider" },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "text.primary" }}
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
                            bgcolor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "rgba(59,130,246,0.2)"
                                : "rgba(23,105,255,0.1)",
                            color: "primary.main",
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
                      sx={{ color: "text.secondary", display: "block" }}
                    >
                      Mã: <code>{plan.planCode}</code> · ID: #{plan.id}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 750, color: "primary.main" }}
                    >
                      {formatCurrencyVND(plan.price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "text.primary" }}
                    >
                      {plan.durationDays} ngày
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "text.primary" }}
                    >
                      Tối đa {plan.maxBooksAllowed} cuốn
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block" }}
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
                          color: "primary.main",
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(59,130,246,0.15)"
                              : "rgba(23,105,255,0.06)",
                          "&:hover": {
                            bgcolor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "rgba(59,130,246,0.25)"
                                : "rgba(23,105,255,0.12)",
                          },
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
        sx={{ mt: 1.5, display: "block", color: "text.secondary" }}
      >
        Hiển thị {visible.length}/{plans?.length ?? 0} gói. Thông tin gói đã lưu
        được bảo toàn cho các đăng ký cũ.
      </Typography>

      {(creating || editing) && (
        <PlanDialog
          open
          plan={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(saved, wasEditing) => {
            setCreating(false);
            setEditing(null);
            setNotice(
              wasEditing
                ? `Đã cập nhật gói thành viên #${saved.id} (${saved.name}).`
                : `Đã tạo thành công gói thành viên #${saved.id} (${saved.name}).`,
            );
            setLoading(true);
            setReload((value) => value + 1);
          }}
        />
      )}

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
            <Typography
              variant="h6"
              fontWeight={750}
              sx={{ color: "text.primary" }}
            >
              Gói #{selected?.id} · {selected?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
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
                    color: "text.secondary",
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
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            color="error"
            startIcon={<DeleteOutlineRoundedIcon />}
            onClick={() => {
              setDeleting(selected);
              setSelected(null);
              setActionError("");
            }}
            sx={{ mr: "auto", textTransform: "none", fontWeight: 600 }}
          >
            Xóa / Ngừng bán
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditRoundedIcon />}
            onClick={() => {
              setEditing(selected);
              setSelected(null);
            }}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Sửa gói
          </Button>
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

      <Dialog
        open={Boolean(deleting)}
        onClose={actionBusy ? undefined : () => setDeleting(null)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 750, color: "text.primary" }}>
          Xác nhận xử lý gói thành viên
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Gói chưa có lịch sử đăng ký sẽ bị xóa vĩnh viễn. Nếu đã có lịch
              sử, chỉ ngừng bán và vẫn giữ nguyên dữ liệu cũ.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Gói #{deleting?.id} · {deleting?.name}
            </Typography>
            {actionError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {actionError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button disabled={actionBusy} onClick={() => setDeleting(null)}>
            Hủy
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={actionBusy}
            onClick={deletePlan}
          >
            {actionBusy ? "Đang xử lý…" : "Xác nhận"}
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
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);

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

  const deactivateExpired = async () => {
    if (maintenanceBusy) return;
    setMaintenanceBusy(true);
    setActionError("");
    try {
      const response = await adminMembershipApi.deactivateExpired();
      setNotice(response.message || "Đã xử lý các gói đăng ký hết hạn.");
      setConfirmMaintenance(false);
      setResult(null);
      setLoading(true);
      setReload((value) => value + 1);
    } catch (cause) {
      setActionError(
        cause.message || "Không thể xử lý các gói đăng ký hết hạn.",
      );
    } finally {
      setMaintenanceBusy(false);
    }
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
      <SubscriptionsHeader
        activeTab="members"
        actionButton={{
          label: "Xử lý gói hết hạn",
          icon: UpdateRoundedIcon,
          variant: "outlined",
          onClick: () => {
            setActionError("");
            setConfirmMaintenance(true);
          },
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
          bgcolor: "background.paper",
          borderColor: "divider",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}
      >
        <Table sx={{ minWidth: 850 }}>
          <TableHead
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "action.hover" : "#f8fafc",
            }}
          >
            <TableRow>
              <TableCell
                sx={{ fontWeight: 700, width: 80, color: "text.primary" }}
              >
                Mã
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 180, color: "text.primary" }}
              >
                Độc giả
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 160, color: "text.primary" }}
              >
                Gói đăng ký
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, minWidth: 180, color: "text.primary" }}
              >
                Thời hạn hiệu lực
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, minWidth: 130, color: "text.primary" }}
              >
                Giá thanh toán
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, minWidth: 140, color: "text.primary" }}
              >
                Trạng thái
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: 90, color: "text.primary" }}
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
                      "&:hover": { bgcolor: "action.hover" },
                      "& td": { borderColor: "divider" },
                    }}
                  >
                    <TableCell
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      #{entry.id}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 750, color: "text.primary" }}
                      >
                        {entry.userName || `Độc giả #${entry.userId}`}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", display: "block" }}
                      >
                        {entry.userEmail || `ID: #${entry.userId}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "primary.main" }}
                      >
                        {entry.planName ||
                          entry.planCode ||
                          `Gói #${entry.planId}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.primary", fontSize: "0.8125rem" }}
                      >
                        {formatDateVN(entry.startDate)} –{" "}
                        {formatDateVN(entry.endDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "text.primary" }}
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
                            ? "HOẠT ĐỘNG"
                            : statusText === "Đã hủy"
                              ? "HỦY"
                              : "HẾT HẠN"
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
                            color: "primary.main",
                            bgcolor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "rgba(59,130,246,0.15)"
                                : "rgba(23,105,255,0.06)",
                            "&:hover": {
                              bgcolor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(59,130,246,0.25)"
                                  : "rgba(23,105,255,0.12)",
                            },
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
            <Typography
              variant="h6"
              fontWeight={750}
              sx={{ color: "text.primary" }}
            >
              Lượt đăng ký #{selected?.id}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
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

      <Dialog
        open={confirmMaintenance}
        onClose={
          maintenanceBusy ? undefined : () => setConfirmMaintenance(false)
        }
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 750, color: "text.primary" }}>
          Xử lý các gói đăng ký hết hạn
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Rà soát các lượt đăng ký đã qua ngày kết thúc và tắt hiệu lực.
            </Alert>
            {actionError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {actionError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            disabled={maintenanceBusy}
            onClick={() => setConfirmMaintenance(false)}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={maintenanceBusy}
            onClick={deactivateExpired}
          >
            {maintenanceBusy ? "Đang xử lý…" : "Bắt đầu xử lý"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
