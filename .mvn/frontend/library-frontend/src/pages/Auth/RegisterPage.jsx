import { useState } from "react";
import { Alert, Button, TextField } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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
          : "Không thể đăng ký lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Đăng ký tài khoản"
      subtitle="Tạo tài khoản người dùng thư viện."
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Họ và tên"
          value={form.fullName}
          onChange={update("fullName")}
          inputProps={{ maxLength: 255 }}
          required
          fullWidth
          autoComplete="name"
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={update("email")}
          inputProps={{ maxLength: 255 }}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label="Số điện thoại (không bắt buộc)"
          value={form.phone}
          onChange={update("phone")}
          inputProps={{ maxLength: 30 }}
          fullWidth
          autoComplete="tel"
        />
        <TextField
          label="Mật khẩu"
          type="password"
          value={form.password}
          onChange={update("password")}
          required
          fullWidth
          autoComplete="new-password"
        />
        <TextField
          label="Xác nhận mật khẩu"
          type="password"
          value={form.confirm}
          onChange={update("confirm")}
          required
          fullWidth
          autoComplete="new-password"
        />
        <Button type="submit" variant="contained" fullWidth disabled={busy}>
          {busy ? "Đang tạo tài khoản..." : "Đăng ký"}
        </Button>
        <p className="text-center text-sm text-slate-600">
          Đã có tài khoản?{" "}
          <RouterLink
            to="/login"
            className="font-semibold text-[#1769ff] hover:underline"
          >
            Đăng nhập
          </RouterLink>
        </p>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
