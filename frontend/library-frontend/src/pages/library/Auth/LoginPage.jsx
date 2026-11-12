import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { useAuth } from "../../../auth/useAuth";
import AuthShell from "./AuthShell";
import { safeReturnPath } from "../../../auth/access";

const LoginPage = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await signIn({ email: email.trim(), password });
      const from = location.state?.from;
      const safeFrom = safeReturnPath(from);
      navigate(safeFrom || (user.role === "ROLE_ADMIN" ? "/admin" : "/user"), {
        replace: true,
      });
    } catch (cause) {
      setError(
        [400, 401, 403].includes(cause.status)
          ? "Tài khoản hoặc mật khẩu không chính xác."
          : "Không thể kết nối đến máy chủ. Vui lòng kiểm tra và thử lại.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Đăng nhập hệ thống" maxWidth={460}>
      <Box
        component="form"
        onSubmit={submit}
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        {error && (
          <Alert
            severity="error"
            sx={{
              borderRadius: 2,
              justifyContent: "center",
              alignItems: "center",
              "& .MuiAlert-icon": {
                mr: 1,
              },
              "& .MuiAlert-message": {
                textAlign: "center",
                flex: "0 1 auto",
              },
            }}
          >
            {error}
          </Alert>
        )}

        {/* Tài khoản */}
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              mb: 0.75,
              fontSize: "0.875rem",
            }}
          >
            Tài khoản <span style={{ color: "#ef4444" }}>*</span>
          </Typography>
          <TextField
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
            autoComplete="email"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.03)"
                    : "#f8fafc",
              },
            }}
          />
        </Box>

        {/* Mật khẩu */}
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              mb: 0.75,
              fontSize: "0.875rem",
            }}
          >
            Mật khẩu <span style={{ color: "#ef4444" }}>*</span>
          </Typography>
          <TextField
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Hiện hoặc ẩn mật khẩu"
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      sx={{ color: "text.secondary" }}
                    >
                      {showPassword ? (
                        <VisibilityOffRoundedIcon fontSize="small" />
                      ) : (
                        <VisibilityRoundedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.03)"
                    : "#f8fafc",
              },
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <RouterLink
              to="/forgot-password"
              style={{
                fontSize: "0.85rem",
                color: "#315B4C",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Quên mật khẩu?
            </RouterLink>
          </Box>
        </Box>

        {/* Nút đăng nhập */}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={busy}
          startIcon={<LoginRoundedIcon />}
          sx={{
            py: 1.35,
            borderRadius: 2.5,
            fontWeight: 700,
            fontSize: "0.95rem",
            textTransform: "none",
            mt: 0.5,
            boxShadow: "0 4px 14px rgba(49, 91, 76, 0.25)",
          }}
        >
          {busy ? "Đang xác thực..." : "Đăng nhập ngay"}
        </Button>

        {/* Chuyển qua đăng ký */}
        <Box sx={{ textAlign: "center", pt: 1.5 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Chưa có tài khoản?{" "}
            <RouterLink
              to="/register"
              style={{
                color: "#315B4C",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Đăng ký tài khoản
            </RouterLink>
          </Typography>
        </Box>
      </Box>
    </AuthShell>
  );
};

export default LoginPage;
