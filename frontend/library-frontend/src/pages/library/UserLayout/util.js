export const isActive = (path, location) => {
  return (
    location?.pathname === path ||
    (path !== "/user" && location?.pathname.startsWith(`${path}/`))
  );
};
