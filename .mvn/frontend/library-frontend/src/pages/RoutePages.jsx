import { Box, Button, Paper, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LockPersonRoundedIcon from "@mui/icons-material/LockPersonRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import { useAuth } from "../auth/useAuth";

const Page = ({ code, title, description, icon: Icon, children }) => (
  <Box
    component="main"
    sx={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 15% 20%, #eff6ff 0%, #f8fafc 90%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      px: { xs: 2, sm: 4 },
      py: 8,
    }}
  >
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: 580,
        p: { xs: 4, sm: 6 },
        borderRadius: 4.5,
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 12px 32px -8px rgba(0, 0, 0, 0.08)",
        textAlign: "center",
      }}
    >
      {Icon && (
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3.5,
            bgcolor: "rgba(23, 105, 255, 0.1)",
            color: "#1769ff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2.5,
          }}
        >
          <Icon sx={{ fontSize: 36 }} />
        </Box>
      )}

      {code && (
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            color: "#1769ff",
            letterSpacing: "-1px",
            mb: 1,
          }}
        >
          {code}
        </Typography>
      )}

      <Typography
        variant="h4"
        sx={{ fontWeight: 800, color: "#0f172a", mb: 1.5 }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        sx={{ color: "#64748b", mb: 4, lineHeight: 1.6 }}
      >
        {description}
      </Typography>

      {children}
    </Paper>
  </Box>
);

export { LandingPage } from "./Home/LandingPage";

export const ComingSoonPage = () => (
  <Page
    title="Chức năng đang phát triển"
    description="Phân hệ này đang được hoàn thiện và sẽ ra mắt trong bản cập nhật tiếp theo."
    icon={ConstructionRoundedIcon}
  >
    <Button
      variant="contained"
      component={RouterLink}
      to="/user"
      sx={{ borderRadius: 2.5, fontWeight: 600, textTransform: "none", px: 3 }}
    >
      Về trang Tổng quan
    </Button>
  </Page>
);

export const ForbiddenPage = () => (
  <Page
    code="403"
    title="Không có quyền truy cập"
    description="Tài khoản hiện tại của bạn không được cấp quyền để truy cập vào khu vực này. Vui lòng liên hệ Quản trị viên nếu đây là lỗi."
    icon={LockPersonRoundedIcon}
  >
    <Button
      variant="contained"
      component={RouterLink}
      to="/"
      sx={{ borderRadius: 2.5, fontWeight: 600, textTransform: "none", px: 3 }}
    >
      Quay về trang chủ
    </Button>
  </Page>
);

export const NotFoundPage = () => (
  <Page
    code="404"
    title="Không tìm thấy trang"
    description="Địa chỉ bạn đang cố truy cập không tồn tại, đã bị gỡ bỏ hoặc đã thay đổi đường dẫn."
    icon={SearchOffRoundedIcon}
  >
    <Button
      variant="contained"
      component={RouterLink}
      to="/"
      sx={{ borderRadius: 2.5, fontWeight: 600, textTransform: "none", px: 3 }}
    >
      Quay về trang chủ
    </Button>
  </Page>
);
