import { useState, useEffect } from "react";
import { Link } from "react-router";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  Pause,
  Clock,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ProgresoPage() {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await apiFetch("/actividades/");
        if (!res.ok) throw new Error("Error al cargar actividades");
        const data = await res.json();

        // Fetch progress for each activity
        const withProgress = await Promise.all(
          data.map(async (act) => {
            try {
              const pRes = await apiFetch(`/actividades/${act.id}/progreso/`);
              const prog = pRes.ok ? await pRes.json() : null;
              return { ...act, progreso: prog };
            } catch {
              return { ...act, progreso: null };
            }
          })
        );
        setActividades(withProgress);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Aggregate stats
  const totalDone = actividades.reduce((s, a) => s + (a.progreso?.done || 0), 0);
  const totalAll = actividades.reduce((s, a) => s + (a.progreso?.total || 0), 0);
  const totalPostponed = actividades.reduce((s, a) => s + (a.progreso?.postponed || 0), 0);
  const totalPending = actividades.reduce((s, a) => s + (a.progreso?.pending || 0), 0);
  const globalPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100 * 10) / 10 : 0;

  if (loading) {
    return (
      <div>
        <PageHeader title="Progreso" description="Visualiza el avance de tus actividades" icon={TrendingUp} />
        <div className="mt-8 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Cargando progreso...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Progreso" description="Visualiza el avance general de tus actividades evaluativas" icon={TrendingUp} />

      <div className="mt-6 space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/50 text-destructive rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Summary card ── */}
        {!error && totalAll > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Avance general</h2>
                <span className="text-2xl font-bold text-primary">{globalPct}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${globalPct}%` }} />
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" />{totalDone} hecha{totalDone !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1.5"><Pause className="h-3.5 w-3.5" />{totalPostponed} pospuesta{totalPostponed !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{totalPending} pendiente{totalPending !== 1 ? "s" : ""}</span>
                <span className="ml-auto font-medium">{totalDone} / {totalAll} subtareas</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Empty state ── */}
        {!error && actividades.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">Aún no hay actividades registradas</p>
            <p className="text-muted-foreground text-sm mt-1">Crea una actividad para comenzar a ver tu progreso.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/crear">Crear actividad</Link>
            </Button>
          </div>
        )}

        {/* ── Per-activity cards ── */}
        {actividades.map((act) => {
          const p = act.progreso;
          const pct = p?.percentage || 0;
          return (
            <Card key={act.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold truncate ${act.completada ? "line-through text-muted-foreground" : ""}`}>
                        {act.titulo}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">{act.tipo}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Entrega: {new Date(act.fecha_entrega + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>

                    {p && p.total > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{p.done} de {p.total} completadas</span>
                          <span className="font-semibold">{pct}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          {p.done > 0 && <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" />{p.done}</span>}
                          {p.postponed > 0 && <span className="flex items-center gap-1"><Pause className="h-3 w-3" />{p.postponed}</span>}
                          {p.pending > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.pending}</span>}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">0 de {p?.total || 0} completadas</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/actividad/${act.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
