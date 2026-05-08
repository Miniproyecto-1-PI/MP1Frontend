import { useState, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export function useOverloadDetection(debounceMs = 500) {
  const [conflicto, setConflicto] = useState(null);
  const [conflictoSubtareaIndex, setConflictoSubtareaIndex] = useState(null);
  
  // Ref para el timeout del debounce
  const timeoutRef = useRef(null);
  // Ref para caché de resultados de verificación: key: `${fecha}-${horas}-${subtarea_id || 'new'}`, value: result
  const cacheRef = useRef(new Map());

  const dismissConflict = useCallback(() => {
    setConflicto(null);
    setConflictoSubtareaIndex(null);
  }, []);

  const verificarConflicto = useCallback((index, subtarea, nuevaFecha, horasOverride) => {
    const horas = horasOverride !== undefined ? parseFloat(horasOverride) : parseFloat(subtarea?.horas_estimadas);
    if (!nuevaFecha || !horas || horas <= 0) return;

    const cacheKey = `${nuevaFecha}-${horas}-${subtarea?.id || 'new'}`;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      // Check cache first
      if (cacheRef.current.has(cacheKey)) {
        const data = cacheRef.current.get(cacheKey);
        handleVerificationResult(index, data);
        return;
      }

      try {
        const response = await apiFetch("/conflicto/verificar/", {
          method: "POST",
          body: JSON.stringify({
            fecha: nuevaFecha,
            horas_nuevas: horas,
            subtarea_id: subtarea?.id || undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Store in cache (simple TTL could be added here, but component unmount clears it)
          cacheRef.current.set(cacheKey, data);
          handleVerificationResult(index, data);
        }
      } catch {
        // Silenciar errores de verificación
      }
    }, debounceMs);
  }, [debounceMs]);

  const handleVerificationResult = (index, data) => {
    if (data.hay_conflicto) {
      setConflicto(data);
      setConflictoSubtareaIndex(index);
    } else {
      // Sin conflicto — limpiar si era de esta subtarea
      setConflictoSubtareaIndex((prevIndex) => {
        if (prevIndex === index) {
          setConflicto(null);
          return null;
        }
        return prevIndex;
      });
    }
  };

  const handleConflictAction = useCallback((accion, subtareas, setSubtareas, setMensaje) => {
    const idx = conflictoSubtareaIndex;
    if (idx === null) return;

    switch (accion) {
      case "mover": {
        const nuevasSubtareas = [...subtareas];
        nuevasSubtareas[idx].fecha_objetivo = "";
        setSubtareas(nuevasSubtareas);
        dismissConflict();
        if(setMensaje) {
          setMensaje({
            type: "info",
            text: "Fecha limpiada — elige un día con menos carga.",
          });
          setTimeout(() => setMensaje(null), 3000);
        }
        break;
      }
      case "reducir": {
        if (conflicto) {
          const disponible = conflicto.limite - conflicto.horas_actuales;
          if (disponible > 0) {
            const nuevasSubtareas = [...subtareas];
            nuevasSubtareas[idx].horas_estimadas = disponible.toFixed(1);
            setSubtareas(nuevasSubtareas);
            if (setMensaje) {
              setMensaje({
                type: "info",
                text: `Horas ajustadas a ${disponible.toFixed(1)}h para caber en tu día.`,
              });
              setTimeout(() => setMensaje(null), 3000);
            }
          }
        }
        dismissConflict();
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
          dismissConflict();
          if (setMensaje) {
            setMensaje({
              type: "info",
              text: `Subtarea movida al ${new Date(nuevaFecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}. Verificando carga...`,
            });
            setTimeout(() => setMensaje(null), 3000);
          }
          // Re-verify in new date immediately (bypass debounce)
          const horas = parseFloat(nuevasSubtareas[idx].horas_estimadas);
          if (horas > 0) {
             // Immediate check, skipping the standard verify function's debounce
             apiFetch("/conflicto/verificar/", {
               method: "POST",
               body: JSON.stringify({
                 fecha: nuevaFecha,
                 horas_nuevas: horas,
                 subtarea_id: nuevasSubtareas[idx].id || undefined,
               }),
             }).then(res => res.ok ? res.json() : null)
               .then(data => {
                  if (data && data.hay_conflicto) {
                     setConflicto(data);
                     setConflictoSubtareaIndex(idx);
                  }
               }).catch(()=>{});
          }
        }
        break;
      }
      case "forzar": {
        dismissConflict();
        if (setMensaje) {
          setMensaje({
            type: "info",
            text: "Conflicto ignorado — puedes continuar.",
          });
          setTimeout(() => setMensaje(null), 3000);
        }
        break;
      }
      default:
        break;
    }
  }, [conflicto, conflictoSubtareaIndex, dismissConflict]);

  // For verifying all before submit
  const verificarTodosConflictos = async (subtareas) => {
    const subtareasValidas = subtareas.filter((s) => s.titulo.trim() !== "");
    for (let i = 0; i < subtareasValidas.length; i++) {
      const sub = subtareasValidas[i];
      const horas = parseFloat(sub.horas_estimadas);
      if (!sub.fecha_objetivo || !horas || horas <= 0) continue;

      const cacheKey = `${sub.fecha_objetivo}-${horas}-${sub.id || 'new'}`;
      let data = null;

      if (cacheRef.current.has(cacheKey)) {
        data = cacheRef.current.get(cacheKey);
      } else {
        try {
          const response = await apiFetch("/conflicto/verificar/", {
            method: "POST",
            body: JSON.stringify({
              fecha: sub.fecha_objetivo,
              horas_nuevas: horas,
              subtarea_id: sub.id || undefined,
            }),
          });
          if (response.ok) {
            data = await response.json();
            cacheRef.current.set(cacheKey, data);
          }
        } catch {
          // continue if check fails
        }
      }

      if (data && data.hay_conflicto) {
        const originalIndex = subtareas.indexOf(sub);
        setConflicto(data);
        setConflictoSubtareaIndex(originalIndex);
        return { hayConflicto: true, subtarea: sub, originalIndex, fecha: sub.fecha_objetivo };
      }
    }
    return { hayConflicto: false };
  };

  return {
    conflicto,
    conflictoSubtareaIndex,
    verificarConflicto,
    handleConflictAction,
    verificarTodosConflictos,
    dismissConflict,
  };
}
