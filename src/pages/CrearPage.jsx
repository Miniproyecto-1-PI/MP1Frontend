import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  X,
  Trash2,
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

export default function CrearPage() {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("tarea");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [subtareas, setSubtareas] = useState([]);
  const [mostrarSubtareas, setMostrarSubtareas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState(initialErrors);

  // ── Conflict state ──
  const [conflicto, setConflicto] = useState(null);
  const [conflictoSubtareaIndex, setConflictoSubtareaIndex] = useState(null);

  // ── Verificar conflicto de sobrecarga ──
  const verificarConflicto = async (index, nuevaFecha, horasOverride) => {
    const subtarea = subtareas[index];
    const horas =
      horasOverride !== undefined
        ? parseFloat(horasOverride)
        : parseFloat(subtarea?.horas_estimadas);
    if (!nuevaFecha || !horas || horas <= 0) return;

    try {
      const response = await apiFetch("/conflicto/verificar/", {
        method: "POST",
        body: JSON.stringify({
          fecha: nuevaFecha,
          horas_nuevas: horas,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hay_conflicto) {
          setConflicto(data);
          setConflictoSubtareaIndex(index);
        } else {
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

  // ── Conflict resolution actions ──
  const handleConflictAction = (accion) => {
    const idx = conflictoSubtareaIndex;
    if (idx === null) return;

    switch (accion) {
      case "mover": {
        const nuevasSubtareas = [...subtareas];
        nuevasSubtareas[idx].fecha_objetivo = "";
        setSubtareas(nuevasSubtareas);
        setConflicto(null);
        setConflictoSubtareaIndex(null);
        setMensaje({
          type: "info",
          text: "Fecha limpiada — elige un día con menos carga.",
        });
        setTimeout(() => setMensaje(null), 3000);
        break;
      }
      case "reducir": {
        const disponible = conflicto.limite - conflicto.horas_actuales;
        if (disponible > 0) {
          const nuevasSubtareas = [...subtareas];
          nuevasSubtareas[idx].horas_estimadas = disponible.toFixed(1);
          setSubtareas(nuevasSubtareas);
          setMensaje({
            type: "info",
            text: `Horas ajustadas a ${disponible.toFixed(1)}h para caber en tu día.`,
          });
          setTimeout(() => setMensaje(null), 3000);
        }
        setConflicto(null);
        setConflictoSubtareaIndex(null);
        break;
      }
      case "posponer": {
        const fechaActual = subtareas[idx].fecha_objetivo;
        if (fechaActual) {
          const siguiente = new Date(fechaActual + "T00:00:00");
          siguiente.setDate(siguiente.getDate() + 1);
          const nuevaFecha = siguiente.toISOString().split("T")[0];
          const nuevasSubtareas = [...subtareas];
          nuevasSubtareas[idx].fecha_objetivo = nuevaFecha;
          setSubtareas(nuevasSubtareas);
          setConflicto(null);
          setConflictoSubtareaIndex(null);
          setMensaje({
            type: "info",
            text: `Subtarea movida al ${new Date(nuevaFecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}. Verificando carga...`,
          });
          setTimeout(() => setMensaje(null), 3000);
          verificarConflicto(idx, nuevaFecha);
        }
        break;
      }
      case "forzar": {
        setConflicto(null);
        setConflictoSubtareaIndex(null);
        setMensaje({
          type: "info",
          text: "Conflicto ignorado — puedes continuar creando la actividad.",
        });
        setTimeout(() => setMensaje(null), 3000);
        break;
      }
      default:
        break;
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
    setMostrarSubtareas(true);
    setSubtareas([
      ...subtareas,
      { titulo: "", tipo: "otro", fecha_objetivo: "", horas_estimadas: "" },
    ]);
    setErrors({ ...errors, subtareas: "" });
  };

  const eliminarSubtarea = (index) => {
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

    // Verificar conflicto al cambiar fecha_objetivo o horas_estimadas
    if (campo === "fecha_objetivo" && valor) {
      verificarConflicto(index, valor);
    }
    if (campo === "horas_estimadas" && valor) {
      const fecha = nuevasSubtareas[index].fecha_objetivo;
      if (fecha) {
        verificarConflicto(index, fecha, valor);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setError(null);

    // Bloquear si hay un conflicto activo sin resolver
    if (conflicto && conflictoSubtareaIndex !== null) {
      setError("Primero resuelve el conflicto de sobrecarga antes de crear.");
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    // Verificar conflictos de todas las subtareas antes de crear
    const subtareasValidas = subtareas.filter((s) => s.titulo.trim() !== "");
    for (const sub of subtareasValidas) {
      const horas = parseFloat(sub.horas_estimadas);
      if (!sub.fecha_objetivo || !horas || horas <= 0) continue;

      try {
        const response = await apiFetch("/conflicto/verificar/", {
          method: "POST",
          body: JSON.stringify({
            fecha: sub.fecha_objetivo,
            horas_nuevas: horas,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.hay_conflicto) {
            const idx = subtareas.indexOf(sub);
            setConflicto(data);
            setConflictoSubtareaIndex(idx);
            setError(
              `La subtarea "${sub.titulo}" genera sobrecarga el ${sub.fecha_objetivo}. Resuélvelo antes de crear.`,
            );
            return;
          }
        }
      } catch {
        // continue if check fails
      }
    }

    setLoading(true);

    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tipo,
        fecha_entrega: fechaEntrega,
        subtareas: subtareasValidas.map((s) => ({
          titulo: s.titulo.trim(),
          tipo: s.tipo,
          fecha_objetivo: s.fecha_objetivo,
          horas_estimadas: parseFloat(s.horas_estimadas),
          completada: false,
        })),
      };

      const response = await apiFetch("/actividades/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const erroresBackend = [];
        if (data.titulo) erroresBackend.push(data.titulo);
        if (data.descripcion) erroresBackend.push(data.descripcion);
        if (data.fecha_entrega) erroresBackend.push(data.fecha_entrega);
        if (data.subtareas) {
          data.subtareas.forEach((err, i) => {
            if (err.titulo)
              erroresBackend.push(`Subtarea ${i + 1}: ${err.titulo}`);
          });
        }
        throw new Error(erroresBackend.join(" | ") || "Error de validación");
      }

      setMensaje({
        type: "success",
        text: `¡Actividad "${data.titulo}" creada con ${data.subtareas?.length || 0} subtareas!`,
      });

      setTitulo("");
      setDescripcion("");
      setTipo("tarea");
      setFechaEntrega("");
      setSubtareas([]);
      setMostrarSubtareas(false);
      setErrors(initialErrors);
      setConflicto(null);
      setConflictoSubtareaIndex(null);
    } catch (err) {
      setError(err.message || "Error al crear la actividad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Crear actividad"
        description="Crea una nueva actividad evaluativa con su plan de trabajo"
        icon={Plus}
      />

      <div className="mt-6 max-w-2xl">
        {mensaje && (
          <div
            className={`mb-4 p-3.5 rounded-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 ${
              mensaje.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                : "bg-blue-500/10 border border-blue-500/40 text-blue-700 dark:text-blue-400"
            }`}
          >
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
        {conflicto && (
          <div
            className="mb-5 p-5 bg-amber-500/5 border-2 border-amber-500/40 rounded-2xl shadow-sm"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-amber-700 dark:text-amber-300 text-base">
                  ⚡ Ese día ya está bastante cargado
                </h3>
                <p className="text-sm text-amber-600/90 dark:text-amber-300/80 mt-1 leading-relaxed">
                  {conflicto.mensaje}
                </p>

                {/* Visual capacity bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Carga del día</span>
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      {conflicto.horas_con_nueva}h / {conflicto.limite}h
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, conflicto.porcentaje_uso || 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">
                    Ya hay {conflicto.horas_actuales}h planificadas +{" "}
                    {(
                      conflicto.horas_con_nueva - conflicto.horas_actuales
                    ).toFixed(1)}
                    h de esta subtarea
                  </p>
                </div>

                {/* Resolution options */}
                <div className="mt-4 space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    ¿Qué prefieres hacer?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {conflicto.alternativas?.map((alt) => (
                      <button
                        key={alt.accion}
                        type="button"
                        onClick={() => handleConflictAction(alt.accion)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-left text-sm transition-all duration-150 cursor-pointer group ${
                          alt.accion === "forzar"
                            ? "border-destructive/20 hover:border-destructive/40 hover:bg-destructive/5"
                            : "border-border hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm"
                        }`}
                      >
                        <span className="text-lg leading-none mt-0.5">
                          {alt.accion === "mover" && "📅"}
                          {alt.accion === "reducir" && "⏱️"}
                          {alt.accion === "posponer" && "➡️"}
                          {alt.accion === "forzar" && "⚠️"}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span
                            className={`block font-medium text-sm ${
                              alt.accion === "forzar" ? "text-destructive" : ""
                            }`}
                          >
                            {alt.titulo || alt.descripcion}
                          </span>
                          <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">
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
                className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                aria-label="Cerrar alerta"
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
                <Label htmlFor="tipo">Tipo de actividad</Label>
                <select
                  id="tipo"
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
            <CardHeader
              className="flex flex-row items-center justify-between cursor-pointer"
              onClick={() => setMostrarSubtareas(!mostrarSubtareas)}
            >
              <CardTitle>Subtareas (Opcional)</CardTitle>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  agregarSubtarea();
                }}
              >
                + Agregar subtarea
              </Button>
            </CardHeader>
            {mostrarSubtareas && (
              <CardContent className="space-y-3">
                {subtareas.length === 0 && (
                  <p className="text-muted-foreground text-sm pb-2">
                    No hay subtareas agregadas. Presiona &quot;+ Agregar
                    subtarea&quot; para comenzar.
                  </p>
                )}
                {subtareas.map((subtarea, index) => (
                  <div
                    key={index}
                    className={`flex gap-2 items-end flex-wrap p-2 rounded-lg transition-colors ${
                      conflictoSubtareaIndex === index
                        ? "bg-amber-500/10 border border-amber-500/30"
                        : ""
                    }`}
                  >
                    <div className="flex-1 min-w-[150px] space-y-1">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        type="text"
                        placeholder={`Subtarea ${index + 1}`}
                        value={subtarea.titulo}
                        onChange={(e) =>
                          actualizarSubtarea(index, "titulo", e.target.value)
                        }
                      />
                    </div>
                    <div className="w-36 space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <select
                        value={subtarea.tipo}
                        onChange={(e) =>
                          actualizarSubtarea(index, "tipo", e.target.value)
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                        title="¿Cuándo planeas trabajar en esto?"
                      />
                    </div>
                    <div className="w-24 space-y-1">
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
                      onClick={() => eliminarSubtarea(index)}
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
            )}
          </Card>

          <Button type="submit" className="mt-4 w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </span>
            ) : (
              "Crear actividad"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
