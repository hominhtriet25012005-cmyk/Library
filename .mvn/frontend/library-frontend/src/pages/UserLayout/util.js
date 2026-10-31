export const isActive = (path, location) => {
  return (
    location?.pathname === path ||
    (!["/user", "/demo"].includes(path) &&
      location?.pathname.startsWith(`${path}/`))
  );
};

export const navigationPath = (path, preview) =>
  preview ? path.replace(/^\/user(?=\/|$)/, "/demo") : path;
