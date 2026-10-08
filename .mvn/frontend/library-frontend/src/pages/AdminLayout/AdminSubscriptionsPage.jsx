import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel, MenuItem,
  Paper, Select, Stack, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tabs, TextField, Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { adminMembershipApi, buildPlanPayload, membershipStatus } from "../../api/adminMembership";

const money = (value) => Number.isSafeInteger(Number(value))
  ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value))
  : "—";
const date = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("vi-VN").format(parsed);
};

const emptyPlan = { planCode: "", name: "", description: "", durationDays: "30", price: "",
  maxBooksAllowed: "", maxDaysPerBook: "", displayOrder: "0", isActive: true,
  isFeatured: false, badgeText: "", adminNotes: "" };

const Header = ({ tab }) => <Box sx={{ mb: 3 }}>
  <Typography variant="overline" color="primary" fontWeight={800}>ADMIN · AD6</Typography>
  <Typography component="h2" variant="h4" fontWeight={800} sx={{ color: "#172b4d" }}>Gói thành viên</Typography>
  <Typography color="text.secondary" sx={{ my: 1 }}>Quản lý gói bán và theo dõi người đăng ký. Không kích hoạt gói hoặc xác nhận thanh toán thủ công.</Typography>
  <Tabs value={tab} aria-label="Tab gói thành viên" variant="scrollable" scrollButtons="auto">
    <Tab label="Các gói" value="plans" component={RouterLink} to="/admin/subscriptions/plans" />
    <Tab label="Thành viên đăng ký" value="members" component={RouterLink} to="/admin/subscriptions/members" />
  </Tabs>
</Box>;

const Detail = ({ label, children }) => <Box>
  <Typography variant="caption" color="text.secondary">{label}</Typography>
  <Typography sx={{ overflowWrap: "anywhere" }}>{children ?? "—"}</Typography>
</Box>;

