import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Trash2,
  Loader2,
  AlertTriangle,
  CalendarIcon,
  Clock,
  ArrowRight,
  X,
  Pause,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

import { TIPOS_ACTIVIDAD, TIPOS_SUBTAREA, initialErrors } from "@/lib/constants";
import { useValidation } from "@/hooks/useValidation";
import { useOverloadDetection } from "@/hooks/useOverloadDetection";
import ConflictPanel from "@/components/ConflictPanel";

export default function ActividadPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("tarea");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [completada, setCompletada] = useState(false);
  const [subtareas, setSubtareas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const { errors, setErrors, validarFormulario, clearError } = useValidation();
  const {
    conflicto,
    conflictoSubtareaIndex,
    verificarConflicto,
    handleConflictAction,
    verificarTodosConflictos,
    dismissConflict,
  } = useOverloadDetection();

  const handleConflictActionUI = (accion) => {
    handleConflictAction(accion, subtareas, setSubtareas, setMensaje);
  };

  // ── Progress state (US-10) ──
  const [progreso, setProgreso] = useState(null);

  // ── Postpone note state (US-09) ──
  const [postponeIndex, setPostponeIndex] = useState(null);
  const [postponeNote, setPostponeNote] = useState("");

  const fetchProgreso = async () => {
    try {
      const res = await apiFetch(`/actividades/${id}/progreso/`);
      if (res.ok) setProgreso(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    const fetchActividad = async () => {
      try {
        const response = await apiFetch(`/actividades/${id}/`);
        if (!response.ok) {
          throw new Error("Actividad no encontrada");
        }
        const data = await response.json();
        setTitulo(data.titulo);
        setDescripcion(data.descripcion || "");
        setTipo(data.tipo || "tarea");
        setFechaEntrega(data.fecha_entrega);
        setCompletada(data.completada || false);
        setSubtareas(data.subtareas || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchActividad();
    fetchProgreso();
  }, [id]);

  // ── US-09: Marcar subtarea como hecha ──
  const marcarHecha = async (subtarea, index) => {
    try {
      const res = await apiFetch(`/subtareas/${subtarea.id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: "done" }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      const nuevas = [...subtareas];
      nuevas[index] = { ...nuevas[index], ...updated };
      setSubtareas(nuevas);
      fetchProgreso();
      setMensaje({ type: "success", text: "Subtarea marcada como hecha ✓" });
      setTimeout(() => setMensaje(null), 3000);
    } catch {
      setMensaje({ type: "error", text: "No se pudo guardar. Intenta de nuevo" });
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  // ── US-09: Marcar subtarea como pospuesta ──
  const marcarPospuesta = async (subtarea, index) => {
    try {
      const res = await apiFetch(`/subtareas/${subtarea.id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: "postponed", note: postponeNote }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      const nuevas = [...subtareas];
      nuevas[index] = { ...nuevas[index], ...updated };
      setSubtareas(nuevas);
      fetchProgreso();
      setPostponeIndex(null);
      setPostponeNote("");
      setMensaje({ type: "success", text: "Subtarea pospuesta" });
      setTimeout(() => setMensaje(null), 3000);
    } catch {
      setMensaje({ type: "error", text: "No se pudo guardar. Intenta de nuevo" });
      setTimeout(() => setMensaje(null), 3000);
    }
  };



  const agregarSubtarea = () => {
    setSubtareas([
      ...subtareas,
      {
        titulo: "",
        tipo: "otro",
        fecha_objetivo: "",
        horas_estimadas: "",
        completada: false,
      },
    ]);
    setErrors({ ...errors, subtareas: "" });
  };

  const eliminarSubtareaUI = async (index) => {
    const subtarea = subtareas[index];

    // Si la subtarea ya existe en el backend (tiene id), eliminarla vía API
    if (subtarea.id) {
      if (!window.confirm(`¿Eliminar la subtarea "${subtarea.titulo || `#${index + 1}`}"? Esta acción no se puede deshacer.`)) {
        return;
      }
      try {
        const response = await apiFetch(`/subtareas/${subtarea.id}/`, {
          method: "DELETE",
        });
        if (!response.ok && response.status !== 204) {
          throw new Error("No se pudo eliminar la subtarea");
        }
        setMensaje({
          type: "success",
          text: `Subtarea "${subtarea.titulo}" eliminada correctamente.`,
        });
        setTimeout(() => setMensaje(null), 3000);
      } catch (err) {
        setError(err.message || "Error al eliminar la subtarea");
        return; // No quitar de la UI si falló en el servidor
      }
    }

    // Quitar de la UI
    setSubtareas(subtareas.filter((_, i) => i !== index));
    setErrors({ ...errors, subtareas: "" });
    if (conflictoSubtareaIndex === index) {
      dismissConflict();
    }
  };

  const actualizarSubtarea = (index, campo, valor) => {
    const nuevasSubtareas = [...subtareas];
    nuevasSubtareas[index][campo] = valor;
    setSubtareas(nuevasSubtareas);
    setErrors({ ...errors, subtareas: "" });

    // Verificar conflicto al cambiar fecha_objetivo o horas_estimadas
    if (campo === "fecha_objetivo" && valor) {
      verificarConflicto(index, nuevasSubtareas[index], valor);
    }
    if (campo === "horas_estimadas" && valor) {
      const fecha = nuevasSubtareas[index].fecha_objetivo;
      if (fecha) {
        verificarConflicto(index, nuevasSubtareas[index], fecha, valor);
      }
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setError(null);

    // Bloquear si hay un conflicto activo sin resolver
    if (conflicto && conflictoSubtareaIndex !== null) {
      setError("Primero resuelve el conflicto de sobrecarga antes de guardar.");
      return;
    }

    if (!validarFormulario({ titulo, descripcion, fechaEntrega, subtareas })) {
      return;
    }

    // Verificar conflictos de todas las subtareas antes de guardar
    const result = await verificarTodosConflictos(subtareas);
    if (result.hayConflicto) {
      setError(`La subtarea "${result.subtarea.titulo}" genera sobrecarga el ${result.fecha}. Resuélvelo antes de guardar.`);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tipo,
        fecha_entrega: fechaEntrega,
        completada: completada,
        subtareas: subtareas
          .filter((s) => s.titulo && s.titulo.trim() !== "")
          .map((s) => ({
            id: s.id,
            titulo: s.titulo.trim(),
            tipo: s.tipo || "otro",
            fecha_objetivo: s.fecha_objetivo,
            horas_estimadas: parseFloat(s.horas_estimadas),
            completada: s.completada || false,
          })),
      };

      const response = await apiFetch(`/actividades/${id}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const erroresBackend = [];
        if (data.titulo) erroresBackend.push(data.titulo);
        if (data.descripcion) erroresBackend.push(data.descripcion);
        if (data.fecha_entrega) erroresBackend.push(data.fecha_entrega);
        if (data.subtareas) {
          if (Array.isArray(data.subtareas)) {
            data.subtareas.forEach((err, i) => {
              if (err && err.titulo)
                erroresBackend.push(`Subtarea ${i + 1}: ${err.titulo}`);
            });
          } else {
            erroresBackend.push(data.subtareas);
          }
        }
        throw new Error(
          erroresBackend.join(" | ") || "Error de validación al editar",
        );
      }

      setMensaje({
        type: "success",
        text: "¡Cambios guardados! Tu planificación está actualizada.",
      });
      setSubtareas(data.subtareas || []);
      setErrors(initialErrors);
      // Auto-dismiss success after 4s
      setTimeout(() => setMensaje(null), 4000);
    } catch (err) {
      setError(err.message || "Error al editar la actividad");
    } finally {
      setSaving(false);
    }
  };

  const eliminarActividad = async () => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar esta actividad y todas sus subtareas?",
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch(`/actividades/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar la actividad");
      }

      navigate("/hoy");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title={`Actividad #${id}`}
          description="Cargando..."
          icon={FileText}
        />
        <div className="mt-8 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Cargando detalles...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Editar actividad"
        description="Detalle, reprogramación y seguimiento de la actividad"
        icon={FileText}
      />

      <div className="mt-6 max-w-2xl">
        {mensaje && (
          <div className={`mb-4 p-3.5 rounded-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 ${
            mensaje.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
              : "bg-blue-500/10 border border-blue-500/40 text-blue-700 dark:text-blue-400"
          }`}>
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">{mensaje.text}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3.5 bg-destructive/10 border border-destructive/40 text-destructive rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Algo salió mal</p>
              <p className="opacity-80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ──────── CONFLICT PANEL ──────── */}
        <ConflictPanel
          conflicto={conflicto}
          onAction={handleConflictActionUI}
          onDismiss={dismissConflict}
        />

        <form onSubmit={handleSubmit} noValidate>
          {/* Main activity completion toggle */}
          <div className="mb-6">
            <Card 
              className={`border-2 transition-all duration-300 cursor-pointer overflow-hidden relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 ${
                completada 
                  ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                  : "border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary shadow-sm hover:shadow-md"
              }`}
              onClick={() => setCompletada(!completada)}
              role="switch"
              aria-checked={completada}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCompletada(!completada);
                }
              }}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-2 transition-colors ${completada ? "bg-emerald-500" : "bg-primary"}`} />
              <CardContent className="p-5 sm:p-6 flex items-center gap-4 sm:gap-6">
                <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
                  completada ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110" : "bg-primary/20 text-primary group-hover:scale-105"
                }`}>
                  <CheckCircle className={`h-6 w-6 sm:h-8 sm:w-8 transition-transform duration-300 ${completada ? "scale-110" : ""}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg sm:text-xl transition-colors ${
                    completada ? "text-emerald-700 dark:text-emerald-400" : "text-primary"
                  }`}>
                    {completada ? "✓ ¡Actividad completada!" : "✓ Marcar como completada"}
                  </h3>
                  <p className="text-sm sm:text-base font-medium opacity-80 mt-1">
                    {completada ? "Has finalizado esta actividad. ¡Buen trabajo!" : "Toca aquí cuando hayas terminado todo."}
                  </p>
                </div>
                <div className="shrink-0 flex items-center justify-center">
                   <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                     completada ? "border-emerald-500 bg-emerald-500" : "border-primary/50 bg-background"
                   }`}>
                     {completada && <CheckCircle className="h-5 w-5 text-white" />}
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Datos de la actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título de la actividad *</Label>
                <Input
                  id="titulo"
                  type="text"
                  placeholder="Ej: Proyecto Final"
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value);
                    clearError("titulo");
                  }}
                  className={errors.titulo ? "border-red-500 mt-1" : "mt-1"}
                />
                {errors.titulo && (
                  <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tipo-actividad">Tipo de actividad</Label>
                <select
                  id="tipo-actividad"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {TIPOS_ACTIVIDAD.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  type="text"
                  placeholder="Descripción de la actividad"
                  value={descripcion}
                  onChange={(e) => {
                    setDescripcion(e.target.value);
                    clearError("descripcion");
                  }}
                  className={
                    errors.descripcion ? "border-red-500 mt-1" : "mt-1"
                  }
                />
                {errors.descripcion && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.descripcion}
                  </p>
                )}
                <p className="text-muted-foreground text-xs mt-1">
                  {descripcion.length}/500 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="fechaEntrega">Fecha de entrega *</Label>
                <div className="relative group mt-1 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 rounded-md">
                  <div className={`flex items-center gap-2 h-10 px-3 bg-primary/5 hover:bg-primary/15 active:scale-[0.98] border rounded-md transition-all cursor-pointer ${errors.fecha_entrega ? "border-red-500" : "border-primary/20 hover:border-primary/40"}`}>
                    <div className="bg-primary/20 p-1.5 rounded-md text-primary">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1">
                      {fechaEntrega ? new Date(fechaEntrega + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "Seleccionar fecha"}
                    </span>
                  </div>
                  <Input
                    id="fechaEntrega"
                    type="date"
                    value={fechaEntrega}
                    onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                    onChange={(e) => {
                      setFechaEntrega(e.target.value);
                      clearError("fecha_entrega");
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                {errors.fecha_entrega && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.fecha_entrega}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <CardTitle>Subtareas / Hitos</CardTitle>
                <Button type="button" variant="outline" onClick={agregarSubtarea}>
                  + Agregar
                </Button>
              </div>
              {/* ── US-10: Progress bar ── */}
              {progreso && progreso.total > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {progreso.done} de {progreso.total} completadas
                    </span>
                    <span className="font-semibold text-primary">{progreso.percentage}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${progreso.percentage}%` }}
                    />
                  </div>
                  {progreso.postponed > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {progreso.postponed} pospuesta{progreso.postponed !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {subtareas.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Aún no hay subtareas registradas
                </p>
              )}
              {subtareas.map((subtarea, index) => (
                <div
                  key={subtarea.id || index}
                  className={`p-3 rounded-lg transition-colors border ${
                    subtarea.estado === "hecha"
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : subtarea.estado === "pospuesta"
                        ? "bg-muted/50 border-border/50"
                        : conflictoSubtareaIndex === index
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "border-transparent"
                  }`}
                >
                  {/* Status badge */}
                  {subtarea.estado && subtarea.estado !== "pendiente" && (
                    <div className={`flex items-center gap-1.5 mb-2 text-xs font-medium ${
                      subtarea.estado === "hecha" ? "text-emerald-600" : "text-muted-foreground"
                    }`}>
                      {subtarea.estado === "hecha" ? (
                        <><CheckCircle className="h-3.5 w-3.5" /> Hecha</>
                      ) : (
                        <><Pause className="h-3.5 w-3.5" /> Pospuesta</>
                      )}
                      {subtarea.nota && (
                        <span className="ml-2 text-muted-foreground font-normal italic">— {subtarea.nota}</span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 items-end flex-wrap">
                    <div className="flex-1 min-w-[120px] space-y-1">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        type="text"
                        placeholder={`Subtarea ${index + 1}`}
                        value={subtarea.titulo}
                        onChange={(e) =>
                          actualizarSubtarea(index, "titulo", e.target.value)
                        }
                        className={
                          subtarea.estado === "hecha"
                            ? "line-through text-muted-foreground opacity-70"
                            : ""
                        }
                      />
                    </div>
                    <div className="w-32 space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <select
                        value={subtarea.tipo || "otro"}
                        onChange={(e) =>
                          actualizarSubtarea(index, "tipo", e.target.value)
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {TIPOS_SUBTAREA.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-36 space-y-1">
                      <Label className="text-xs">Fecha objetivo</Label>
                      <div className="relative group min-w-[144px] focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 rounded-md">
                        <div className="flex items-center gap-2 h-9 px-2.5 bg-primary/5 hover:bg-primary/15 active:scale-[0.98] border border-primary/20 hover:border-primary/40 rounded-md transition-all cursor-pointer">
                          <div className="bg-primary/20 p-1 rounded-md text-primary">
                            <CalendarIcon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-medium text-foreground truncate flex-1">
                            {subtarea.fecha_objetivo ? new Date(subtarea.fecha_objetivo + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "Fecha"}
                          </span>
                        </div>
                        <Input
                          type="date"
                          value={subtarea.fecha_objetivo || ""}
                          onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                          onChange={(e) =>
                            actualizarSubtarea(
                              index,
                              "fecha_objetivo",
                              e.target.value,
                            )
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          title="Toca para elegir fecha"
                        />
                      </div>
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Horas</Label>
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        placeholder="0.0"
                        value={subtarea.horas_estimadas || ""}
                        onChange={(e) =>
                          actualizarSubtarea(
                            index,
                            "horas_estimadas",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarSubtareaUI(index)}
                      className="mb-[2px] h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Eliminar subtarea"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* ── US-09: Action buttons ── */}
                  {subtarea.id && subtarea.estado !== "hecha" && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                        onClick={() => marcarHecha(subtarea, index)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Hecha
                      </Button>
                      {postponeIndex === index ? (
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <Input
                            type="text"
                            placeholder="Nota opcional..."
                            value={postponeNote}
                            onChange={(e) => setPostponeNote(e.target.value)}
                            className="h-8 text-xs flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs"
                            onClick={() => marcarPospuesta(subtarea, index)}
                          >
                            Confirmar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => { setPostponeIndex(null); setPostponeNote(""); }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-muted-foreground"
                          onClick={() => setPostponeIndex(index)}
                        >
                          <Pause className="h-3.5 w-3.5 mr-1" /> Posponer
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {errors.subtareas && (
                <p className="text-red-500 text-sm">{errors.subtareas}</p>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 space-y-3">
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar cambios"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              disabled={saving}
              onClick={eliminarActividad}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Eliminar actividad completa
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
