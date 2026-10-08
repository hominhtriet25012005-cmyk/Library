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
import { loansApi } from "../../api/loans.js";
import { checkoutDaysForPlan, renewalDays } from "../MyLoans/loanRules.js";

const CheckoutAction = ({ book, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [days, setDays] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const openDialog = async () => {
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const active = await loansApi.activeSubscription();
      const defaultDays = checkoutDaysForPlan(active?.maxDaysPerBook);
      if (!defaultDays)
        throw new Error("Gói hiện tại chưa có hạn mức ngày mượn hợp lệ.");
      setSubscription(active);
      setDays(String(defaultDays));
    } catch (failure) {
      setSubscription(null);
      setError(
        failure.status === 404
          ? "Bạn cần có gói thành viên đang hoạt động để mượn sách."
          : failure.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const checkout = async () => {
    const checkoutDays = renewalDays(days);
    if (checkoutDays === null || checkoutDays > subscription.maxDaysPerBook) {
      setError(`Số ngày mượn phải từ 1 đến ${subscription.maxDaysPerBook}.`);
      return;
    }
    if (notes.length > 500) {
      setError("Ghi chú tối đa 500 ký tự.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await loansApi.checkout(book.id, checkoutDays, notes.trim());
      setCompleted(true);
      setOpen(false);
      onSuccess?.();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 space-y-3">
      {completed ? (
        <Alert severity="success">
          Đã mượn sách thành công.{" "}
          <Link to="/user/my-loans" className="font-semibold underline">
            Xem lượt mượn
          </Link>
        </Alert>
      ) : (
        <Button
          variant="contained"
          disabled={!book.availableCopies}
          onClick={openDialog}
        >
          {book.availableCopies ? "Mượn sách" : "Sách đã hết"}
        </Button>
      )}
      <Dialog
        open={open}
        onClose={busy ? undefined : () => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Mượn sách</DialogTitle>
        <DialogContent className="space-y-4">
          <p className="text-slate-700">{book.title}</p>
          {loading && <p role="status">Đang kiểm tra gói thành viên...</p>}
          {subscription && (
            <>
              <p className="text-sm text-slate-600">
                Gói {subscription.planName || "hiện tại"}: tối đa{" "}
                {subscription.maxDaysPerBook} ngày mỗi sách. Backend sẽ kiểm tra
                lại hạn mức và tình trạng sách khi xác nhận.
              </p>
              <TextField
                fullWidth
                type="number"
                label="Số ngày mượn"
                value={days}
                onChange={(event) => setDays(event.target.value)}
                slotProps={{
                  htmlInput: {
                    min: 1,
                    max: subscription.maxDaysPerBook,
                    step: 1,
                  },
                }}
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Ghi chú (không bắt buộc)"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setOpen(false)}>
            Đóng
          </Button>
          <Button
            variant="contained"
            disabled={loading || busy || !subscription}
            onClick={checkout}
          >
            {busy ? "Đang xử lý..." : "Xác nhận mượn"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CheckoutAction;
