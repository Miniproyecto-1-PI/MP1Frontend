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

import { TIPOS_ACTIVIDAD, TIPOS_SUBTAREA, initialErrors } from "@/lib/constants";
import { useValidation } from "@/hooks/useValidation";
import { useOverloadDetection } from "@/hooks/useOverloadDetection";
import ConflictPanel from "@/components/ConflictPanel";

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
      setError("Primero resuelve el conflicto de sobrecarga antes de crear.");
      return;
    }

    if (!validarFormulario({ titulo, descripcion, fechaEntrega, subtareas })) {
      return;
    }

    // Verificar conflictos de todas las subtareas antes de crear
    const result = await verificarTodosConflictos(subtareas);
    if (result.hayConflicto) {
      setError(
        `La subtarea "${result.subtarea.titulo}" genera sobrecarga el ${result.fecha}. Resuélvelo antes de crear.`
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tipo,
        fecha_entrega: fechaEntrega,
        subtareas: subtareas.filter((s) => s.titulo && s.titulo.trim() !== "").map((s) => ({
          titulo: s.titulo.trim(),
          tipo: s.tipo,
          fecha_objetivo: s.fecha_objetivo,
          horas_estimadas: parseFloat(s.horas_estimadas),
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
      dismissConflict();
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
        <ConflictPanel
          conflicto={conflicto}
          onAction={handleConflictActionUI}
          onDismiss={dismissConflict}
        />

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
                    clearError("titulo");
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
                <Input
                  id="fechaEntrega"
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => {
                    setFechaEntrega(e.target.value);
                    clearError("fecha_entrega");
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
