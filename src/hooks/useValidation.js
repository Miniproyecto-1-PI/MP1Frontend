import { useState } from "react";
import { initialErrors } from "@/lib/constants";

export function useValidation() {
  const [errors, setErrors] = useState(initialErrors);

  const validarFormulario = (formData) => {
    const { titulo, descripcion, fechaEntrega, subtareas } = formData;
    const nuevosErrores = { ...initialErrors };
    let esValido = true;

    if (!titulo || !titulo.trim()) {
      nuevosErrores.titulo = "El título es requerido";
      esValido = false;
    } else if (titulo.trim().length < 3) {
      nuevosErrores.titulo = "El título debe tener al menos 3 caracteres";
      esValido = false;
    }

    if (descripcion && descripcion.length > 500) {
      nuevosErrores.descripcion = "La descripción no puede exceder 500 caracteres";
      esValido = false;
    }

    if (!fechaEntrega) {
      nuevosErrores.fecha_entrega = "La fecha de entrega es requerida";
      esValido = false;
    }

    if (subtareas && subtareas.length > 0) {
      const titulosSubtareas = subtareas
        .map((s) => s.titulo ? s.titulo.trim() : "")
        .filter((t) => t !== "");
      const duplicados = titulosSubtareas.filter(
        (t, i) => titulosSubtareas.indexOf(t) !== i
      );

      if (duplicados.length > 0) {
        nuevosErrores.subtareas = "No puede haber subtareas con títulos duplicados";
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
    }

    setErrors(nuevosErrores);
    return esValido;
  };

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return { errors, setErrors, validarFormulario, clearError };
}
