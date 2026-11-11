import { useCallback, useEffect, useRef, useState } from "react";
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
  const roleRefreshPending = useRef(false);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setChecking(false);
  }, []);

  const loadProfile = useCallback(async (options) => {
    const profile = await api.get("/api/users/profile", options);
    const nextUser = safeProfile(profile);
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    const handleExpired = () => signOut();
    window.addEventListener("library:session-expired", handleExpired);
    return () =>
      window.removeEventListener("library:session-expired", handleExpired);
  }, [signOut]);

  useEffect(() => {
    const handleForbidden = (event) => {
      if (
        event.detail?.path === "/api/users/profile" ||
        roleRefreshPending.current ||
        !tokenStore.get()
      )
        return;
      roleRefreshPending.current = true;
      loadProfile()
        .catch((error) => {
          if ([400, 401, 403, 404].includes(error.status)) signOut();
        })
        .finally(() => {
          roleRefreshPending.current = false;
        });
    };
    window.addEventListener("library:access-forbidden", handleForbidden);
    return () =>
      window.removeEventListener("library:access-forbidden", handleForbidden);
  }, [loadProfile, signOut]);

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
      const nextUser = await loadProfile();
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
    refreshProfile: loadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
