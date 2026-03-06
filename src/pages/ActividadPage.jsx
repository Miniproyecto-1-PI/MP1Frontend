import { useParams } from "react-router";
import PageHeader from "@/components/layout/PageHeader";
import { FileText } from "lucide-react";

export default function ActividadPage() {
  const { id } = useParams();

  return (
    <div>
      <PageHeader
        title={`Actividad #${id}`}
        description="Detalle, reprogramación y seguimiento de la actividad"
        icon={FileText}
      />
      <div className="mt-6">
        <p className="text-muted-foreground">
          Aquí se mostrará el detalle de la actividad, permitirá reprogramar
          fechas, resolver conflictos y registrar avance real.
        </p>
      </div>
    </div>
  );
}
