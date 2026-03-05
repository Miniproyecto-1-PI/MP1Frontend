import PageHeader from "@/components/layout/PageHeader";

export default function CrearPage() {
  return (
    <div>
      <PageHeader
        title="Crear actividad"
        description="Crea una nueva actividad evaluativa con su plan de trabajo"
        icon="➕"
      />
      <div className="mt-6">
        <p className="text-muted-foreground">
          Aquí se podrá crear una actividad evaluativa e ingresar su plan
          inicial de trabajo (subtareas / hitos).
        </p>
      </div>
    </div>
  );
}
