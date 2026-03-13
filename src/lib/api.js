/**
 * API utility for making authenticated requests.
 * Handles JWT tokens, auto-refresh, and base URL detection.
 */

export const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000/api"
    : "https://mp1backend.onrender.com/api";

/**
 * Obtiene los tokens almacenados.
 */
export function getTokens() {
  const tokens = localStorage.getItem("study-planner-tokens");
  return tokens ? JSON.parse(tokens) : null;
}

/**
 * Guarda los tokens en localStorage.
 */
export function saveTokens(tokens) {
  localStorage.setItem("study-planner-tokens", JSON.stringify(tokens));
}

/**
 * Elimina los tokens de localStorage.
 */
export function clearTokens() {
  localStorage.removeItem("study-planner-tokens");
  localStorage.removeItem("study-planner-user");
}

/**
 * Realiza una petición autenticada al API.
 * Agrega automáticamente el header Authorization con el token JWT.
 */
export async function apiFetch(endpoint, options = {}) {
  const tokens = getTokens();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (tokens?.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si el token expiró, intentar refresh
  if (response.status === 401 && tokens?.refresh) {
    try {
      const refreshResponse = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: tokens.refresh }),
      });

      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json();
        saveTokens({ ...tokens, access: newTokens.access });

        // Reintentar la petición original con el nuevo token
        headers["Authorization"] = `Bearer ${newTokens.access}`;
        return fetch(`${API_URL}${endpoint}`, { ...options, headers });
      }
    } catch {
      // Si falla el refresh, limpiar tokens
      clearTokens();
    }

    // Token refresh falló → limpiar y redirigir
    clearTokens();
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  return response;
}
