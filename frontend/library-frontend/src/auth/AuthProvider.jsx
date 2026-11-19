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
  verified: profile.verified === true,
});

const staleSessionError = () => new DOMException(
  "Phiên đã thay đổi; bỏ qua phản hồi cũ.", "AbortError",
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const roleRefreshPending = useRef(false);
  const sessionVersion = useRef(0);

  const signOut = useCallback(() => {
    sessionVersion.current += 1;
    roleRefreshPending.current = false;
    tokenStore.clear();
    setUser(null);
    setProfileLoadFailed(false);
    setChecking(false);
  }, []);

  const loadProfile = useCallback(async (options) => {
    const version = sessionVersion.current;
    const token = tokenStore.get();
    if (!token) throw staleSessionError();
    let profile;
    try {
      profile = await api.get("/api/users/profile", options);
    } catch (error) {
      if (version !== sessionVersion.current || token !== tokenStore.get()) throw staleSessionError();
      throw error;
    }
    if (options?.signal?.aborted || version !== sessionVersion.current || token !== tokenStore.get()) {
      throw staleSessionError();
    }
    const nextUser = safeProfile(profile);
    setUser(nextUser);
    setProfileLoadFailed(false);
    return nextUser;
  }, []);

  const retryProfile = useCallback(async () => {
    const version = sessionVersion.current;
    if (!tokenStore.get()) {
      signOut();
      return null;
    }

    setChecking(true);
    setProfileLoadFailed(false);
    try {
      return await loadProfile();
    } catch (error) {
      if (version !== sessionVersion.current || error.name === "AbortError") throw error;
      if (error.status === 401) signOut();
      else setProfileLoadFailed(true);
      throw error;
    } finally {
      if (version === sessionVersion.current) setChecking(false);
    }
  }, [loadProfile, signOut]);

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
      const version = sessionVersion.current;
      loadProfile()
        .catch((error) => {
          if (version !== sessionVersion.current || error.name === "AbortError") return;
          if ([400, 401, 403, 404].includes(error.status)) signOut();
        })
        .finally(() => {
          if (version === sessionVersion.current) roleRefreshPending.current = false;
        });
    };
    window.addEventListener("library:access-forbidden", handleForbidden);
    return () =>
      window.removeEventListener("library:access-forbidden", handleForbidden);
  }, [loadProfile, signOut]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    const version = sessionVersion.current;
    const controller = new AbortController();
    loadProfile({ signal: controller.signal })
      .catch((error) => {
        if (controller.signal.aborted || error.name === "AbortError" || version !== sessionVersion.current) return;
        if (error.status === 401) signOut();
        else setProfileLoadFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted && version === sessionVersion.current) setChecking(false);
      });
    return () => controller.abort();
  }, [signOut, loadProfile]);

  const authenticate = async (endpoint, data) => {
    const version = ++sessionVersion.current;
    roleRefreshPending.current = false;
    setProfileLoadFailed(false);
    const response = await api.post(endpoint, data);
    if (version !== sessionVersion.current) throw staleSessionError();
    if (!response?.jwt)
      throw new Error("Máy chủ không trả về phiên đăng nhập hợp lệ.");
    tokenStore.set(response.jwt);
    setUser(null);
    setChecking(true);
    setProfileLoadFailed(false);
    try {
      const nextUser = await loadProfile();
      if (version !== sessionVersion.current) throw staleSessionError();
      setChecking(false);
      return nextUser;
    } catch (error) {
      if (version !== sessionVersion.current || error.name === "AbortError") throw error;
      error.authStage = "profile";
      if (error.status === 401) signOut();
      else {
        setProfileLoadFailed(true);
        setChecking(false);
      }
      throw error;
    }
  };

  const value = {
    user,
    checking,
    profileLoadFailed,
    signIn: (data) => authenticate("/auth/login", data),
    signUp: (data) => authenticate("/auth/signup", data),
    signOut,
    refreshProfile: loadProfile,
    retryProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
