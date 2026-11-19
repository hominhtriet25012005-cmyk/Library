import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { resolveAccess } from "./access";

export const RequireRole = ({ role }) => {
  const { user, checking, profileLoadFailed, retryProfile } = useAuth();
  const location = useLocation();
  const access = resolveAccess({ user, checking, role });

  if (access === "checking") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress aria-label="Đang xác minh phiên đăng nhập" />
      </Box>
    );
  }
  if (profileLoadFailed && !user)
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeContent: "center",
          justifyItems: "center",
          gap: 2,
          px: 2,
        }}
      >
        <Alert severity="warning" sx={{ maxWidth: 520 }}>
          Chưa tải được hồ sơ tài khoản. Phiên đăng nhập vẫn được giữ; hãy kiểm tra kết nối rồi thử lại.
        </Alert>
        <Button
          variant="contained"
          disabled={checking}
          onClick={() => retryProfile().catch(() => {})}
        >
          Thử tải lại hồ sơ
        </Button>
      </Box>
    );
  if (access === "login")
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  if (access === "forbidden") return <Navigate to="/403" replace />;
  return <Outlet />;
};
