import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Settings, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [limite, setLimite] = useState(user?.limite_diario_horas || 6);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    
    if (limite < 1 || limite > 16) {
      setError("El límite debe estar entre 1 y 16 horas");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiFetch("/auth/perfil/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ limite_diario_horas: parseFloat(limite) })
      });

      if (!response.ok) {
         throw new Error("No se pudo guardar la configuración");
      }
      
      const data = await response.json();
      
      // Actualizar el estado local
      const stored = localStorage.getItem("study-planner-user");
      if (stored) {
        const userInfo = JSON.parse(stored);
        userInfo.limite_diario_horas = data.limite_diario_horas;
        localStorage.setItem("study-planner-user", JSON.stringify(userInfo));
      }
      
      setSuccess(true);
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
        description="Ajusta las preferencias de tu planificador"
        icon={Settings}
      />
      
      <div className="mt-6 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Capacidad Diaria</CardTitle>
            <CardDescription>
              Define el máximo de horas que puedes dedicar al estudio cada día para detectar casos de sobrecarga.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 text-green-600 rounded-lg text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Configuración guardada correctamente</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="limite">Límite diario de horas (1-16)</Label>
              <Input
                id="limite"
                type="number"
                min="1"
                max="16"
                value={limite}
                onChange={(e) => setLimite(e.target.value)}
              />
            </div>
            
            <Button onClick={handleSave} disabled={isSaving || limite < 1 || limite > 16} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              Guardar configuración
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
