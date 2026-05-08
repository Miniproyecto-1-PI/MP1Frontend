import { AlertTriangle, X } from "lucide-react";

export default function ConflictPanel({ conflicto, onAction, onDismiss }) {
  if (!conflicto) return null;

  return (
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
                  onClick={() => onAction(alt.accion)}
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
          onClick={onDismiss}
          className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          aria-label="Cerrar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
