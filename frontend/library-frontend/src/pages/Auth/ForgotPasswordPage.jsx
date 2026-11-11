import { useState } from "react";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
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
      title="Khôi phục mật khẩu"
      subtitle="Nhập email đã đăng ký để nhận liên kết thiết lập lại mật khẩu."
      maxWidth={460}
    >
      {sent ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            Nếu email tồn tại trong hệ thống thư viện, liên kết đặt lại mật khẩu
            đã được gửi đến hộp thư của bạn. Vui lòng kiểm tra cả hòm thư Spam
            nếu cần.
          </Alert>
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            fullWidth
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              py: 1.3,
              borderRadius: 2.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Quay lại đăng nhập
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={busy}
            startIcon={<SendRoundedIcon />}
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
            {busy ? "Đang gửi yêu cầu..." : "Gửi liên kết khôi phục"}
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

export default ForgotPasswordPage;
