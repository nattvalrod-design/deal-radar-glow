export type Estado =
  | "Calificación"
  | "Propuesta"
  | "Negociación"
  | "Ganada"
  | "Perdida";

export const ESTADOS: Estado[] = [
  "Calificación",
  "Propuesta",
  "Negociación",
  "Ganada",
  "Perdida",
];

export type Actividad = {
  id: string;
  oportunidadId: string;
  titulo: string;
  fecha: string; // ISO date
  hecha: boolean;
};

export type Oportunidad = {
  id: string; // Opportunity ID, p.ej. OPP-2041
  nombre: string;
  cliente: string;
  responsable: string;
  estado: Estado;
  fechaCierre: string; // ISO date
  valor: number;
  notas?: string;
};

export type Semaforo = "verde" | "ambar" | "rojo";

export const hoy = () => new Date(new Date().toDateString());

export function diasRestantes(fechaCierre: string): number {
  const d = new Date(fechaCierre + "T00:00:00");
  return Math.round((d.getTime() - hoy().getTime()) / 86400000);
}

export function semaforo(o: Oportunidad): Semaforo {
  if (o.estado === "Ganada") return "verde";
  if (o.estado === "Perdida") return "rojo";
  const d = diasRestantes(o.fechaCierre);
  if (d < 0) return "rojo";
  if (d <= 7) return "ambar";
  return "verde";
}

export const SEMAFORO_LABEL: Record<Semaforo, string> = {
  verde: "En camino",
  ambar: "Riesgo",
  rojo: "Crítico",
};

export function formatoMoneda(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

export function formatoFecha(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function fechaRelativa(dias: number): string {
  const d = new Date(hoy().getTime() + dias * 86400000);
  return d.toISOString().slice(0, 10);
}

export const OPORTUNIDADES_SEED: Oportunidad[] = [
  {
    id: "OPP-2041",
    nombre: "Mantenimiento preventivo anual",
    cliente: "Empresa A",
    responsable: "L. Ferrer",
    estado: "Ganada",
    fechaCierre: fechaRelativa(-3),
    valor: 1_200_000,
  },
  {
    id: "OPP-2038",
    nombre: "Modernización de media tensión",
    cliente: "Empresa B",
    responsable: "M. Duarte",
    estado: "Negociación",
    fechaCierre: fechaRelativa(5),
    valor: 840_000,
  },
  {
    id: "OPP-2035",
    nombre: "Pruebas y calibración de relés",
    cliente: "Empresa C",
    responsable: "A. Reyes",
    estado: "Propuesta",
    fechaCierre: fechaRelativa(2),
    valor: 320_000,
  },
  {
    id: "OPP-2032",
    nombre: "Mantenimiento de celdas eléctricas",
    cliente: "Empresa D",
    responsable: "L. Ferrer",
    estado: "Negociación",
    fechaCierre: fechaRelativa(24),
    valor: 1_900_000,
  },
  {
    id: "OPP-2029",
    nombre: "Suministro de relés de protección",
    cliente: "Empresa E",
    responsable: "M. Duarte",
    estado: "Calificación",
    fechaCierre: fechaRelativa(6),
    valor: 410_000,
  },
  {
    id: "OPP-2024",
    nombre: "Adecuación de red de media tensión",
    cliente: "Empresa F",
    responsable: "A. Reyes",
    estado: "Propuesta",
    fechaCierre: fechaRelativa(-6),
    valor: 560_000,
  },
  {
    id: "OPP-2019",
    nombre: "Mantenimiento correctivo de subestación",
    cliente: "Empresa G",
    responsable: "C. Vidal",
    estado: "Negociación",
    fechaCierre: fechaRelativa(38),
    valor: 730_000,
  },
];

export const ACTIVIDADES_SEED: Actividad[] = [
  {
    id: "ACT-1",
    oportunidadId: "OPP-2041",
    titulo: "Enviar propuesta final a Empresa A",
    fecha: fechaRelativa(0),
    hecha: false,
  },
  {
    id: "ACT-2",
    oportunidadId: "OPP-2032",
    titulo: "Llamada de seguimiento con Empresa D",
    fecha: fechaRelativa(1),
    hecha: false,
  },
  {
    id: "ACT-3",
    oportunidadId: "OPP-2029",
    titulo: "Actualizar presupuesto para Empresa E",
    fecha: fechaRelativa(3),
    hecha: false,
  },
  {
    id: "ACT-4",
    oportunidadId: "OPP-2024",
    titulo: "Reactivar contacto con Empresa F",
    fecha: fechaRelativa(-1),
    hecha: false,
  },
];
