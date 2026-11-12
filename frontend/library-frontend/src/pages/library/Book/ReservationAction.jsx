import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import { Link } from "react-router-dom";
import { loansApi } from "../../../api/loans.js";
import { reservationsApi } from "../../../api/reservations.js";
import { canCreateReservation } from "../MyReservations/reservationRules.js";

const ReservationAction = ({ book }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [membershipCheck, setMembershipCheck] = useState(null);
  const canReserveBook = canCreateReservation(book);
  const currentMembershipCheck =
    membershipCheck?.bookId === book?.id ? membershipCheck : null;
  const membershipStatus = currentMembershipCheck?.status ?? "checking";
  const membershipError = currentMembershipCheck?.error ?? "";

  useEffect(() => {
    if (!canReserveBook) return undefined;

    const controller = new AbortController();

    loansApi
      .activeSubscription({ signal: controller.signal })
      .then(() =>
        setMembershipCheck({ bookId: book.id, status: "active", error: "" }),
      )
      .catch((failure) => {
        if (controller.signal.aborted) return;
        if (failure.status === 404) {
          setMembershipCheck({ bookId: book.id, status: "missing", error: "" });
          return;
        }
        setMembershipCheck({
          bookId: book.id,
          status: "error",
          error: failure.message,
        });
      });

    return () => controller.abort();
  }, [canReserveBook, book?.id]);

  if (!canReserveBook) return null;

  if (membershipStatus === "checking" || membershipStatus === "idle") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 1 }}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          Đang kiểm tra gói thành viên để đặt giữ sách…
        </Typography>
      </Box>
    );
  }

  if (membershipStatus === "missing") {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <Box>
          Bạn cần có gói thành viên đang hoạt động để đặt giữ sách.
          <Button
            component={Link}
            to="/user/subscriptions"
            size="small"
            sx={{
              display: "block",
              mt: 0.5,
              fontWeight: 750,
              textTransform: "none",
            }}
          >
            Xem và đăng ký gói thành viên
          </Button>
        </Box>
      </Alert>
    );
  }

  if (membershipStatus === "error") {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        Không kiểm tra được gói thành viên: {membershipError}
      </Alert>
    );
  }

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      await reservationsApi.create(book.id, notes.trim());
      setCompleted(true);
      setOpen(false);
    } catch (failure) {
      if (
        failure.status === 400 &&
        failure.message?.includes("gói thành viên đang hoạt động")
      ) {
        setMembershipCheck({ bookId: book.id, status: "missing", error: "" });
        setOpen(false);
        return;
      }
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      {completed ? (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Đã tạo đặt giữ thành công!{" "}
          <Button
            component={Link}
            to="/user/my-reservations"
            size="small"
            sx={{ fontWeight: 750, textTransform: "none", ml: 1 }}
          >
            Xem vị trí hàng đợi →
          </Button>
        </Alert>
      ) : (
        <Button
          variant="contained"
          color="primary"
          startIcon={<EventAvailableRoundedIcon />}
          onClick={() => {
            setError("");
            setOpen(true);
          }}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            px: 2.5,
            py: 1,
            boxShadow: "0 2px 8px rgba(23,105,255,0.25)",
          }}
        >
          Đặt giữ sách (Xếp hàng)
        </Button>
      )}

      {/* Dialog đặt giữ */}
      <Dialog
        open={open}
        onClose={busy ? undefined : () => setOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 750, color: "#1b2e27" }}>
            Đặt giữ cuốn sách này
          </Typography>
          <IconButton
            size="small"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: "#f8fafc",
                borderRadius: 2,
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 750, color: "#1e293b" }}
              >
                {book.title}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Tác giả: {book.author}
              </Typography>
            </Box>

            <Alert
              severity="info"
              sx={{ borderRadius: 2, fontSize: "0.8125rem" }}
            >
              Sách hiện đã hết bản sao sẵn có. Khi bạn xác nhận, hệ thống sẽ tự
              động xếp bạn vào danh sách chờ nhận sách khi có độc giả hoàn trả.
            </Alert>

            <TextField
              fullWidth
              size="small"
              multiline
              minRows={2}
              label="Ghi chú (không bắt buộc)"
              placeholder="Ghi chú thêm nếu cần..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            disabled={busy}
            onClick={() => setOpen(false)}
            sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
          >
            Hủy
          </Button>
          <Button
            disabled={busy}
            variant="contained"
            onClick={create}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 2.5,
            }}
          >
            {busy ? "Đang xử lý…" : "Xác nhận đặt giữ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReservationAction;
