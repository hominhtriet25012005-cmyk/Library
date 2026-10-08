import { Box, Chip, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const AdminStagePage = ({ page }) => (
  <Box component="section" aria-label={page.title} sx={{ maxWidth: 1060, mx: "auto", py: { xs: 3, sm: 4 } }}>
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
      <Typography variant="overline" sx={{ color: "#1769ff", fontWeight: 800, letterSpacing: 1.2 }}>ADMIN</Typography>
      <Chip label={page.stage} size="small" color="primary" variant="outlined" />
    </Stack>
    <Typography variant="h4" component="h2" sx={{ fontWeight: 800, color: "#172b4d", mb: 1 }}>
      {page.title}
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
      {page.description}
    </Typography>
    {page.path.startsWith("/admin/subscriptions/") && (
      <Tabs value={page.path} aria-label="Tab gói thành viên" sx={{ mb: 2 }}>
        <Tab label="Các gói" value="/admin/subscriptions/plans" component={RouterLink} to="/admin/subscriptions/plans" />
        <Tab label="Thành viên đăng ký" value="/admin/subscriptions/members" component={RouterLink} to="/admin/subscriptions/members" />
      </Tabs>
    )}
    <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: "#d9e5f7", p: { xs: 3, sm: 4 }, bgcolor: "white" }}>
      <Typography fontWeight={700} sx={{ mb: 1 }}>Chưa có dữ liệu quản trị ở giai đoạn AD0</Typography>
      <Typography color="text.secondary">
        Trang này mới có điều hướng và kiểm tra quyền. Dữ liệu, biểu mẫu và thao tác thật sẽ được nối ở {page.stage}; hiện không hiển thị số liệu mẫu.
      </Typography>
    </Paper>
  </Box>
);

export default AdminStagePage;
