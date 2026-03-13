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

export default function RegisterForm({ onSwitchToLogin }) {
  const { registro, authError, clearError } = useAuth();
  const [formData, setFormData] = useState({
    first_name: "",
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localErrors, setLocalErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (authError) clearError();
    if (localErrors[name]) {
      setLocalErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.first_name.trim()) errs.first_name = "Tu nombre es requerido";
    if (!formData.username.trim()) errs.username = "El usuario es requerido";
    else if (formData.username.trim().length < 3) errs.username = "Mínimo 3 caracteres";
    if (!formData.email.trim()) errs.email = "El correo es requerido";
    if (!formData.password) errs.password = "La contraseña es requerida";
    else if (formData.password.length < 6) errs.password = "Mínimo 6 caracteres";
    if (formData.password !== formData.password_confirm) {
      errs.password_confirm = "Las contraseñas no coinciden";
    }
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    await registro(formData);
    setIsLoading(false);
  };

  const renderFieldError = (field) =>
    localErrors[field] ? (
      <p className="text-destructive text-xs mt-1" role="alert">
        {localErrors[field]}
      </p>
    ) : null;

  return (
    <Card className="w-full max-w-md shadow-2xl border border-border/50 bg-card/80 backdrop-blur-xl dark:bg-card/50 mx-auto">
      <CardHeader className="space-y-3 text-center pb-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <BookOpen className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Crear cuenta
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Regístrate para comenzar a planificar
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

          <div className="space-y-1.5">
            <Label htmlFor="register-name">Nombre</Label>
            <Input
              id="register-name"
              name="first_name"
              type="text"
              placeholder="Tu nombre"
              value={formData.first_name}
              onChange={handleChange}
              className="h-11"
              required
              aria-required="true"
            />
            {renderFieldError("first_name")}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-username">Usuario</Label>
            <Input
              id="register-username"
              name="username"
              type="text"
              placeholder="Nombre de usuario"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              className="h-11"
              required
              aria-required="true"
            />
            {renderFieldError("username")}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-email">Correo electrónico</Label>
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder="correo@universidad.edu"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className="h-11"
              required
              aria-required="true"
            />
            {renderFieldError("email")}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-password">Contraseña</Label>
            <div className="relative">
              <Input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
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
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {renderFieldError("password")}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-password-confirm">Confirmar contraseña</Label>
            <Input
              id="register-password-confirm"
              name="password_confirm"
              type="password"
              placeholder="Repite la contraseña"
              value={formData.password_confirm}
              onChange={handleChange}
              autoComplete="new-password"
              className="h-11"
              required
              aria-required="true"
            />
            {renderFieldError("password_confirm")}
          </div>

          <Button
            id="register-submit"
            type="submit"
            className="w-full h-11 text-base font-semibold cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando cuenta...
              </span>
            ) : (
              "Crear cuenta"
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground pt-1">
            ¿Ya tienes cuenta?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary font-medium hover:underline cursor-pointer"
            >
              Iniciar sesión
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
