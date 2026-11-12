import { useContext } from "react";
import { WishlistContext } from "./WishlistContext";

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("WishlistProvider chưa được khởi tạo.");
  return context;
};
