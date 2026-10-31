import { useCallback, useEffect, useMemo, useState } from "react";
import { loadWishlistPages, wishlistApi } from "../api/wishlist";
import { WishlistContext } from "./WishlistContext";

export const WishlistProvider = ({ children }) => {
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyBookId, setBusyBookId] = useState(null);

  const refresh = useCallback(async (options = {}) => {
    setLoading(true);
    setError("");
    try {
      const result = await loadWishlistPages(wishlistApi.list, options);
      if (!options.signal?.aborted) setEntries(result);
      return result;
    } catch (failure) {
      if (failure.name !== "AbortError") setError(failure.message);
      throw failure;
    } finally {
      if (!options.signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadWishlistPages(wishlistApi.list, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setEntries(result);
      })
      .catch((failure) => {
        if (!controller.signal.aborted && failure.name !== "AbortError")
          setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const change = useCallback(
    async (bookId, operation, notes = "") => {
      if (busyBookId !== null) return;
      setBusyBookId(bookId);
      setActionError("");
      try {
        if (operation === "add") await wishlistApi.add(bookId, notes);
        else await wishlistApi.remove(bookId);
        await refresh();
      } catch (failure) {
        setActionError(failure.message);
        throw failure;
      } finally {
        setBusyBookId(null);
      }
    },
    [busyBookId, refresh],
  );

  const savedIds = useMemo(
    () => new Set((entries ?? []).map((entry) => entry.book?.id)),
    [entries],
  );
  const value = {
    entries,
    savedIds,
    loading,
    error,
    actionError,
    busyBookId,
    refresh: () => refresh(),
    add: (bookId, notes) => change(bookId, "add", notes),
    remove: (bookId) => change(bookId, "remove"),
  };
  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
