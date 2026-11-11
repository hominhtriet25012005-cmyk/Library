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
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { api } from "../../api/client";
import AuthShell from "./AuthShell";
import { validateNewPassword } from "./passwordRules";

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const passwordError = validateNewPassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (cause) {
      setError(
        cause.message && !/^HTTP \d+$/.test(cause.message)
          ? cause.message
          : "Không thể đặt lại mật khẩu. Vui lòng yêu cầu liên kết mới.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Đặt lại mật khẩu mới"
      subtitle="Nhập mật khẩu mới an toàn cho tài khoản độc giả của bạn."
      maxWidth={460}
    >
      {!token ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Thiếu mã xác thực đặt lại mật khẩu. Vui lòng mở đúng liên kết được
            gửi qua email.
          </Alert>
          <Button
            component={RouterLink}
            to="/forgot-password"
            variant="outlined"
            fullWidth
            sx={{
              py: 1.3,
              borderRadius: 2.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Yêu cầu liên kết mới
          </Button>
        </Box>
      ) : done ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            Thiết lập lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới
            này để đăng nhập ngay bây giờ.
          </Alert>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            fullWidth
            sx={{
              py: 1.35,
              borderRadius: 2.5,
              fontWeight: 700,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(23, 105, 255, 0.25)",
            }}
          >
            Tiến hành đăng nhập
          </Button>
        </Box>
      ) : (
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

          {/* Mật khẩu mới */}
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
              Mật khẩu mới <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <TextField
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
              autoComplete="new-password"
              helperText="Mật khẩu phải có từ 8 đến 72 ký tự."
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Hiện hoặc ẩn mật khẩu mới"
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
          </Box>

          {/* Xác nhận mật khẩu mới */}
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
              Xác nhận mật khẩu mới <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <TextField
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
              fullWidth
              autoComplete="new-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Hiện hoặc ẩn mật khẩu xác nhận"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        edge="end"
                        size="small"
                        sx={{ color: "text.secondary" }}
                      >
                        {showConfirm ? (
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
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={busy}
            startIcon={<LockResetRoundedIcon />}
            sx={{
              py: 1.35,
              borderRadius: 2.5,
              fontWeight: 700,
              fontSize: "0.95rem",
              textTransform: "none",
              mt: 0.5,
              boxShadow: "0 4px 14px rgba(23, 105, 255, 0.25)",
            }}
          >
            {busy ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
          </Button>

          <Box sx={{ textAlign: "center", pt: 1 }}>
            <RouterLink
              to="/login"
              style={{
                color: "#1769ff",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              ← Quay lại trang đăng nhập
            </RouterLink>
          </Box>
        </Box>
      )}
    </AuthShell>
  );
};

export default ResetPasswordPage;
