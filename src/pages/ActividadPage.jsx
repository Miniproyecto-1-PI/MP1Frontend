import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileText, AlertCircle, CheckCircle, Trash2 } from "lucide-react";

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000/api"
    : "https://mp1backend.onrender.com/api";

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
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [subtareas, setSubtareas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState(initialErrors);

  useEffect(() => {
    const fetchActividad = async () => {
      try {
        const response = await fetch(`${API_URL}/actividades/${id}/`);
        if (!response.ok) {
          throw new Error("Actividad no encontrada");
        }
        const data = await response.json();
        setTitulo(data.titulo);
        setDescripcion(data.descripcion || "");
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
        nuevosErrores.subtareas = `El nombre de la subtarea ${index + 1} no puede estar vacío`;
        esValido = false;
      } else if (!subtarea.fecha_objetivo) {
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
  };

  const actualizarSubtarea = (index, campo, valor) => {
    const nuevasSubtareas = [...subtareas];
    nuevasSubtareas[index][campo] = valor;
    setSubtareas(nuevasSubtareas);
    setErrors({ ...errors, subtareas: "" });
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
        fecha_entrega: fechaEntrega,
        subtareas: subtareas
          .filter((s) => s.titulo.trim() !== "")
          .map((s) => ({
            id: s.id, // Include ID if it exists for the backend to update instead of recreate
            titulo: s.titulo.trim(),
            fecha_objetivo: s.fecha_objetivo,
            horas_estimadas: parseFloat(s.horas_estimadas),
            completada: s.completada || false,
          })),
      };

      const response = await fetch(`${API_URL}/actividades/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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
      setSubtareas(data.subtareas || []); // Refresh with IDs
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
      const response = await fetch(`${API_URL}/actividades/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar la actividad");
      }

      navigate("/hoy"); // Or somewhere else
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
        <div className="mt-6 text-center text-muted-foreground">
          Cargando detalles...
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
                <div key={index} className="flex gap-2 items-end">
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
                    />
                  </div>
                  <div className="flex-1 space-y-1">
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
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
