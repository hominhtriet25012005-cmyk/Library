import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { api } from "../../api/client";
import AuthShell from "./AuthShell";

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
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch {
      setError(
        "Liên kết không hợp lệ, đã hết hạn hoặc máy chủ chưa sẵn sàng. Vui lòng yêu cầu liên kết mới.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Đặt lại mật khẩu mới"
      subtitle="Nhập mật khẩu mới an toàn cho tài khoản độc giả của bạn."
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
              py: 1.2,
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
              py: 1.3,
              borderRadius: 2.5,
              fontWeight: 700,
              textTransform: "none",
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
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Mật khẩu mới"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            placeholder="••••••••"
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Hiện hoặc ẩn mật khẩu mới"
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

          <TextField
            label="Xác nhận mật khẩu mới"
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            placeholder="••••••••"
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Hiện hoặc ẩn mật khẩu xác nhận"
                      onClick={() => setShowConfirm((prev) => !prev)}
                      edge="end"
                      size="small"
                      sx={{ color: "#94a3b8" }}
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
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={busy}
            startIcon={<LockResetRoundedIcon />}
            sx={{
              py: 1.3,
              borderRadius: 2.5,
              fontWeight: 700,
              fontSize: "0.95rem",
              textTransform: "none",
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
