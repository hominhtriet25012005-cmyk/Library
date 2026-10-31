export const resolveAccess = ({ checking, user, role }) => {
  if (checking) return "checking";
  if (!user) return "login";
  const allowedRoles = Array.isArray(role) ? role : [role];
  if (!user.role || !allowedRoles.includes(user.role)) return "forbidden";
  return "allow";
};

export const safeReturnPath = (path) =>
  typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
    ? path
    : null;
