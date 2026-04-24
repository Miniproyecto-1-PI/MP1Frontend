import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  AlertCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Loader2,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router";
import { apiFetch } from "@/lib/api";

export default function HoyPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const obtenerDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/actividades/hoy/");
      if (!response.ok) {
        throw new Error("Error al cargar las actividades");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  const toggleCompletada = async (subtarea) => {
    try {
      const response = await apiFetch(`/subtareas/${subtarea.id}/`, {
        method: "PUT",
        body: JSON.stringify({ completada: !subtarea.completada }),
      });
      if (response.ok) {
        obtenerDatos();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActividad = async (actividad) => {
    try {
      const response = await apiFetch(`/actividades/${actividad.id}/`, {
        method: "PUT",
        body: JSON.stringify({ completada: !actividad.completada }),
      });
      if (response.ok) {
        obtenerDatos();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const obtenerFechaActual = () => {
    const fecha = new Date();
    return fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr + "T00:00:00");
    return fecha.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  const diasAtraso = (fechaStr) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaStr + "T00:00:00");
    const diff = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const totalItems =
    (data?.vencidas?.length || 0) +
    (data?.hoy?.length || 0) +
    (data?.proximas?.length || 0) +
    (data?.actividades_hoy?.length || 0) +
    (data?.actividades_sin_planificar?.length || 0);

  // ────────────────────── Loading ──────────────────────
  if (loading) {
    return (
      <div>
        <PageHeader
          title="Hoy"
          description={obtenerFechaActual()}
          icon={Calendar}
        />
        <div className="mt-8 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Cargando tus actividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Hoy"
        description={obtenerFechaActual()}
        icon={Calendar}
      />

      {/* Regla de priorización oculta */}
      {false && (
        <div className="mt-4 p-3.5 bg-muted/30 border border-border/50 rounded-lg text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Regla de priorización:
          </p>
          <ul className="list-disc list-inside space-y-0.5 ml-1 marker:text-muted-foreground/50">
            <li><strong>Vencidas:</strong> Más antiguas primero, luego por mayor carga horaria.</li>
            <li><strong>Hoy:</strong> Mayor carga horaria primero.</li>
            <li><strong>Próximas:</strong> Fecha más cercana, luego por mayor carga horaria.</li>
          </ul>
          <p className="mt-1.5 text-xs opacity-70 italic">* En caso de empate, se ordenan alfabéticamente por título.</p>
        </div>
      )}

      <div className="mt-6">
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button
              variant="link"
              className="text-destructive p-0 h-auto font-medium"
              onClick={obtenerDatos}
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Horas planificadas hoy */}
        {data && !error && (
          <div className="mb-6 p-4 bg-card border border-border rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Horas planificadas hoy
                </p>
                <p className="text-2xl font-bold">
                  {data.horas_planificadas_hoy || 0}h
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>
                {totalItems} subtarea{totalItems !== 1 ? "s" : ""} pendiente
                {totalItems !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!error && totalItems === 0 && !loading && (
          <div className="text-center py-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">
              No hay tareas pendientes
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              ¡Estás al día! Crea una nueva actividad para comenzar.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/crear">Crear actividad</Link>
            </Button>
          </div>
        )}

        {/* ──────── VENCIDAS ──────── */}
        {data?.vencidas?.length > 0 && (
          <section className="mb-6" aria-label="Subtareas vencidas">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide">
                Vencidas ({data.vencidas.length})
              </h2>
            </div>
            <div className="space-y-2">
              {data.vencidas.map((subtarea) => (
                <Card
                  key={`v-${subtarea.id}`}
                  className="border-destructive/30 bg-destructive/5 hover:shadow-md transition-shadow"
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {subtarea.completada && (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <CheckCircle className="h-3 w-3" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium truncate ${subtarea.completada ? "line-through text-muted-foreground opacity-70" : ""}`}>
                            {subtarea.titulo}
                          </span>
                          {subtarea.tipo && subtarea.tipo !== "otro" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                              {subtarea.tipo}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="text-destructive font-medium">
                            {diasAtraso(subtarea.fecha_objetivo)} día
                            {diasAtraso(subtarea.fecha_objetivo) !== 1
                              ? "s"
                              : ""}{" "}
                            de atraso
                          </span>
                          <span>·</span>
                          <span>{subtarea.horas_estimadas}h estimadas</span>
                          <span>·</span>
                          <span className="truncate">
                            {subtarea.actividad.titulo}
                          </span>
                        </div>
                      </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/actividad/${subtarea.actividad.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ──────── HOY ──────── */}
        {data?.hoy?.length > 0 && (
          <section className="mb-6" aria-label="Subtareas de hoy">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
                Hoy ({data.hoy.length})
              </h2>
            </div>
            <div className="space-y-2">
              {data.hoy.map((subtarea) => (
                <Card
                  key={`h-${subtarea.id}`}
                  className="border-primary/20 hover:shadow-md transition-shadow"
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {subtarea.completada && (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <CheckCircle className="h-3 w-3" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium truncate ${
                                subtarea.completada
                                  ? "line-through text-muted-foreground opacity-70"
                                  : ""
                              }`}
                            >
                              {subtarea.titulo}
                            </span>
                            {subtarea.tipo && subtarea.tipo !== "otro" && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {subtarea.tipo}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{subtarea.horas_estimadas}h estimadas</span>
                            <span>·</span>
                            <span className="truncate">
                              {subtarea.actividad.titulo}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/actividad/${subtarea.actividad.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ──────── ACTIVIDADES (ENTREGAS HOY) ──────── */}
        {data?.actividades_hoy?.length > 0 && (
          <section className="mb-6" aria-label="Entregas de hoy">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
                Entregas de Actividades Hoy ({data.actividades_hoy.length})
              </h2>
            </div>
            <div className="space-y-2">
              {data.actividades_hoy.map((actividad) => (
                <Card
                  key={`a-${actividad.id}`}
                  className="border-primary/20 hover:shadow-md transition-shadow bg-primary/5"
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {actividad.completada && (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white mr-1">
                              <CheckCircle className="h-3 w-3" />
                            </div>
                          )}
                          <span className={`font-medium truncate ${actividad.completada ? "line-through text-muted-foreground" : ""}`}>
                            {actividad.titulo}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-foreground border">
                            Actividad
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="text-primary font-medium">Se entrega hoy</span>
                          {(!actividad.subtareas || actividad.subtareas.length === 0) && (
                            <>
                              <span>·</span>
                              <span className="text-amber-600 font-medium">Sin subtareas planificadas</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/actividad/${actividad.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ──────── ACTIVIDADES SIN PLANIFICAR ──────── */}
        {data?.actividades_sin_planificar?.length > 0 && (
          <section className="mb-6" aria-label="Actividades sin planificar">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wide">
                Sin planificar ({data.actividades_sin_planificar.length})
              </h2>
            </div>
            <div className="space-y-2">
              {data.actividades_sin_planificar.map((actividad) => (
                <Card
                  key={`ap-${actividad.id}`}
                  className="border-amber-500/20 hover:shadow-md transition-shadow bg-amber-500/5"
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {actividad.completada && (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white mr-1">
                              <CheckCircle className="h-3 w-3" />
                            </div>
                          )}
                          <span className={`font-medium truncate ${actividad.completada ? "line-through text-muted-foreground" : ""}`}>
                            {actividad.titulo}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            Falta planificar
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Entrega: {formatFecha(actividad.fecha_entrega)}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/actividad/${actividad.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ──────── PRÓXIMAS ──────── */}
        {data?.proximas?.length > 0 && (
          <section className="mb-6" aria-label="Subtareas próximas">
            <div className="flex items-center gap-2 mb-3">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Próximas ({data.proximas.length})
              </h2>
            </div>
            <div className="space-y-2">
              {data.proximas.map((subtarea) => (
                <Card
                  key={`p-${subtarea.id}`}
                  className="border-border/50 opacity-80 hover:opacity-100 hover:shadow-md transition-all"
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {subtarea.completada && (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <CheckCircle className="h-3 w-3" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium truncate ${subtarea.completada ? "line-through text-muted-foreground opacity-70" : ""}`}>
                            {subtarea.titulo}
                          </span>
                          {subtarea.tipo && subtarea.tipo !== "otro" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                              {subtarea.tipo}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatFecha(subtarea.fecha_objetivo)}</span>
                          <span>·</span>
                          <span>{subtarea.horas_estimadas}h estimadas</span>
                          <span>·</span>
                          <span className="truncate">
                            {subtarea.actividad.titulo}
                          </span>
                        </div>
                      </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/actividad/${subtarea.actividad.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
