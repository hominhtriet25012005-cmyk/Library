import { useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../../api/client.js";
import { useAuth } from "../../../auth/useAuth.js";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const validToken = /^[A-Za-z0-9_-]{43}$/.test(token);
  const { user, refreshProfile } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sentAt, setSentAt] = useState(0);

  const confirm = async () => {
    if (busy || !validToken || verified) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await api.post("/auth/verify-email", { token });
      setVerified(true);
      window.history.replaceState(null, "", window.location.pathname);
      if (user) {
        try { await refreshProfile(); }
        catch { setMessage("Email đã xác minh. Hồ sơ chưa tải lại được; bạn có thể cập nhật tại trang Hồ sơ."); }
      }
    } catch (failure) { setError(failure.message || "Chưa thể xác minh. Vui lòng thử lại."); }
    finally { setBusy(false); }
  };

  const resend = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (Date.now() - sentAt < 60000) { setMessage("Vui lòng chờ ít nhất một phút trước khi gửi lại."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await api.post("/auth/verification-email", { email: email.trim() });
      setSentAt(Date.now()); setMessage(result.message + " Hãy kiểm tra cả thư mục thư rác.");
    } catch (failure) { setError(failure.message || "Chưa thể gửi yêu cầu. Vui lòng thử lại."); }
    finally { setBusy(false); }
  };

  return <Box sx={{ maxWidth: 560, mx: "auto", p: 3, mt: 6 }}>
    <Paper sx={{ p: 3 }}><Stack spacing={2}>
      <Typography variant="h5">Xác minh địa chỉ email</Typography>
      {verified ? <Alert severity="success">Email trong liên kết đã được xác minh thành công.</Alert> : <>
        {validToken ? <>
          <Typography>Bấm xác nhận để xác minh email trong liên kết. Bạn không cần đăng nhập để thực hiện.</Typography>
          <Button variant="contained" disabled={busy} onClick={confirm}>Xác minh email</Button>
        </> : <Alert severity="warning">Liên kết thiếu mã xác minh hoặc không hợp lệ. Hãy yêu cầu gửi lại email.</Alert>}
        <Box component="form" onSubmit={resend}>
          <Stack spacing={2}>
            <TextField label="Email tài khoản thư viện" type="email" required value={email}
              onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            <Button type="submit" disabled={busy}>Gửi lại email xác minh</Button>
          </Stack>
        </Box>
      </>}
      {message && <Alert severity="info">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <Button component={Link} to={user ? "/user/profile" : "/login"}>
        {user ? "Về hồ sơ tài khoản" : "Đăng nhập"}
      </Button>
    </Stack></Paper>
  </Box>;
}
