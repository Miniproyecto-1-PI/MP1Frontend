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
  Pause,
  CircleDashed
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

  const updateSubtaskStatus = async (subtarea, newStatus) => {
    try {
      const response = await apiFetch(`/subtareas/${subtarea.id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
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

  // Kanban logic
  const tareasDelDia = data?.todas || [];
  // Filter out duplicates just in case
  const tareasUnicas = Array.from(new Map(tareasDelDia.map(t => [t.id, t])).values());

  const pendientes = tareasUnicas.filter(t => !t.estado || t.estado === "pendiente");
  const pospuestas = tareasUnicas.filter(t => t.estado === "pospuesta");
  const hechas = tareasUnicas.filter(t => t.estado === "hecha");

  // Kanban card component
  const KanbanCard = ({ subtarea, isVencida }) => (
    <Card className={`mb-3 hover:shadow-md transition-shadow relative overflow-hidden ${isVencida ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}>
      {isVencida && (
        <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
      )}
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2">
            <span className={`font-medium text-sm ${subtarea.completada ? "line-through text-muted-foreground opacity-70" : ""}`}>
              {subtarea.titulo}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mt-1 -mr-1" asChild>
              <Link to={`/actividad/${subtarea.actividad.id}`}>
                <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {subtarea.tipo && subtarea.tipo !== "otro" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border uppercase font-medium">
                {subtarea.tipo}
              </span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {subtarea.horas_estimadas}h
            </span>
          </div>

          <div className="text-xs text-muted-foreground truncate mt-1 border-b pb-2">
            Proyecto: <span className="font-medium text-foreground">{subtarea.actividad.titulo}</span>
          </div>
          
          {isVencida && (
            <div className="text-[11px] text-destructive font-medium mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {diasAtraso(subtarea.fecha_objetivo)} día(s) de atraso
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-1.5 mt-2">
            {subtarea.estado !== 'pendiente' && (
              <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => updateSubtaskStatus(subtarea, 'pending')}>
                <CircleDashed className="h-3 w-3 mr-1" /> Mover a Pendiente
              </Button>
            )}
            {subtarea.estado !== 'pospuesta' && (
              <Button variant="outline" size="sm" className="h-7 text-xs flex-1 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => updateSubtaskStatus(subtarea, 'postponed')}>
                <Pause className="h-3 w-3 mr-1" /> Posponer
              </Button>
            )}
            {subtarea.estado !== 'hecha' && (
              <Button variant="default" size="sm" className="h-7 text-xs flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateSubtaskStatus(subtarea, 'done')}>
                <CheckCircle className="h-3 w-3 mr-1" /> Hecha
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
    <div className="h-full flex flex-col">
      <PageHeader
        title="Hoy"
        description={obtenerFechaActual()}
        icon={Calendar}
      />

      <div className="mt-6 flex-1 flex flex-col">
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
          <div className="mb-6 p-4 bg-card border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 bg-muted rounded-full text-xs font-medium border text-muted-foreground">
                {pendientes.length} Pendientes
              </div>
              <div className="px-3 py-1 bg-amber-500/10 border-amber-500/20 border rounded-full text-xs font-medium text-amber-700 dark:text-amber-400">
                {pospuestas.length} Pospuestas
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 border-emerald-500/20 border rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {hechas.length} Hechas
              </div>
            </div>
          </div>
        )}

        {/* KANBAN BOARD */}
        {data && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
            
            {/* Columna Pendientes */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CircleDashed className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">Pendientes</h3>
                </div>
                <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded-full text-xs font-bold">
                  {pendientes.length}
                </span>
              </div>
              
              <div className="flex-1">
                {pendientes.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                    No hay tareas pendientes
                  </div>
                ) : (
                  pendientes.map(subtarea => (
                    <KanbanCard 
                      key={`k-${subtarea.id}`} 
                      subtarea={subtarea} 
                      isVencida={subtarea.fecha_objetivo && new Date(subtarea.fecha_objetivo + "T00:00:00") < new Date(new Date().setHours(0,0,0,0))} 
                    />
                  ))
                )}
              </div>
            </div>

            {/* Columna Pospuestas */}
            <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/20 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Pause className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-amber-700 dark:text-amber-400">Pospuestas</h3>
                </div>
                <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs font-bold">
                  {pospuestas.length}
                </span>
              </div>
              
              <div className="flex-1">
                {pospuestas.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-amber-600/50 text-sm border-2 border-dashed border-amber-500/20 rounded-xl">
                    Nada pospuesto hoy
                  </div>
                ) : (
                  pospuestas.map(subtarea => (
                    <KanbanCard key={`k-${subtarea.id}`} subtarea={subtarea} isVencida={false} />
                  ))
                )}
              </div>
            </div>

            {/* Columna Hechas */}
            <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Hechas</h3>
                </div>
                <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs font-bold">
                  {hechas.length}
                </span>
              </div>
              
              <div className="flex-1">
                {hechas.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-emerald-600/50 text-sm border-2 border-dashed border-emerald-500/20 rounded-xl">
                    Aún no hay tareas hechas
                  </div>
                ) : (
                  hechas.map(subtarea => (
                    <KanbanCard key={`k-${subtarea.id}`} subtarea={subtarea} isVencida={false} />
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* Otras secciones inferiores */}
        {data && (
          <div className="grid grid-cols-1 gap-6 pt-4 border-t border-border/50">
            {/* ──────── ACTIVIDADES (ENTREGAS HOY) ──────── */}
            {data?.actividades_hoy?.length > 0 && (
              <section aria-label="Entregas de hoy">
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
                      className="relative overflow-hidden border-border hover:shadow-lg transition-all bg-card group"
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${actividad.completada ? 'bg-emerald-500' : 'bg-primary'}`} />
                      <CardContent className="py-3.5 px-4 sm:p-5 flex items-center justify-between gap-4 ml-1.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              actividad.completada 
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}>
                              {actividad.completada ? "Completada" : "Urgente: Hoy"}
                            </span>
                          </div>
                          <h3 className={`text-base font-bold truncate transition-colors group-hover:text-primary ${
                            actividad.completada ? "line-through text-muted-foreground opacity-70" : "text-foreground"
                          }`}>
                            {actividad.titulo}
                          </h3>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-primary" /> Entrega Hoy
                            </span>
                            {(!actividad.subtareas || actividad.subtareas.length === 0) && (
                              <span className="flex items-center gap-1 text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                                <AlertTriangle className="h-3 w-3" /> Sin subtareas
                              </span>
                            )}
                          </div>
                        </div>
                        <Button className={`shrink-0 h-9 w-9 sm:w-auto sm:px-4 rounded-full sm:rounded-lg shadow-sm transition-transform active:scale-95 ${
                          actividad.completada ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        }`} asChild>
                          <Link to={`/actividad/${actividad.id}`}>
                            <span className="hidden sm:inline font-semibold mr-1">Gestionar</span>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* ──────── ACTIVIDADES SIN PLANIFICAR ──────── */}
            {data?.actividades_sin_planificar?.length > 0 && (
              <section aria-label="Actividades sin planificar">
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


          </div>
        )}
      </div>
    </div>
  );
}
