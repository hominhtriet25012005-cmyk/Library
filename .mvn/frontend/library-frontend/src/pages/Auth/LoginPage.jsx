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
import { useAuth } from "../../auth/useAuth";
import AuthShell from "./AuthShell";
import { safeReturnPath } from "../../auth/access";

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
          ? "Email hoặc mật khẩu không chính xác."
          : "Không thể kết nối đến máy chủ. Vui lòng kiểm tra và thử lại.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập hệ thống"
      subtitle="Đăng nhập để mượn sách, quản lý gói thành viên và tài khoản bạn đọc."
    >
      <Box
        component="form"
        onSubmit={submit}
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Địa chỉ Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          fullWidth
          autoComplete="email"
          placeholder="example@library.edu.vn"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
        />

        <Box>
          <TextField
            label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            placeholder="••••••••"
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Hiện hoặc ẩn mật khẩu"
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      sx={{ color: "#94a3b8" }}
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
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <RouterLink
              to="/forgot-password"
              style={{
                fontSize: "0.875rem",
                color: "#1769ff",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Quên mật khẩu?
            </RouterLink>
          </Box>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={busy}
          startIcon={<LoginRoundedIcon />}
          sx={{
            py: 1.3,
            borderRadius: 2.5,
            fontWeight: 700,
            fontSize: "0.95rem",
            textTransform: "none",
            mt: 0.5,
          }}
        >
          {busy ? "Đang xác thực..." : "Đăng nhập ngay"}
        </Button>

        <Box sx={{ textAlign: "center", pt: 1 }}>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Chưa có tài khoản độc giả?{" "}
            <RouterLink
              to="/register"
              style={{
                color: "#1769ff",
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
