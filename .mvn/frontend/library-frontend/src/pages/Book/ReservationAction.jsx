import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { Link } from "react-router-dom";
import { reservationsApi } from "../../api/reservations.js";
import { canCreateReservation } from "../My Reservation/reservationRules.js";

const ReservationAction = ({ book }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!canCreateReservation(book)) return null;

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      await reservationsApi.create(book.id, notes.trim());
      setCompleted(true);
      setOpen(false);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4">
      {completed ? (
        <Alert severity="success">
          Đã tạo đặt giữ.{" "}
          <Link to="/user/my-reservations" className="font-semibold underline">
            Xem hàng đợi
          </Link>
        </Alert>
      ) : (
        <Button
          variant="outlined"
          onClick={() => {
            setError("");
            setOpen(true);
          }}
        >
          Đặt giữ sách
        </Button>
      )}
      <Dialog
        open={open}
        onClose={busy ? undefined : () => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Đặt giữ sách</DialogTitle>
        <DialogContent className="space-y-4">
          <p className="text-slate-700">{book.title}</p>
          <p className="text-sm text-slate-600">
            Sách hiện hết bản. Backend sẽ kiểm tra lại tình trạng sách, lượt đặt
            giữ trùng và giới hạn của tài khoản khi bạn xác nhận.
          </p>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Ghi chú (không bắt buộc)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setOpen(false)}>
            Đóng
          </Button>
          <Button disabled={busy} variant="contained" onClick={create}>
            {busy ? "Đang xử lý..." : "Xác nhận đặt giữ"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ReservationAction;
