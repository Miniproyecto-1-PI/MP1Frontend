/**
 * Componente reutilizable para encabezados de página.
 * Mantiene consistencia visual entre todas las rutas.
 *
 * @param {object} props
 * @param {string} props.title - Título principal de la sección
 * @param {string} props.description - Descripción breve de la sección
 * @param {React.ComponentType} [props.icon] - Componente de icono (lucide-react)
 * @param {React.ReactNode} [props.actions] - Acciones adicionales (botones, etc.)
 */
export default function PageHeader({ title, description, icon: Icon, actions }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
