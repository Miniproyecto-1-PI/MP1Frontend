# Mini-proyecto 1: Planificador de Estudio

## 📖 Contexto del Proyecto

Los estudiantes universitarios necesitan planificar, ejecutar y reprogramar el trabajo asociado a **actividades evaluativas**, así como visualizar su progreso y prioridades sin fricción, especialmente cuando surgen imprevistos (cambios de fechas, acumulación de tareas, sobrecarga semanal).

Este proyecto propone una aplicación web diseñada para gestionar ese proceso de forma clara, eficiente y centrada en resolver las necesidades diarias del estudiante.

### 🎯 Objetivos Principales

La aplicación web permite:

1. **Crear actividades evaluativas** y establecer un plan de trabajo inicial.
2. **Registrar la ejecución** de tareas (avance real).
3. **Reprogramar** ante imprevistos, detectando y facilitando la resolución de conflictos de fechas.
4. **Visualizar el momento presente ("Hoy")**, mostrando de inmediato el progreso y las prioridades del día bajo criterios comprensibles.

## 🛠️ Stack Tecnológico

La aplicación está construida con tecnologías modernas para asegurar rapidez y mantenibilidad:

- **React 19**
- **Vite** (bundler ultrarrápido)
- **React Router v7** (en modo Data API para loaders/actions)
- **Tailwind CSS v4** (estilización utility-first)
- **shadcn/ui** (componentes accesibles y personalizables sin bloqueo de dependencias)

## 🚀 Cómo empezar (Clonación y Ejecución)

Sigue estos pasos para lograr ejecutar el proyecto de forma local en tu computadora.

### 1. Prerrequisitos

Asegúrate de tener instalado en tu sistema:

- [Node.js](https://nodejs.org/) (se recomienda v18 o superior)
- Git (para clonar el repositorio)

### 2. Clonar el repositorio

Abre una terminal y ejecuta el siguiente comando:

```bash
git clone https://github.com/Miniproyecto-1-PI/MP1Frontend.git
```

### 3. Navegar a la carpeta del proyecto

Ingresa al directorio recién clonado de la aplicación:

```bash
cd MP1Frontend/mp1-app
```

### 4. Instalar las dependencias

Instala los paquetes de `npm` necesarios que requiere el proyecto (como React, Tailwind, dependencias de shadcn, etc.):

```bash
npm install
```

### 5. Iniciar el servidor de desarrollo

Finalmente, levanta el servidor de desarrollo en local:

```bash
npm run dev
```

La aplicación estará corriendo normalmente en `http://localhost:5173`. Navegar a esa dirección te dirigirá automáticamente al flujo de Login / Vista Principal.

## 📂 Estructura de Rutas Actual

El enrutamiento está centralizado con `React Router v7` trabajando como SPA (Single Page Application):

- `/login` : Pantalla sencilla de acceso.
- `/hoy` : Visualizar qué debe hacerse hoy y prioridades inmediatas.
- `/crear` : Formulario de creación de una actividad + plan inicial.
- `/actividad/:id` : Vista de detalle, vista para reprogramar y registrar avances de una meta en concreto.
- `/progreso` : Panel analítico que permite visualizar el progreso del trabajo global.
