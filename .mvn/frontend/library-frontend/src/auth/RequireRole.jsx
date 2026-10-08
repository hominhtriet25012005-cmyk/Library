import { CircularProgress, Box } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { resolveAccess } from "./access";

export const RequireRole = ({ role }) => {
  const { user, checking } = useAuth();
  const location = useLocation();
  const access = resolveAccess({ user, checking, role });

  if (access === "checking") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress aria-label="Đang xác minh phiên đăng nhập" />
      </Box>
    );
  }
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
