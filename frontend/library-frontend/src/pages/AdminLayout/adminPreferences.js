const key = "library.admin.density";

export const readAdminDensity = (storage) => {
  try {
    return (storage ?? globalThis.localStorage)?.getItem(key) === "compact"
      ? "compact"
      : "comfortable";
  } catch {
    return "comfortable";
  }
};

export const saveAdminDensity = (density, storage) => {
  if (!["compact", "comfortable"].includes(density))
    throw new Error("Mật độ hiển thị không hợp lệ.");
  try {
    (storage ?? globalThis.localStorage)?.setItem(key, density);
  } catch {
    /* Private browsing may block storage. */
  }
};
