import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { tokenStore } from "../api/tokenStore";
import { AuthContext } from "./AuthContext";

const safeProfile = (profile) => ({
  id: profile.id,
  email: profile.email,
  fullName: profile.fullName,
  phone: profile.phone,
  role: profile.role,
  lastLogin: profile.lastLogin,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setChecking(false);
  }, []);

  useEffect(() => {
    const handleExpired = () => signOut();
    window.addEventListener("library:session-expired", handleExpired);
    return () =>
      window.removeEventListener("library:session-expired", handleExpired);
  }, [signOut]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    const controller = new AbortController();
    api
      .get("/api/users/profile", { signal: controller.signal })
      .then((profile) => {
        if (!controller.signal.aborted) setUser(safeProfile(profile));
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError")
          signOut();
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, [signOut]);

  const authenticate = async (endpoint, data) => {
    const response = await api.post(endpoint, data);
    if (!response?.jwt)
      throw new Error("Máy chủ không trả về phiên đăng nhập hợp lệ.");
    tokenStore.set(response.jwt);
    try {
      const profile = await api.get("/api/users/profile");
      const nextUser = safeProfile(profile);
      setUser(nextUser);
      setChecking(false);
      return nextUser;
    } catch (error) {
      signOut();
      throw error;
    }
  };

  const value = {
    user,
    checking,
    signIn: (data) => authenticate("/auth/login", data),
    signUp: (data) => authenticate("/auth/signup", data),
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
