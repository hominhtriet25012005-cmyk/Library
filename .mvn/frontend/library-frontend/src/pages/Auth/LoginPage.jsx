import { useState } from "react";
import { Alert, Button, TextField } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import AuthShell from "./AuthShell";
import { safeReturnPath } from "../../auth/access";

const LoginPage = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          ? "Email hoặc mật khẩu không đúng."
          : "Không thể đăng nhập. Vui lòng kiểm tra kết nối và thử lại.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Truy cập tài khoản thư viện của bạn."
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          fullWidth
          autoComplete="current-password"
        />
        <div className="text-right">
          <RouterLink
            to="/forgot-password"
            className="text-sm text-[#1769ff] hover:underline"
          >
            Quên mật khẩu?
          </RouterLink>
        </div>
        <Button type="submit" variant="contained" fullWidth disabled={busy}>
          {busy ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
        <p className="text-center text-sm text-slate-600">
          Chưa có tài khoản?{" "}
          <RouterLink
            to="/register"
            className="font-semibold text-[#1769ff] hover:underline"
          >
            Đăng ký
          </RouterLink>
        </p>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
