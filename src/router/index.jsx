import { createBrowserRouter, Navigate } from "react-router";
import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/pages/LoginPage";
import HoyPage from "@/pages/HoyPage";
import CrearPage from "@/pages/CrearPage";
import ActividadPage from "@/pages/ActividadPage";
import ProgresoPage from "@/pages/ProgresoPage";

/**
 * Router configurado con React Router v7 data mode.
 * Usa createBrowserRouter para habilitar data APIs (loaders, actions).
 *
 * Estructura de rutas:
 * /login           → Pantalla de inicio de sesión
 * /                → Redirige a /hoy
 * /hoy             → T2: Prioridades del día
 * /crear           → T1: Crear actividad evaluativa + plan inicial
 * /actividad/:id   → T3: Detalle, reprogramar, resolver conflictos
 * /progreso        → T4: Visualizar progreso y avance
 */
const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: MainLayout,
    children: [
      {
        index: true,
        element: <Navigate to="/hoy" replace />,
      },
      {
        path: "hoy",
        Component: HoyPage,
        // loader: hoyLoader,  ← Aquí se agregarán los data loaders
      },
      {
        path: "crear",
        Component: CrearPage,
        // action: crearAction, ← Aquí se agregará el action para crear actividades
      },
      {
        path: "actividad/:id",
        Component: ActividadPage,
        // loader: actividadLoader,  ← Loader para cargar datos de la actividad
        // action: actividadAction,  ← Action para actualizar/reprogramar
      },
      {
        path: "progreso",
        Component: ProgresoPage,
        // loader: progresoLoader, ← Loader para métricas de progreso
      },
    ],
  },
]);

export default router;
