import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginForm({ onSwitchToRegister }) {
  const { login, authError, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (authError) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      return;
    }

    setIsLoading(true);
    await login(formData.email, formData.password);
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border border-border/50 bg-card/80 backdrop-blur-xl dark:bg-card/50 mx-auto">
      <CardHeader className="space-y-3 text-center pb-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <BookOpen className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Study Planner
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Inicia sesión para acceder a tu planificador
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Error message */}
          {authError && (
            <div
              className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="login-email">Correo</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="Tu correo electrónico"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className="h-11"
              required
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Contraseña</Label>
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Tu contraseña"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="h-11 pr-10"
                required
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            id="login-submit"
            type="submit"
            className="w-full h-11 text-base font-semibold cursor-pointer"
            disabled={isLoading || !formData.email.trim() || !formData.password.trim()}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Iniciando sesión...
              </span>
            ) : (
              "Iniciar sesión"
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground pt-1">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-primary font-medium hover:underline cursor-pointer"
            >
              Crear cuenta
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
