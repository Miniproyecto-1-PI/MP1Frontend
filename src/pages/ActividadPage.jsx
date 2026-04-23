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
} from "lucide-react";
import { apiFetch } from "@/lib/api";

const TIPOS_ACTIVIDAD = [
  { value: "tarea", label: "Tarea" },
  { value: "proyecto", label: "Proyecto" },
  { value: "examen", label: "Examen" },
  { value: "quiz", label: "Quiz" },
  { value: "laboratorio", label: "Laboratorio" },
  { value: "lectura", label: "Lectura" },
  { value: "otro", label: "Otro" },
];

const TIPOS_SUBTAREA = [
  { value: "investigacion", label: "Investigación" },
  { value: "redaccion", label: "Redacción" },
  { value: "programacion", label: "Programación" },
  { value: "estudio", label: "Estudio" },
  { value: "revision", label: "Revisión" },
  { value: "practica", label: "Práctica" },
  { value: "otro", label: "Otro" },
];

const initialErrors = {
  titulo: "",
  descripcion: "",
  fecha_entrega: "",
  subtareas: [],
};

export default function ActividadPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("tarea");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [subtareas, setSubtareas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState(initialErrors);

  // ── Conflict state ──
  const [conflicto, setConflicto] = useState(null);
  const [conflictoSubtareaIndex, setConflictoSubtareaIndex] = useState(null);

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
        setSubtareas(data.subtareas || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchActividad();
  }, [id]);

  // ── Verificar conflicto al cambiar fecha_objetivo de una subtarea ──
  const verificarConflicto = async (index, nuevaFecha) => {
    const subtarea = subtareas[index];
    const horas = parseFloat(subtarea.horas_estimadas);
    if (!nuevaFecha || !horas || horas <= 0) return;

    try {
      const response = await apiFetch("/conflicto/verificar/", {
        method: "POST",
        body: JSON.stringify({
          fecha: nuevaFecha,
          horas_nuevas: horas,
          subtarea_id: subtarea.id || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hay_conflicto) {
          setConflicto(data);
          setConflictoSubtareaIndex(index);
        } else {
          // Sin conflicto — limpiar si era de esta subtarea
          if (conflictoSubtareaIndex === index) {
            setConflicto(null);
            setConflictoSubtareaIndex(null);
          }
        }
      }
    } catch {
      // Silenciar errores de verificación
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = { ...initialErrors };
    let esValido = true;

    if (!titulo.trim()) {
      nuevosErrores.titulo = "El título es requerido";
      esValido = false;
    } else if (titulo.trim().length < 3) {
      nuevosErrores.titulo = "El título debe tener al menos 3 caracteres";
      esValido = false;
    }

    if (descripcion.length > 500) {
      nuevosErrores.descripcion =
        "La descripción no puede exceder 500 caracteres";
      esValido = false;
    }

    if (!fechaEntrega) {
      nuevosErrores.fecha_entrega = "La fecha de entrega es requerida";
      esValido = false;
    }

    const titulosSubtareas = subtareas
      .map((s) => s.titulo.trim())
      .filter((t) => t !== "");
    const duplicados = titulosSubtareas.filter(
      (t, i) => titulosSubtareas.indexOf(t) !== i,
    );

    if (duplicados.length > 0) {
      nuevosErrores.subtareas =
        "No puede haber subtareas con títulos duplicados";
      esValido = false;
    }

    subtareas.forEach((subtarea, index) => {
      if (!subtarea.titulo || subtarea.titulo.trim() === "") {
        // Es opcional, la ignoramos al guardar
        return;
      }
      
      if (!subtarea.fecha_objetivo) {
        nuevosErrores.subtareas = `La fecha objetivo de la subtarea ${index + 1} es requerida`;
        esValido = false;
      } else if (
        !subtarea.horas_estimadas ||
        parseFloat(subtarea.horas_estimadas) <= 0
      ) {
        nuevosErrores.subtareas = `Las horas estimadas de la subtarea ${index + 1} deben ser mayores a 0`;
        esValido = false;
      }
    });

    setErrors(nuevosErrores);
    return esValido;
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

  const eliminarSubtareaUI = (index) => {
    setSubtareas(subtareas.filter((_, i) => i !== index));
    setErrors({ ...errors, subtareas: "" });
    if (conflictoSubtareaIndex === index) {
      setConflicto(null);
      setConflictoSubtareaIndex(null);
    }
  };

  const actualizarSubtarea = (index, campo, valor) => {
    const nuevasSubtareas = [...subtareas];
    nuevasSubtareas[index][campo] = valor;
    setSubtareas(nuevasSubtareas);
    setErrors({ ...errors, subtareas: "" });

    // Verificar conflicto al cambiar fecha_objetivo
    if (campo === "fecha_objetivo" && valor) {
      verificarConflicto(index, valor);
    }
  };

  // ── Conflict resolution actions ──
  const handleConflictAction = (accion) => {
    const idx = conflictoSubtareaIndex;
    if (idx === null) return;

    switch (accion) {
      case "mover": {
        // Limpiar la fecha para que el usuario elija otra
        const nuevasSubtareas = [...subtareas];
        nuevasSubtareas[idx].fecha_objetivo = "";
        setSubtareas(nuevasSubtareas);
        setConflicto(null);
        setConflictoSubtareaIndex(null);
        break;
      }
      case "reducir": {
        // Reducir horas para que quepa en el límite
        const disponible = conflicto.limite - conflicto.horas_actuales;
        if (disponible > 0) {
          const nuevasSubtareas = [...subtareas];
          nuevasSubtareas[idx].horas_estimadas = disponible.toFixed(1);
          setSubtareas(nuevasSubtareas);
        }
        setConflicto(null);
        setConflictoSubtareaIndex(null);
        break;
      }
      case "posponer": {
        // Mover al día siguiente
        const fechaActual = subtareas[idx].fecha_objetivo;
        if (fechaActual) {
          const siguiente = new Date(fechaActual + "T00:00:00");
          siguiente.setDate(siguiente.getDate() + 1);
          const nuevaFecha = siguiente.toISOString().split("T")[0];
          const nuevasSubtareas = [...subtareas];
          nuevasSubtareas[idx].fecha_objetivo = nuevaFecha;
          setSubtareas(nuevasSubtareas);
          // Re-verificar conflicto en la nueva fecha
          setConflicto(null);
          setConflictoSubtareaIndex(null);
          verificarConflicto(idx, nuevaFecha);
        }
        break;
      }
      case "forzar": {
        // Ignorar conflicto y continuar
        setConflicto(null);
        setConflictoSubtareaIndex(null);
        break;
      }
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setError(null);

    if (!validarFormulario()) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tipo,
        fecha_entrega: fechaEntrega,
        subtareas: subtareas
          .filter((s) => s.titulo.trim() !== "")
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
        text: `Actividad editada correctamente`,
      });
      setSubtareas(data.subtareas || []);
      setErrors(initialErrors);
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
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-500 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{mensaje.text}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ──────── CONFLICT MODAL ──────── */}
        {conflicto && (
          <div
            className="mb-4 p-4 bg-amber-500/10 border-2 border-amber-500/50 rounded-xl"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-700 dark:text-amber-400 text-base">
                  Conflicto de sobrecarga detectado
                </h3>
                <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                  {conflicto.mensaje}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {conflicto.fecha}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {conflicto.horas_actuales}h actuales + {(conflicto.horas_con_nueva - conflicto.horas_actuales).toFixed(1)}h nueva
                  </span>
                </div>

                {/* Alternativas */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    ¿Cómo quieres resolverlo?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {conflicto.alternativas?.map((alt) => (
                      <button
                        key={alt.accion}
                        type="button"
                        onClick={() => handleConflictAction(alt.accion)}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors hover:bg-accent cursor-pointer ${
                          alt.accion === "forzar"
                            ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <span className="flex-1">
                          <span className="block font-medium">
                            {alt.accion === "mover" && "📅 Mover a otro día"}
                            {alt.accion === "reducir" && "⏱️ Reducir horas"}
                            {alt.accion === "posponer" && "➡️ Posponer un día"}
                            {alt.accion === "forzar" && "⚠️ Guardar igual"}
                          </span>
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            {alt.descripcion}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConflicto(null);
                  setConflictoSubtareaIndex(null);
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Cerrar alerta de conflicto"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
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
                    setErrors({ ...errors, titulo: "" });
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
                    setErrors({ ...errors, descripcion: "" });
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
                <Input
                  id="fechaEntrega"
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => {
                    setFechaEntrega(e.target.value);
                    setErrors({ ...errors, fecha_entrega: "" });
                  }}
                  className={
                    errors.fecha_entrega ? "border-red-500 mt-1" : "mt-1"
                  }
                />
                {errors.fecha_entrega && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.fecha_entrega}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Subtareas / Hitos</CardTitle>
              <Button type="button" variant="outline" onClick={agregarSubtarea}>
                + Agregar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {subtareas.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No hay subtareas agregadas
                </p>
              )}
              {subtareas.map((subtarea, index) => (
                <div
                  key={subtarea.id || index}
                  className={`flex gap-2 items-end flex-wrap p-2 rounded-lg transition-colors ${
                    conflictoSubtareaIndex === index
                      ? "bg-amber-500/10 border border-amber-500/30"
                      : ""
                  }`}
                >
                  <div className="w-8 pb-3 flex justify-center">
                    <input
                      type="checkbox"
                      checked={subtarea.completada}
                      onChange={(e) =>
                        actualizarSubtarea(
                          index,
                          "completada",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                      title="Marcar como completada"
                      aria-label={`Marcar "${subtarea.titulo}" como completada`}
                    />
                  </div>
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
                        subtarea.completada
                          ? "line-through text-muted-foreground"
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
                    <Label className="text-xs">Fecha Objetivo</Label>
                    <Input
                      type="date"
                      value={subtarea.fecha_objetivo || ""}
                      onChange={(e) =>
                        actualizarSubtarea(
                          index,
                          "fecha_objetivo",
                          e.target.value,
                        )
                      }
                    />
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
                    variant="destructive"
                    onClick={() => eliminarSubtareaUI(index)}
                    className="mb-[2px] px-3"
                    title="Eliminar subtarea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {errors.subtareas && (
                <p className="text-red-500 text-sm">{errors.subtareas}</p>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex gap-4">
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              disabled={saving}
              onClick={eliminarActividad}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar Actividad
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
