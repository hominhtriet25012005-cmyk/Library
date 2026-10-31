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
        cause.status === 400
          ? "Không thể đăng ký. Vui lòng kiểm tra thông tin hoặc dùng email khác."
          : "Không thể tạo tài khoản lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Đăng ký tài khoản"
      subtitle="Tạo tài khoản độc giả để mượn sách và trải nghiệm dịch vụ thư viện."
    >
      <Box
        component="form"
        onSubmit={submit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Họ và tên bạn đọc"
          value={form.fullName}
          onChange={update("fullName")}
          slotProps={{
            htmlInput: { maxLength: 255 },
            inputLabel: { shrink: true },
          }}
          required
          fullWidth
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
        />

        <TextField
          label="Địa chỉ Email"
          type="email"
          value={form.email}
          onChange={update("email")}
          slotProps={{
            htmlInput: { maxLength: 255 },
            inputLabel: { shrink: true },
          }}
          required
          fullWidth
          autoComplete="email"
          placeholder="example@library.edu.vn"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
        />

        <TextField
          label="Số điện thoại (không bắt buộc)"
          value={form.phone}
          onChange={update("phone")}
          slotProps={{
            htmlInput: { maxLength: 30 },
            inputLabel: { shrink: true },
          }}
          fullWidth
          autoComplete="tel"
          placeholder="0912 345 678"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
        />

        <TextField
          label="Mật khẩu"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={update("password")}
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

        <TextField
          label="Xác nhận mật khẩu"
          type={showConfirm ? "text" : "password"}
          value={form.confirm}
          onChange={update("confirm")}
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
          startIcon={<PersonAddRoundedIcon />}
          sx={{
            py: 1.3,
            borderRadius: 2.5,
            fontWeight: 700,
            fontSize: "0.95rem",
            textTransform: "none",
            mt: 1,
          }}
        >
          {busy ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
        </Button>

        <Box sx={{ textAlign: "center", pt: 1 }}>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
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
