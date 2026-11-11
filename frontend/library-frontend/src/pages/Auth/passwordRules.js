export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export const validateNewPassword = (password) => {
  const value = String(password ?? "");
  if (value.length < PASSWORD_MIN_LENGTH)
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  if (value.length > PASSWORD_MAX_LENGTH) return "Mật khẩu không quá 72 ký tự.";
  return "";
};
