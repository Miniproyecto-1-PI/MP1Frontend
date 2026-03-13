import { NavLink } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Plus, TrendingUp, LogOut, BookOpen } from "lucide-react";

const NAV_ITEMS = [
  {
    to: "/hoy",
    label: "Hoy",
    icon: Calendar,
    description: "Prioridades del día",
  },
  {
    to: "/crear",
    label: "Crear actividad",
    icon: Plus,
    description: "Nueva actividad evaluativa",
  },
  {
    to: "/progreso",
    label: "Progreso",
    icon: TrendingUp,
    description: "Visualizar avance",
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex flex-col h-full w-64 border-r bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight">Study Planner</h1>
          <p className="text-xs text-sidebar-foreground/60">
            Planificador académico
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <div>
              <span className="block">{item.label}</span>
              <span className="block text-xs opacity-60 font-normal">
                {item.description}
              </span>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
              {user?.avatar || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email}
            </p>
          </div>
          <Button
            id="logout-button"
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
