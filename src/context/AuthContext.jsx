import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("study-planner-user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((userData) => {
    const userInfo = {
      name: userData.name,
      email: userData.email,
      avatar: userData.name?.charAt(0)?.toUpperCase() || "U",
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem("study-planner-user", JSON.stringify(userInfo));
    setUser(userInfo);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("study-planner-user");
    setUser(null);
  }, []);

  const value = { user, isAuthenticated: !!user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