const PlanCreateDialog = ({ open, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyPlan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const save = async () => {
    setError("");
    try {
      const payload = buildPlanPayload(form);
      setBusy(true);
      const created = await adminMembershipApi.createPlan(payload);
      setForm(emptyPlan); onSaved(created);
    } catch (cause) { setError(cause.message || "Không tạo được gói."); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>Thêm gói thành viên</DialogTitle>
    <DialogContent><Stack gap={2} sx={{ pt: 1 }}>
      <Typography variant="body2" color="text.secondary">Giá nguyên VND. Quyền lợi của gói được lưu tại thời điểm người dùng đăng ký; không thay đổi dữ liệu đăng ký cũ.</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Mã gói" required value={form.planCode} onChange={change("planCode")} inputProps={{ maxLength: 100 }} />
      <TextField label="Tên gói" required value={form.name} onChange={change("name")} inputProps={{ maxLength: 100 }} />
      <TextField label="Mô tả" multiline minRows={2} value={form.description} onChange={change("description")} inputProps={{ maxLength: 500 }} />
      <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
        <TextField fullWidth label="Thời hạn (ngày)" type="number" required value={form.durationDays} onChange={change("durationDays")} inputProps={{ min: 1, step: 1 }} />
        <TextField fullWidth label="Giá (VND)" type="number" required value={form.price} onChange={change("price")} inputProps={{ min: 1, max: 99999999, step: 1 }} />
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
        <TextField fullWidth label="Số sách tối đa" type="number" required value={form.maxBooksAllowed} onChange={change("maxBooksAllowed")} inputProps={{ min: 1, step: 1 }} />
        <TextField fullWidth label="Ngày mượn tối đa/sách" type="number" required value={form.maxDaysPerBook} onChange={change("maxDaysPerBook")} inputProps={{ min: 1, step: 1 }} />
      </Stack>
      <TextField label="Thứ tự hiển thị" type="number" value={form.displayOrder} onChange={change("displayOrder")} inputProps={{ min: 0, step: 1 }} />
      <TextField label="Nhãn hiển thị (không bắt buộc)" value={form.badgeText} onChange={change("badgeText")} inputProps={{ maxLength: 255 }} />
      <TextField label="Ghi chú quản trị (không hiển thị cho USER)" value={form.adminNotes} onChange={change("adminNotes")} inputProps={{ maxLength: 255 }} />
      <FormControlLabel control={<Checkbox checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} />} label="Gói nổi bật" />
      <FormControlLabel control={<Checkbox checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />} label="Mở bán ngay" />
    </Stack></DialogContent>
    <DialogActions><Button disabled={busy} onClick={onClose}>Đóng</Button><Button disabled={busy} variant="contained" onClick={save}>{busy ? "Đang tạo…" : "Tạo gói"}</Button></DialogActions>
  </Dialog>;
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
    adminMembershipApi.plans({ signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) { setPlans(data); setError(""); }
    }).catch((cause) => { if (!controller.signal.aborted && cause.name !== "AbortError") setError(cause.message || "Không tải được gói."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);
  const visible = (plans ?? []).filter((plan) => (status === "ALL" || plan.isActive === (status === "SELLING"))
    && (!query.trim() || `${plan.planCode} ${plan.name}`.toLocaleLowerCase("vi-VN").includes(query.trim().toLocaleLowerCase("vi-VN"))));
  return <Box component="section" sx={{ maxWidth: 1240, mx: "auto", py: 4 }}><Header tab="plans" />
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
      <Typography variant="h6" fontWeight={700}>Các gói</Typography>
      <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreating(true)}>Thêm gói</Button>
    </Stack>
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}><Stack direction={{ xs: "column", sm: "row" }} gap={2}>
      <TextField size="small" label="Tìm theo mã hoặc tên" value={query} onChange={(event) => setQuery(event.target.value)} sx={{ flex: 1 }} />
      <FormControl size="small" sx={{ minWidth: 160 }}><InputLabel>Trạng thái bán</InputLabel><Select label="Trạng thái bán" value={status} onChange={(event) => setStatus(event.target.value)}><MenuItem value="ALL">Tất cả</MenuItem><MenuItem value="SELLING">Đang bán</MenuItem><MenuItem value="STOPPED">Ngừng bán</MenuItem></Select></FormControl>
    </Stack></Paper>
    {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>}
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}><Table size="small" sx={{ minWidth: 720 }}><TableHead><TableRow>
      <TableCell>Gói</TableCell><TableCell>Giá</TableCell><TableCell>Thời hạn</TableCell><TableCell>Quyền lợi mượn</TableCell><TableCell>Trạng thái</TableCell><TableCell align="right">Thao tác</TableCell>
    </TableRow></TableHead><TableBody>
      {loading && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>}
      {!loading && !error && visible.map((plan) => <TableRow key={plan.id} hover>
        <TableCell><Typography fontWeight={700}>{plan.name}</Typography><Typography variant="caption" color="text.secondary">{plan.planCode} · #{plan.id}</Typography></TableCell>
        <TableCell>{money(plan.price)}</TableCell><TableCell>{plan.durationDays} ngày</TableCell>
        <TableCell>{plan.maxBooksAllowed} sách · tối đa {plan.maxDaysPerBook} ngày/sách</TableCell>
        <TableCell><Chip size="small" color={plan.isActive ? "success" : "default"} label={plan.isActive ? "Đang bán" : "Ngừng bán"} /></TableCell>
        <TableCell align="right"><Button size="small" onClick={() => setSelected(plan)}>Chi tiết</Button></TableCell>
      </TableRow>)}
      {!loading && !error && visible.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Không có gói phù hợp.</TableCell></TableRow>}
    </TableBody></Table></TableContainer>
    <Typography color="text.secondary" variant="body2" sx={{ mt: 1.5 }}>Đang hiển thị {visible.length}/{plans?.length ?? 0} gói. Không xóa cứng gói hoặc sửa thông tin gói đã bán trong AD6.</Typography>
    <PlanCreateDialog open={creating} onClose={() => setCreating(false)} onSaved={(created) => { setCreating(false); setNotice(`Đã tạo gói #${created.id}.`); setLoading(true); setReload((value) => value + 1); }} />
    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth><DialogTitle>Chi tiết gói #{selected?.id}</DialogTitle><DialogContent>{selected && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: 1 }}>
      <Detail label="Tên gói">{selected.name}</Detail><Detail label="Mã gói">{selected.planCode}</Detail>
      <Detail label="Giá">{money(selected.price)}</Detail><Detail label="Thời hạn">{selected.durationDays} ngày</Detail>
      <Detail label="Sách tối đa">{selected.maxBooksAllowed}</Detail><Detail label="Ngày mượn tối đa/sách">{selected.maxDaysPerBook}</Detail>
      <Detail label="Trạng thái">{selected.isActive ? "Đang bán" : "Ngừng bán"}</Detail><Detail label="Nổi bật">{selected.isFeatured ? "Có" : "Không"}</Detail>
      <Detail label="Mô tả">{selected.description || "—"}</Detail><Detail label="Nhãn">{selected.badgeText || "—"}</Detail>
      <Detail label="Ghi chú quản trị">{selected.adminNotes || "—"}</Detail><Detail label="Ngày tạo">{date(selected.createdAt)}</Detail>
    </Box>}</DialogContent><DialogActions><Button onClick={() => setSelected(null)}>Đóng</Button></DialogActions></Dialog>
  </Box>;
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
    adminMembershipApi.members({ ...filter, page }, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      if (page > 0 && page >= data.totalPages) { setPage(Math.max(0, data.totalPages - 1)); return; }
      setResult(data); setError("");
    }).catch((cause) => { if (!controller.signal.aborted && cause.name !== "AbortError") setError(cause.message || "Không tải được đăng ký."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, page, reload]);
  const search = () => { setPage(0); setResult(null); setFilter({ ...draft }); setLoading(true); setError(""); };
  return <Box component="section" sx={{ maxWidth: 1240, mx: "auto", py: 4 }}><Header tab="members" />
    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Thành viên đăng ký</Typography>
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}><Stack direction={{ xs: "column", md: "row" }} gap={1.5}>
      <TextField size="small" type="number" label="ID người dùng" value={draft.userId} onChange={(event) => setDraft({ ...draft, userId: event.target.value })} sx={{ flex: 1 }} />
      <TextField size="small" type="number" label="ID gói" value={draft.planId} onChange={(event) => setDraft({ ...draft, planId: event.target.value })} sx={{ flex: 1 }} />
      <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Cờ hiệu lực</InputLabel><Select label="Cờ hiệu lực" value={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.value })}><MenuItem value="ALL">Tất cả</MenuItem><MenuItem value="true">Đang bật</MenuItem><MenuItem value="false">Đã tắt</MenuItem></Select></FormControl>
      <Button variant="outlined" onClick={search}>Tra cứu</Button>
    </Stack><Typography variant="caption" color="text.secondary">Phân trang và lọc tại backend. Cờ hiệu lực không phải trạng thái thanh toán.</Typography></Paper>
    {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>}
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}><Table size="small" sx={{ minWidth: 900 }}><TableHead><TableRow>
      <TableCell>ID</TableCell><TableCell>Người dùng</TableCell><TableCell>Gói</TableCell><TableCell>Thời gian</TableCell><TableCell>Giá ghi nhận</TableCell><TableCell>Hiệu lực</TableCell><TableCell align="right">Thao tác</TableCell>
    </TableRow></TableHead><TableBody>
      {loading && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>}
      {!loading && !error && result?.content.map((entry) => <TableRow key={entry.id} hover>
        <TableCell>#{entry.id}</TableCell><TableCell><Typography fontWeight={700}>{entry.userName || `Người dùng #${entry.userId}`}</Typography><Typography variant="caption" color="text.secondary">{entry.userEmail}</Typography></TableCell>
        <TableCell>{entry.planName || entry.planCode || `Gói #${entry.planId}`}</TableCell>
        <TableCell>{date(entry.startDate)} – {date(entry.endDate)}</TableCell><TableCell>{entry.currency === "VND" ? money(entry.price) : `${entry.price ?? "—"} ${entry.currency ?? ""}`}</TableCell>
        <TableCell><Chip size="small" variant="outlined" color={membershipStatus(entry) === "Đang hiệu lực" ? "success" : "default"} label={membershipStatus(entry)} /></TableCell>
        <TableCell align="right"><Button size="small" onClick={() => setSelected(entry)}>Chi tiết</Button></TableCell>
      </TableRow>)}
      {!loading && !error && result?.content.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>Không có đăng ký phù hợp.</TableCell></TableRow>}
    </TableBody></Table></TableContainer>
    {!loading && !error && result && <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={1} sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary">{result.totalElements} lượt · Trang {result.totalPages ? page + 1 : 0}/{result.totalPages}</Typography>
      <Button disabled={page === 0} onClick={() => { setLoading(true); setPage(page - 1); }}>Trước</Button>
      <Button disabled={page + 1 >= result.totalPages} onClick={() => { setLoading(true); setPage(page + 1); }}>Sau</Button>
    </Stack>}
    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth><DialogTitle>Chi tiết đăng ký #{selected?.id}</DialogTitle><DialogContent>{selected && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: 1 }}>
      <Detail label="Người dùng">{selected.userName || `#${selected.userId}`} · {selected.userEmail}</Detail>
      <Detail label="Gói">{selected.planName || selected.planCode || `#${selected.planId}`}</Detail>
      <Detail label="Giá ghi nhận">{selected.currency === "VND" ? money(selected.price) : `${selected.price ?? "—"} ${selected.currency ?? ""}`}</Detail>
      <Detail label="Hiệu lực">{membershipStatus(selected)}</Detail>
      <Detail label="Bắt đầu">{date(selected.startDate)}</Detail><Detail label="Kết thúc">{date(selected.endDate)}</Detail>
      <Detail label="Số sách tối đa">{selected.maxBooksAllowed}</Detail><Detail label="Ngày mượn tối đa/sách">{selected.maxDaysPerBook}</Detail>
      <Detail label="Đã hủy lúc">{date(selected.cancelledAt)}</Detail><Detail label="Lý do hủy">{selected.cancellationReason || "—"}</Detail>
      <Detail label="Ghi chú">{selected.notes || "—"}</Detail>
    </Box>}</DialogContent><DialogActions><Button onClick={() => setSelected(null)}>Đóng</Button></DialogActions></Dialog>
  </Box>;
};
