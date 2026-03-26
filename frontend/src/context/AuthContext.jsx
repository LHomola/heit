import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // When loading for the first time, check if a token is already in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("heit_token");
    if (!stored) {
      setLoading(false);
      return;
    }
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(res => (res.ok ? res.json() : null))
      .then(user => {
        if (user) {
          setCurrentUser(user);
          setToken(stored);
        } else {
          localStorage.removeItem("heit_token");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function login(user, accessToken) {
    setCurrentUser(user);
    setToken(accessToken);
    localStorage.setItem("heit_token", accessToken);
  }

  function logout() {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem("heit_token");
  }

  // Don't show login page when refreshing
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ currentUser, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
