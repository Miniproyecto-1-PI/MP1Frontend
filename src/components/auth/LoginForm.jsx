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

export default function LoginForm() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular un pequeño delay para dar feedback visual
    await new Promise((resolve) => setTimeout(resolve, 600));

    login({
      name: formData.name || "Estudiante",
      email: formData.email || "estudiante@universidad.edu",
    });

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
      <CardHeader className="space-y-3 text-center pb-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">
          📚
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Study Planner
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Planificador de actividades evaluativas
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-name">Nombre</Label>
            <Input
              id="login-name"
              name="name"
              type="text"
              placeholder="Tu nombre"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-email">Correo electrónico</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="correo@universidad.edu"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className="h-11"
            />
          </div>

          <Button
            id="login-submit"
            type="submit"
            className="w-full h-11 text-base font-semibold cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Ingresando...
              </span>
            ) : (
              "Ingresar"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-1">
            Ingresa cualquier dato para comenzar
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
