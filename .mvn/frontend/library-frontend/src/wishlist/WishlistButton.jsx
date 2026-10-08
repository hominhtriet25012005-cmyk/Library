import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteIcon from "@mui/icons-material/FavoriteRounded";
import { useWishlist } from "./useWishlist";

const WishlistButton = ({ bookId, withNotes = false, fullWidth = false }) => {
  const { entries, savedIds, loading, error, busyBookId, add, remove } = useWishlist();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const saved = savedIds.has(Number(bookId));
  const disabled = entries === null || loading || Boolean(error) || busyBookId !== null;

  const handleClick = () => {
    if (saved) remove(bookId).catch(() => {});
    else if (withNotes) setDialogOpen(true);
    else add(bookId).catch(() => {});
  };

  const handleAdd = async () => {
    try {
      await add(bookId, notes);
      setDialogOpen(false);
      setNotes("");
    } catch { /* lỗi được hiển thị qua WishlistStatus */ }
  };

  return <>
    <Button variant={saved ? "contained" : "outlined"} fullWidth={fullWidth}
      startIcon={saved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      disabled={disabled} onClick={handleClick} aria-label={saved ? "Xóa khỏi sách yêu thích" : "Thêm vào sách yêu thích"}>
      {busyBookId === bookId ? "Đang cập nhật..." : saved ? "Bỏ yêu thích" : "Yêu thích"}
    </Button>
    {withNotes && <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Thêm sách vào yêu thích</DialogTitle>
      <DialogContent>
        <TextField label="Ghi chú (không bắt buộc)" multiline minRows={3} fullWidth margin="normal"
          value={notes} onChange={(event) => setNotes(event.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
        <Button variant="contained" onClick={handleAdd} disabled={busyBookId !== null}>Lưu sách</Button>
      </DialogActions>
    </Dialog>}
  </>;
};

export default WishlistButton;
