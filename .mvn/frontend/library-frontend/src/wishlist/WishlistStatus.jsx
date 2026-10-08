import { Alert, Button } from "@mui/material";
import { useWishlist } from "./useWishlist";

const WishlistStatus = () => {
  const { entries, loading, error, actionError, refresh } = useWishlist();
  if (error) return <Alert severity="warning" action={<Button color="inherit" onClick={() => refresh().catch(() => {})}>Thử lại</Button>}>
    Không tải được trạng thái yêu thích: {error}
  </Alert>;
  if (actionError) return <Alert severity="error">Không cập nhật được sách yêu thích: {actionError}</Alert>;
  if (loading && entries === null) return <p role="status" className="text-sm text-slate-500">Đang tải sách yêu thích...</p>;
  return null;
};

export default WishlistStatus;
