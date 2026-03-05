import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000/api"
    : "https://mp1backend.onrender.com/api";

export default function HoyPage() {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const obtenerActividadesHoy = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/actividades/hoy/`);
      if (!response.ok) {
        throw new Error("Error al cargar las actividades");
      }
      const data = await response.json();
      setActividades(data.actividades || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerActividadesHoy();
  }, []);

  const obtenerFechaActual = () => {
    const fecha = new Date();
    return fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Hoy" description={obtenerFechaActual()} icon="📅" />
        <div className="mt-6 text-center text-muted-foreground">
          Cargando actividades...
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Hoy" description={obtenerFechaActual()} icon="📅" />

      <div className="mt-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <Button
              variant="link"
              className="ml-2 text-red-700 p-0 h-auto"
              onClick={obtenerActividadesHoy}
            >
              Reintentar
            </Button>
          </div>
        )}

        {!error && actividades.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No hay actividades para hoy
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              ¡Disfruta tu día!
            </p>
          </div>
        )}

        {actividades.length > 0 && (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-4">
              {actividades.length} actividad
              {actividades.length !== 1 ? "es" : ""} para hoy
            </p>
            {actividades.map((actividad) => (
              <Card
                key={actividad.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {actividad.titulo}
                    </CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/actividad/${actividad.id}`}>Ver</a>
                    </Button>
                  </div>
                </CardHeader>
                {actividad.descripcion && (
                  <CardContent className="pt-0 pb-3">
                    <p className="text-sm text-muted-foreground">
                      {actividad.descripcion}
                    </p>
                  </CardContent>
                )}
                {actividad.subtareas && actividad.subtareas.length > 0 && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-2">
                      Subtareas (
                      {actividad.subtareas.filter((s) => s.completada).length}/
                      {actividad.subtareas.length})
                    </p>
                    <div className="space-y-1">
                      {actividad.subtareas.slice(0, 3).map((subtarea) => (
                        <div
                          key={subtarea.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={subtarea.completada}
                            readOnly
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span
                            className={
                              subtarea.completada
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {subtarea.titulo}
                          </span>
                        </div>
                      ))}
                      {actividad.subtareas.length > 3 && (
                        <p className="text-xs text-muted-foreground pl-6">
                          +{actividad.subtareas.length - 3} más
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
