import { createContext, useContext, useState, useCallback } from "react";
import { API_URL, saveTokens, clearTokens, getTokens } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("study-planner-user");
    return stored ? JSON.parse(stored) : null;
  });

  const [authError, setAuthError] = useState(null);

  const isAuthenticated = !!user && !!getTokens()?.access;

  const login = useCallback(async (username, password) => {
    setAuthError(null);
    try {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Mensaje genérico — no revela si el usuario existe
        const errorMsg = data.detail || data.non_field_errors?.[0] || "Credenciales inválidas";
        setAuthError(errorMsg);
        return false;
      }

      // Guardar tokens y datos del usuario
      saveTokens(data.tokens);
      const userInfo = {
        id: data.user.id,
        name: data.user.first_name || data.user.username,
        username: data.user.username,
        email: data.user.email,
        avatar: (data.user.first_name || data.user.username)?.charAt(0)?.toUpperCase() || "U",
        limite_diario_horas: data.user.limite_diario_horas,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem("study-planner-user", JSON.stringify(userInfo));
      setUser(userInfo);
      return true;
    } catch {
      setAuthError("Error de conexión con el servidor");
      return false;
    }
  }, []);

  const registro = useCallback(async (formData) => {
    setAuthError(null);
    try {
      const response = await fetch(`${API_URL}/auth/registro/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Extraer primer error
        const errors = [];
        if (data.username) errors.push(data.username[0] || data.username);
        if (data.email) errors.push(data.email[0] || data.email);
        if (data.password) errors.push(data.password[0] || data.password);
        if (data.password_confirm) errors.push(data.password_confirm[0] || data.password_confirm);
        if (data.non_field_errors) errors.push(...data.non_field_errors);
        setAuthError(errors.join(". ") || "Error al crear la cuenta");
        return false;
      }

      // Guardar tokens y datos del usuario
      saveTokens(data.tokens);
      const userInfo = {
        id: data.user.id,
        name: data.user.first_name || data.user.username,
        username: data.user.username,
        email: data.user.email,
        avatar: (data.user.first_name || data.user.username)?.charAt(0)?.toUpperCase() || "U",
        limite_diario_horas: data.user.limite_diario_horas,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem("study-planner-user", JSON.stringify(userInfo));
      setUser(userInfo);
      return true;
    } catch {
      setAuthError("Error de conexión con el servidor");
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setAuthError(null);
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  const value = {
    user,
    isAuthenticated,
    login,
    registro,
    logout,
    authError,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
