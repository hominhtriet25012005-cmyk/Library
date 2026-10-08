import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { adminUsersApi, filterAdminUsers, paginateAdminUsers } from "../../api/adminUsers";

const roleLabel = (role) => role === "ROLE_ADMIN" ? "Quản trị viên" : "Người dùng";

const lastLoginLabel = (value) => {
  if (!value) return "Chưa đăng nhập";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không xác định";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
};

const DetailField = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography sx={{ overflowWrap: "anywhere" }}>{value}</Typography>
  </Box>
);

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [role, setRole] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    adminUsersApi.list({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) { setUsers(data); setError(""); }
      })
      .catch((cause) => {
        if (!controller.signal.aborted && cause.name !== "AbortError") {
          setError(cause.status === 403
            ? "Tài khoản hiện tại không có quyền xem danh sách người dùng."
            : cause.message || "Không thể tải danh sách người dùng.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  const filtered = useMemo(() => filterAdminUsers(users, { searchTerm, role }), [users, searchTerm, role]);
  const result = useMemo(() => paginateAdminUsers(filtered, page, 10), [filtered, page]);
  const retry = () => { setLoading(true); setError(""); setReload((value) => value + 1); };

  return (
    <Box component="section" aria-label="Quản lý người dùng" sx={{ maxWidth: 1200, mx: "auto", py: { xs: 3, sm: 4 } }}>
      <Typography variant="overline" sx={{ color: "#1769ff", fontWeight: 800, letterSpacing: 1.2 }}>ADMIN · AD3</Typography>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 800, color: "#172b4d", mb: 1 }}>Người dùng</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Tra cứu thông tin tài khoản. Giai đoạn này chỉ xem, không sửa hoặc xóa người dùng.</Typography>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: "#dce7f8", mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems={{ sm: "center" }}>
          <TextField
            label="Tìm tên, email, số điện thoại hoặc ID"
            size="small"
            value={searchTerm}
            onChange={(event) => { setSearchTerm(event.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} /> } }}
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Vai trò</InputLabel>
            <Select label="Vai trò" value={role} onChange={(event) => { setRole(event.target.value); setPage(0); }}>
              <MenuItem value="ALL">Tất cả</MenuItem>
              <MenuItem value="ROLE_USER">Người dùng</MenuItem>
              <MenuItem value="ROLE_ADMIN">Quản trị viên</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={retry}>Thử lại</Button>}>{error}</Alert>}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: "#dce7f8" }}>
        <Table size="small" aria-label="Danh sách người dùng">
          <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Tài khoản</TableCell><TableCell>Điện thoại</TableCell><TableCell>Vai trò</TableCell><TableCell>Đăng nhập gần nhất</TableCell><TableCell align="right">Xem</TableCell></TableRow></TableHead>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} aria-label="Đang tải người dùng" /></TableCell></TableRow>}
            {!loading && !error && result.items.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.id}</TableCell>
                <TableCell><Typography fontWeight={700}>{user.fullName}</Typography><Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{user.email}</Typography></TableCell>
                <TableCell>{user.phone || "Chưa cập nhật"}</TableCell>
                <TableCell><Chip size="small" variant="outlined" color={user.role === "ROLE_ADMIN" ? "primary" : "default"} label={roleLabel(user.role)} /></TableCell>
                <TableCell>{lastLoginLabel(user.lastLogin)}</TableCell>
                <TableCell align="right"><Button size="small" onClick={() => setSelected(user)}>Chi tiết</Button></TableCell>
              </TableRow>
            ))}
            {!loading && !error && result.items.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Không có tài khoản phù hợp.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      {!loading && !error && <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={1} sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">{result.totalElements} tài khoản · Trang {result.totalPages ? result.page + 1 : 0}/{result.totalPages}</Typography>
        <Button disabled={result.page === 0} onClick={() => setPage(result.page - 1)}>Trước</Button>
        <Button disabled={result.page + 1 >= result.totalPages} onClick={() => setPage(result.page + 1)}>Sau</Button>
      </Stack>}

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>Thông tin tài khoản</DialogTitle>
        <DialogContent>{selected && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: 1 }}>
          <DetailField label="ID" value={selected.id} />
          <DetailField label="Vai trò" value={roleLabel(selected.role)} />
          <DetailField label="Họ và tên" value={selected.fullName} />
          <DetailField label="Email" value={selected.email} />
          <DetailField label="Số điện thoại" value={selected.phone || "Chưa cập nhật"} />
          <DetailField label="Đăng nhập gần nhất" value={lastLoginLabel(selected.lastLogin)} />
        </Box>}</DialogContent>
        <DialogActions><Button onClick={() => setSelected(null)}>Đóng</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsersPage;
