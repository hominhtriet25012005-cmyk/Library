import { useState } from "react";
import { Alert, Button, TextField } from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import AuthShell from "./AuthShell";

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
      title="Đặt lại mật khẩu"
      subtitle="Chọn mật khẩu mới cho tài khoản của bạn."
    >
      {!token ? (
        <Alert severity="error">
          Thiếu mã đặt lại mật khẩu. Hãy mở liên kết được gửi qua email.
        </Alert>
      ) : done ? (
        <Alert severity="success">
          Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.
        </Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Mật khẩu mới"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
            autoComplete="new-password"
          />
          <TextField
            label="Xác nhận mật khẩu"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            fullWidth
            autoComplete="new-password"
          />
          <Button type="submit" variant="contained" fullWidth disabled={busy}>
            {busy ? "Đang lưu..." : "Đặt lại mật khẩu"}
          </Button>
        </form>
      )}
      <p className="text-center text-sm mt-5">
        <RouterLink to="/login" className="text-[#1769ff] hover:underline">
          Đến trang đăng nhập
        </RouterLink>
      </p>
    </AuthShell>
  );
};

export default ResetPasswordPage;
