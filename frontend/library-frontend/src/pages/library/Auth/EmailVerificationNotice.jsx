import { useState } from "react";
import { Alert, Button, Stack } from "@mui/material";
import { api } from "../../../api/client.js";
import { useAuth } from "../../../auth/useAuth.js";

export default function EmailVerificationNotice({ showVerified = false }) {
  const { user, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sentAt, setSentAt] = useState(0);
  if (!user) return null;
  if (user.verified) return showVerified ? <Alert severity="success">Email đã được xác minh.</Alert> : null;

  const perform = async (resend) => {
    if (busy) return;
    if (resend && Date.now() - sentAt < 60000) {
      setMessage("Vui lòng chờ ít nhất một phút trước khi yêu cầu gửi lại.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (resend) {
        const result = await api.post("/auth/verification-email", { email: user.email });
        setSentAt(Date.now());
        setMessage(result.message + " Hãy kiểm tra cả thư mục thư rác.");
      } else {
        const profile = await refreshProfile();
        if (!profile.verified) setMessage("Email vẫn chưa được xác minh. Hãy mở liên kết trong thư và xác nhận.");
      }
    } catch (failure) {
      setError(failure.message || "Chưa thể xử lý yêu cầu. Vui lòng thử lại.");
    } finally { setBusy(false); }
  };

  return <Stack spacing={1} sx={{ mb: 2 }}>
    <Alert severity="info">
      Email {user.email} chưa được xác minh. Bạn vẫn sử dụng thư viện bình thường;
      hãy xác minh để nhận thông báo qua email.
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button disabled={busy} onClick={() => perform(true)}>Gửi email xác minh</Button>
        <Button disabled={busy} onClick={() => perform(false)}>Tôi đã xác minh — cập nhật</Button>
      </Stack>
    </Alert>
    {message && <Alert severity="info">{message}</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
  </Stack>;
}
