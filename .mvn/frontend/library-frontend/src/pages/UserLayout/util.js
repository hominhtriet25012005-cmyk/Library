export const isActive = (path, location) => {
  console.log("checking active for path:", path, "with location:", location);
  if (path == "/") {
    return location?.pathname === "/";
  }
  return location?.pathname.startsWith(path);
};
