import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, getToken, setToken } from "./api.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [token, setTok] = useState(getToken());
  const [email, setEmail] = useState(
    localStorage.getItem("KRinterior_cms_email") || "",
  );
  const logout = useCallback(() => {
    setToken(null);
    setTok(null);
  }, []);
  useEffect(() => {
    window.addEventListener("cms-unauthorized", logout);
    return () => window.removeEventListener("cms-unauthorized", logout);
  }, [logout]);
  const login = async (em, pw) => {
    const r = await api.login(em, pw);
    setToken(r.token);
    localStorage.setItem("KRinterior_cms_email", r.email);
    setTok(r.token);
    setEmail(r.email);
  };
  return (
    <Ctx.Provider value={{ token, email, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function RequireAuth({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  return token ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}
