import PageHeader from "@/components/layout/PageHeader";
import { TrendingUp } from "lucide-react";

export default function ProgresoPage() {
  return (
    <div>
      <PageHeader
        title="Progreso"
        description="Visualiza el avance general de tus actividades evaluativas"
        icon={TrendingUp}
      />
      <div className="mt-6">
        <p className="text-muted-foreground">
          Aquí se visualizará el progreso del trabajo, con métricas de avance y
          estado de las actividades.
        </p>
      </div>
    </div>
  );
}
