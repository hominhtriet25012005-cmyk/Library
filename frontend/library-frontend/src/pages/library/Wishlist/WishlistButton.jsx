import Button from "@mui/material/Button";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteIcon from "@mui/icons-material/FavoriteRounded";
import { useWishlist } from "./useWishlist";

const WishlistButton = ({ bookId, fullWidth = false, sx = {} }) => {
  const { entries, savedIds, loading, error, busyBookId, add, remove } =
    useWishlist();
  const saved = savedIds.has(Number(bookId));
  const disabled =
    entries === null || loading || Boolean(error) || busyBookId !== null;

  const handleClick = () => {
    if (saved) remove(bookId).catch(() => {});
    else add(bookId).catch(() => {});
  };

  return (
    <Button
      variant={saved ? "contained" : "outlined"}
      fullWidth={fullWidth}
      startIcon={saved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      disabled={disabled}
      onClick={handleClick}
      aria-label={saved ? "Xóa khỏi sách yêu thích" : "Thêm vào sách yêu thích"}
      sx={{
        borderRadius: "10px",
        textTransform: "none",
        fontWeight: 700,
        px: 2.5,
        py: 1,
        ...sx,
      }}
    >
      {busyBookId === bookId
        ? "Đang cập nhật..."
        : saved
          ? "Bỏ yêu thích"
          : "Yêu thích"}
    </Button>
  );
};

export default WishlistButton;
