import PageHeader from "@/components/layout/PageHeader";

export default function HoyPage() {
  return (
    <div>
      <PageHeader
        title="Hoy"
        description="Tus prioridades y tareas pendientes para hoy"
        icon="📅"
      />
      <div className="mt-6">
        <p className="text-muted-foreground">
          Aquí se mostrarán las actividades y subtareas priorizadas para hoy.
        </p>
      </div>
    </div>
  );
}
