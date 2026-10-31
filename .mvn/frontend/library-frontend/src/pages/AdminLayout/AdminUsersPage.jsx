import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import {
  adminUsersApi,
  filterAdminUsers,
  paginateAdminUsers,
} from "../../api/adminUsers";
import {
  PageHeader,
  SearchFilterBar,
  StatCard,
  StatCardGrid,
  StatusChip,
  TablePaginationBar,
} from "../../components/common";
import { formatDateTimeVN } from "../../utils/formatters";

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
    setLoading(true);
    setError("");
    adminUsersApi
      .list({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setUsers(data);
      })
      .catch((cause) => {
        if (!controller.signal.aborted && cause.name !== "AbortError") {
          setError(
            cause.status === 403
              ? "Tài khoản hiện tại không có quyền xem danh sách người dùng."
              : cause.message || "Không thể tải danh sách người dùng.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  const filtered = useMemo(
    () => filterAdminUsers(users, { searchTerm, role }),
    [users, searchTerm, role],
  );

  const result = useMemo(
    () => paginateAdminUsers(filtered, page, 10),
    [filtered, page],
  );

  const retry = () => {
    setLoading(true);
    setError("");
    setReload((value) => value + 1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setRole("ALL");
    setPage(0);
  };

  return (
    <Box
      component="section"
      sx={{ maxWidth: 1240, mx: "auto", py: { xs: 2.5, sm: 3.5 } }}
    >
      <PageHeader
        title="Quản lý người dùng"
        subtitle="Tra cứu tài khoản, phân quyền vai trò và theo dõi hoạt động đăng nhập trong hệ thống."
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={retry}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Thẻ thống kê người dùng */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Tổng tài khoản"
          value={users.length}
          detail="Tất cả tài khoản trong cơ sở dữ liệu"
          icon={<PeopleRoundedIcon />}
          color="#1769ff"
          loading={loading}
        />
        <StatCard
          title="Độc giả thư viện"
          value={users.filter((u) => u.role === "ROLE_USER").length}
          detail="Tài khoản độc giả mượn đọc sách"
          icon={<PersonOutlineRoundedIcon />}
          color="#16a34a"
          loading={loading}
        />
        <StatCard
          title="Quản trị viên"
          value={users.filter((u) => u.role === "ROLE_ADMIN").length}
          detail="Tài khoản quản lý hệ thống"
          icon={<AdminPanelSettingsRoundedIcon />}
          color="#d97706"
          loading={loading}
        />
        <StatCard
          title="Đã từng đăng nhập"
          value={users.filter((u) => Boolean(u.lastLogin)).length}
          detail="Tài khoản đang có hoạt động sử dụng"
          icon={<LoginRoundedIcon />}
          color="#0284c7"
          loading={loading}
        />
      </StatCardGrid>

      {/* Thanh tìm kiếm & lọc vai trò */}
      <SearchFilterBar
        searchValue={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(0);
        }}
        searchPlaceholder="Tìm tên, email, số điện thoại hoặc ID..."
        onReset={handleResetFilters}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Vai trò</InputLabel>
          <Select
            label="Vai trò"
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="ALL">Tất cả vai trò</MenuItem>
            <MenuItem value="ROLE_USER">Độc giả (ROLE_USER)</MenuItem>
            <MenuItem value="ROLE_ADMIN">Quản trị viên (ROLE_ADMIN)</MenuItem>
          </Select>
        </FormControl>
      </SearchFilterBar>

      {/* Bảng danh sách người dùng */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 3, borderColor: "#e2e8f0" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 70 }}>ID</TableCell>
              <TableCell>Họ và tên / Email</TableCell>
              <TableCell>Số điện thoại</TableCell>
              <TableCell align="center">Vai trò</TableCell>
              <TableCell>Đăng nhập gần nhất</TableCell>
              <TableCell align="center" sx={{ width: 100 }}>
                Thao tác
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : (
              result.items.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell
                    sx={{ fontFamily: "monospace", color: "text.secondary" }}
                  >
                    #{user.id}
                  </TableCell>

                  <TableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          bgcolor:
                            user.role === "ROLE_ADMIN" ? "#102d62" : "#1769ff",
                        }}
                      >
                        {user.fullName?.trim()?.[0]?.toUpperCase() ?? "U"}
                      </Avatar>
                      <Box>
                        <Typography
                          fontWeight={700}
                          sx={{ color: "#0f172a", fontSize: "0.9rem" }}
                        >
                          {user.fullName || "—"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>{user.phone || "—"}</TableCell>

                  <TableCell align="center">
                    <StatusChip status={user.role} type="role" />
                  </TableCell>

                  <TableCell
                    sx={{ fontSize: "0.8125rem", color: "text.secondary" }}
                  >
                    {formatDateTimeVN(user.lastLogin)}
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="Xem thông tin chi tiết">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelected(user)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}

            {!loading && result.items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 6, color: "text.secondary" }}
                >
                  Không tìm thấy người dùng phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phân trang chuẩn */}
      <TablePaginationBar
        page={page}
        totalPages={result.totalPages}
        totalElements={result.totalElements}
        itemLabel="người dùng"
        loading={loading}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Modal Chi tiết tài khoản người dùng */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 3.5, p: 0.5 } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pt: 2.5,
            px: 3,
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 750, color: "#0f172a" }}>
            Hồ sơ tài khoản
          </Typography>
          <IconButton size="small" onClick={() => setSelected(null)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {selected && (
            <Stack spacing={2.5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    bgcolor:
                      selected.role === "ROLE_ADMIN" ? "#102d62" : "#1769ff",
                  }}
                >
                  {selected.fullName?.trim()?.[0]?.toUpperCase() ?? "U"}
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={750}
                    color="#0f172a"
                  >
                    {selected.fullName || "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selected.email}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <StatusChip status={selected.role} type="role" />
                  </Box>
                </Box>
              </Box>

              <Divider />

              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    ID người dùng:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    #{selected.id}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Số điện thoại:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selected.phone || "Chưa cập nhật"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Đăng nhập gần nhất:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatDateTimeVN(selected.lastLogin)}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9" }}>
          <Button onClick={() => setSelected(null)} sx={{ borderRadius: 2 }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsersPage;
