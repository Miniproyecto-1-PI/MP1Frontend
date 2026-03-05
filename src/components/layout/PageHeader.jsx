/**
 * Componente reutilizable para encabezados de página.
 * Mantiene consistencia visual entre todas las rutas.
 *
 * @param {object} props
 * @param {string} props.title - Título principal de la sección
 * @param {string} props.description - Descripción breve de la sección
 * @param {string} [props.icon] - Emoji o icono decorativo
 * @param {React.ReactNode} [props.actions] - Acciones adicionales (botones, etc.)
 */
export default function PageHeader({ title, description, icon, actions }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="text-3xl" role="img" aria-hidden="true">
            {icon}
          </span>
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
