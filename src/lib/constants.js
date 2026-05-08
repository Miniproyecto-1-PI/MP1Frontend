export const TIPOS_ACTIVIDAD = [
  { value: "tarea", label: "Tarea" },
  { value: "proyecto", label: "Proyecto" },
  { value: "examen", label: "Examen" },
  { value: "quiz", label: "Quiz" },
  { value: "laboratorio", label: "Laboratorio" },
  { value: "lectura", label: "Lectura" },
  { value: "otro", label: "Otro" },
];

export const TIPOS_SUBTAREA = [
  { value: "investigacion", label: "Investigación" },
  { value: "redaccion", label: "Redacción" },
  { value: "programacion", label: "Programación" },
  { value: "estudio", label: "Estudio" },
  { value: "revision", label: "Revisión" },
  { value: "practica", label: "Práctica" },
  { value: "otro", label: "Otro" },
];

export const initialErrors = {
  titulo: "",
  descripcion: "",
  fecha_entrega: "",
  subtareas: "",
};
