import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider is missing");
  return auth;
};
