import { useState } from "react";
import { Alert, Button, TextField } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../../api/client";
import AuthShell from "./AuthShell";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch {
      setError("Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle="Nhập email để nhận liên kết đặt lại mật khẩu."
    >
      {sent ? (
        <Alert severity="success">
          Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư
          của bạn.
        </Alert>
      ) : (
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
          <Button type="submit" variant="contained" fullWidth disabled={busy}>
            {busy ? "Đang gửi..." : "Gửi liên kết"}
          </Button>
        </form>
      )}
      <p className="text-center text-sm mt-5">
        <RouterLink to="/login" className="text-[#1769ff] hover:underline">
          Quay lại đăng nhập
        </RouterLink>
      </p>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
