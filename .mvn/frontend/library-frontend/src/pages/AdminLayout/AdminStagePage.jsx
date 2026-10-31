import { Box, Chip, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import { PageHeader, EmptyState } from "../../components/common";

const AdminStagePage = ({ item, page }) => {
  const data = item || page || {};
  const title = data.title || "Tính năng đang phát triển";
  const stage = data.stage || "AD0";
  const description =
    data.description ||
    "Trang quản trị này đang được chuẩn bị và sẽ ra mắt trong giai đoạn tiếp theo.";
  const path = data.path || data.to || "";

  return (
    <Box
      component="section"
      aria-label={title}
      sx={{
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
        px: { xs: 2, sm: 3, md: 3.5 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <PageHeader title={title} subtitle={description} badge={stage} />

      {path.startsWith("/admin/subscriptions/") && (
        <Tabs
          value={path}
          aria-label="Tab gói thành viên"
          sx={{
            mb: 3,
            borderBottom: "1px solid #e2e8f0",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
            },
          }}
        >
          <Tab
            label="Các gói"
            value="/admin/subscriptions/plans"
            component={RouterLink}
            to="/admin/subscriptions/plans"
          />
          <Tab
            label="Thành viên đăng ký"
            value="/admin/subscriptions/members"
            component={RouterLink}
            to="/admin/subscriptions/members"
          />
        </Tabs>
      )}

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          borderColor: "#e2e8f0",
          p: { xs: 3, sm: 5 },
          bgcolor: "#fff",
          textAlign: "center",
        }}
      >
        <EmptyState
          icon={ConstructionRoundedIcon}
          title={`Giai đoạn chuẩn bị dữ liệu (${stage})`}
          description={`Trang ${title} đã được cấu hình điều hướng an toàn và phân quyền người dùng. Dữ liệu và biểu mẫu quản trị thật sẽ được kết nối chính thức khi hoàn thiện module tương ứng.`}
        />
      </Paper>
    </Box>
  );
};

export default AdminStagePage;
