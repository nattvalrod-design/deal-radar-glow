import type { Oportunidad } from "./opportunities";
import { diasRestantes } from "./opportunities";

/**
 * Estructura preparada para una futura integración con IA.
 * Hoy calcula una probabilidad heurística local; mañana este mismo contrato
 * puede resolverse con un modelo (server function + AI Gateway) sin tocar la UI.
 */
export type PrediccionCierre = {
  oportunidadId: string;
  probabilidad: number; // 0..100
  motivo: string;
  fuente: "heuristica" | "modelo";
};

export function predecirCierre(o: Oportunidad): PrediccionCierre {
  const base: Record<Oportunidad["estado"], number> = {
    Calificación: 25,
    Propuesta: 45,
    Negociación: 65,
    Ganada: 100,
    Perdida: 0,
  };
  const d = diasRestantes(o.fechaCierre);
  let p = base[o.estado];
  if (o.estado !== "Ganada" && o.estado !== "Perdida") {
    if (d < 0) p -= 20;
    else if (d <= 7) p -= 8;
    if (o.valor > 1_000_000) p -= 5;
  }
  const probabilidad = Math.max(0, Math.min(100, Math.round(p)));
  return {
    oportunidadId: o.id,
    probabilidad,
    motivo:
      d < 0
        ? "Fecha de cierre vencida"
        : d <= 7
          ? "Cierre próximo, requiere empuje"
          : "Ritmo normal para la etapa",
    fuente: "heuristica",
  };
}
