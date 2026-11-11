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
import { Link as RouterLink, useNavigate } from "react-router-dom";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { useAuth } from "../../auth/useAuth";
import AuthShell from "./AuthShell";
import { validateNewPassword } from "./passwordRules";

const RegisterPage = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const passwordError = validateNewPassword(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (form.password !== form.confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signUp({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      navigate("/user", { replace: true });
    } catch (cause) {
      setError(
        cause.message && !/^HTTP \d+$/.test(cause.message)
          ? cause.message
          : "Không thể tạo tài khoản lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Đăng ký tài khoản" maxWidth={480}>
      <Box
        component="form"
        onSubmit={submit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
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

        {/* Họ và tên */}
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
            Họ và tên <span style={{ color: "#ef4444" }}>*</span>
          </Typography>
          <TextField
            value={form.fullName}
            onChange={update("fullName")}
            slotProps={{
              htmlInput: { maxLength: 255 },
            }}
            required
            fullWidth
            autoComplete="name"
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

        {/* Địa chỉ Email */}
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
            Địa chỉ Email <span style={{ color: "#ef4444" }}>*</span>
          </Typography>
          <TextField
            type="email"
            value={form.email}
            onChange={update("email")}
            slotProps={{
              htmlInput: { maxLength: 255 },
            }}
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

        {/* Số điện thoại */}
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
            Số điện thoại
          </Typography>
          <TextField
            value={form.phone}
            onChange={update("phone")}
            slotProps={{
              htmlInput: { maxLength: 30 },
            }}
            fullWidth
            autoComplete="tel"
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
            value={form.password}
            onChange={update("password")}
            required
            fullWidth
            autoComplete="new-password"
            helperText="Mật khẩu phải có từ 8 đến 72 ký tự."
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
        </Box>

        {/* Xác nhận mật khẩu */}
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
            Xác nhận mật khẩu <span style={{ color: "#ef4444" }}>*</span>
          </Typography>
          <TextField
            type={showConfirm ? "text" : "password"}
            value={form.confirm}
            onChange={update("confirm")}
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

        {/* Nút đăng ký */}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={busy}
          startIcon={<PersonAddRoundedIcon />}
          sx={{
            py: 1.35,
            borderRadius: 2.5,
            fontWeight: 700,
            fontSize: "0.95rem",
            textTransform: "none",
            mt: 1,
            boxShadow: "0 4px 14px rgba(23, 105, 255, 0.25)",
          }}
        >
          {busy ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
        </Button>

        {/* Chuyển qua đăng nhập */}
        <Box sx={{ textAlign: "center", pt: 1.5 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Đã có tài khoản bạn đọc?{" "}
            <RouterLink
              to="/login"
              style={{
                color: "#1769ff",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Đăng nhập ngay
            </RouterLink>
          </Typography>
        </Box>
      </Box>
    </AuthShell>
  );
};

export default RegisterPage;
