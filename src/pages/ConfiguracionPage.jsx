import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import {
  Settings,
  Save,
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  Minus,
  Plus,
  Loader2,
  Zap,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

const PRESETS = [
  { value: 2, label: "Relajado", emoji: "🌿", desc: "Poco a poco" },
  { value: 4, label: "Moderado", emoji: "📚", desc: "Equilibrio ideal" },
  { value: 6, label: "Intenso", emoji: "🔥", desc: "Día productivo" },
  { value: 8, label: "Maratón", emoji: "🏃", desc: "Carga fuerte" },
];

function getIntensityInfo(hours) {
  if (hours <= 2) return { color: "emerald", label: "Ligero", emoji: "🌿" };
  if (hours <= 4) return { color: "blue", label: "Moderado", emoji: "📚" };
  if (hours <= 6) return { color: "amber", label: "Intenso", emoji: "🔥" };
  if (hours <= 10) return { color: "orange", label: "Fuerte", emoji: "🏃" };
  return { color: "red", label: "Extremo", emoji: "⚡" };
}

export default function ConfiguracionPage() {
  const { user, updateUser } = useAuth();
  const limiteGuardado = user?.limite_diario_horas || 6;
  const [limite, setLimite] = useState(limiteGuardado);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setHasChanged(parseFloat(limite) !== parseFloat(limiteGuardado));
  }, [limite, limiteGuardado]);

  const isValidRange = limite >= 1 && limite <= 16;
  const intensity = getIntensityInfo(parseFloat(limite) || 0);
  const progressPercent = Math.min(100, ((parseFloat(limite) || 0) / 16) * 100);

  const adjustLimit = (delta) => {
    const newVal = Math.max(1, Math.min(16, parseFloat(limite || 0) + delta));
    setLimite(newVal);
    setError(null);
    setSuccess(null);
  };

  const handleLimiteChange = (e) => {
    const val = e.target.value;
    setLimite(val === "" ? "" : parseFloat(val));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const numLimite = parseFloat(limite);

    if (isNaN(numLimite) || numLimite < 1 || numLimite > 16) {
      setError("Elige un valor entre 1 y 16 horas. Fuera de ese rango el planificador no puede funcionar bien.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiFetch("/auth/perfil/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limite_diario_horas: numLimite }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg =
          data.limite_diario_horas?.[0] ||
          data.detail ||
          "No se pudo guardar. Inténtalo de nuevo.";
        throw new Error(msg);
      }

      // Sync with auth context
      updateUser({ limite_diario_horas: data.limite_diario_horas });

      setSuccess({
        text: data.message || `Tu límite diario ahora es ${data.limite_diario_horas}h`,
        limite: data.limite_diario_horas,
        anterior: data.limite_anterior,
      });
      setLimite(data.limite_diario_horas);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Personaliza tu planificador para que se adapte a tu ritmo"
        icon={Settings}
      />

      <div className="mt-6 max-w-xl space-y-5">
        {/* ── Current Limit Display ── */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="py-5 px-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Tu límite diario actual
                </p>
                <p className="text-3xl font-bold tracking-tight">
                  {limiteGuardado}h
                  <span className="text-base font-normal text-muted-foreground ml-2">
                    por día
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  El sistema usará este valor para avisarte si planificas demasiado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Edit Limit Card ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Ajustar capacidad diaria
            </CardTitle>
            <CardDescription>
              ¿Cuántas horas al día puedes dedicar al estudio? Sé realista —
              es mejor cumplir un plan moderado que abandonar uno ambicioso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Error message */}
            {error && (
              <div
                className="flex items-start gap-3 p-3.5 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl text-sm animate-in fade-in slide-in-from-top-1 duration-200"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">No se pudo guardar</p>
                  <p className="text-destructive/80 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div
                className="flex items-start gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm animate-in fade-in slide-in-from-top-1 duration-200"
                role="status"
              >
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">¡Listo! Configuración guardada</p>
                  <p className="opacity-80 mt-0.5">{success.text}</p>
                  {success.anterior !== undefined &&
                    success.anterior !== success.limite && (
                      <p className="opacity-60 mt-0.5 text-xs">
                        Antes: {success.anterior}h → Ahora: {success.limite}h
                      </p>
                    )}
                </div>
              </div>
            )}

            {/* Presets */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                Atajos rápidos
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setLimite(preset.value);
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm transition-all duration-150 cursor-pointer hover:shadow-sm ${
                      parseFloat(limite) === preset.value
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/30 hover:bg-accent/50"
                    }`}
                  >
                    <span className="text-xl">{preset.emoji}</span>
                    <span className="font-medium text-xs">{preset.value}h</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {preset.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Number input with stepper */}
            <div className="space-y-2">
              <Label htmlFor="limite-diario" className="text-sm">
                Horas por día
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => adjustLimit(-0.5)}
                  disabled={parseFloat(limite) <= 1}
                  className="h-10 w-10 shrink-0"
                  aria-label="Reducir medio hora"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="relative flex-1">
                  <Input
                    id="limite-diario"
                    type="number"
                    min="1"
                    max="16"
                    step="0.5"
                    value={limite}
                    onChange={handleLimiteChange}
                    className={`text-center text-lg font-semibold pr-8 ${
                      !isValidRange && limite !== ""
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    aria-describedby="limite-hint"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    h
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => adjustLimit(0.5)}
                  disabled={parseFloat(limite) >= 16}
                  className="h-10 w-10 shrink-0"
                  aria-label="Aumentar medio hora"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p
                id="limite-hint"
                className="text-xs text-muted-foreground flex items-center gap-1"
              >
                <Info className="h-3 w-3" />
                Valor válido: entre 1h y 16h (en pasos de 0.5h)
              </p>
            </div>

            {/* Visual progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nivel de intensidad</span>
                <span className="font-medium flex items-center gap-1.5">
                  <span>{intensity.emoji}</span>
                  {intensity.label}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    intensity.color === "emerald"
                      ? "bg-emerald-500"
                      : intensity.color === "blue"
                        ? "bg-blue-500"
                        : intensity.color === "amber"
                          ? "bg-amber-500"
                          : intensity.color === "orange"
                            ? "bg-orange-500"
                            : "bg-red-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/60">
                <span>1h</span>
                <span>4h</span>
                <span>8h</span>
                <span>12h</span>
                <span>16h</span>
              </div>
            </div>

            {/* Out of range warning */}
            {!isValidRange && limite !== "" && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  El valor debe estar entre <strong>1</strong> y{" "}
                  <strong>16</strong> horas.
                  {parseFloat(limite) < 1
                    ? " Menos de 1 hora no permite planificar ninguna tarea."
                    : " Más de 16 horas no es realista para un día de estudio."}
                </p>
              </div>
            )}

            {/* Save button */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                id="save-daily-limit"
                onClick={handleSave}
                disabled={isSaving || !isValidRange || !hasChanged}
                className="flex-1 sm:flex-none"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {hasChanged ? "Guardar cambios" : "Sin cambios"}
                  </span>
                )}
              </Button>
              {hasChanged && (
                <button
                  type="button"
                  onClick={() => {
                    setLimite(limiteGuardado);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline underline-offset-2"
                >
                  Descartar
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Info card ── */}
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="py-4 px-5">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1.5">
                <p className="font-medium text-foreground/80">
                  ¿Cómo funciona el límite diario?
                </p>
                <ul className="space-y-1 list-disc list-inside text-xs leading-relaxed">
                  <li>
                    Al reprogramar una subtarea, el sistema suma las horas de
                    ese día y las compara con tu límite.
                  </li>
                  <li>
                    Si se supera, verás opciones claras para resolver la
                    sobrecarga (mover, reducir o posponer).
                  </li>
                  <li>
                    El valor por defecto es <strong>6 horas</strong>. Puedes
                    cambiarlo en cualquier momento.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
