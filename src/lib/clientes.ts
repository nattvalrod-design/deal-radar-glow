import type { EstadoInspektor } from "./opportunities";

export type TipoEntidad = "Pública" | "Mixta";
export type OrigenCliente = "Nacional" | "Extranjero";
export type CondicionCartera =
  | "Pago anticipado"
  | "Pago a 30 días"
  | "Pago a 45 días"
  | "Pago a 60 días"
  | "Pago a 90 días"
  | "Pago a 120 días"
  | "Pago a 180 días";

export type Cliente = {
  nombre: string; // debe coincidir con Oportunidad.cliente
  tipoEntidad: TipoEntidad;
  origen: OrigenCliente;
  formaPago: string;
  diasPago: number;
  vip: boolean;
  condicionCartera: CondicionCartera;
  inspektor: EstadoInspektor;
};

/** Umbral a partir del cual se consulta cartera de clientes VIP (USD). */
export const UMBRAL_CARTERA_VIP = 3_000_000;

/** Un cliente VIP solo requiere consulta de cartera si la oferta supera el umbral. */
export function requiereCartera(c: Cliente, valorOferta: number): boolean {
  return !c.vip || valorOferta > UMBRAL_CARTERA_VIP;
}

export const CLIENTES_SEED: Cliente[] = [
  { nombre: "Empresa A", tipoEntidad: "Pública", origen: "Nacional", formaPago: "Transferencia", diasPago: 60, vip: true, condicionCartera: "Pago a 60 días", inspektor: "VIGENTE" },
  { nombre: "Empresa B", tipoEntidad: "Mixta", origen: "Nacional", formaPago: "Transferencia", diasPago: 45, vip: false, condicionCartera: "Pago a 45 días", inspektor: "POR VENCER" },
  { nombre: "Empresa C", tipoEntidad: "Pública", origen: "Extranjero", formaPago: "Transferencia", diasPago: 90, vip: false, condicionCartera: "Pago a 90 días", inspektor: "VENCIDO" },
  { nombre: "Empresa D", tipoEntidad: "Mixta", origen: "Nacional", formaPago: "Transferencia", diasPago: 30, vip: true, condicionCartera: "Pago a 30 días", inspektor: "VIGENTE" },
  { nombre: "Empresa E", tipoEntidad: "Pública", origen: "Extranjero", formaPago: "Carta de crédito", diasPago: 0, vip: false, condicionCartera: "Pago anticipado", inspektor: "POR VENCER" },
  { nombre: "Empresa F", tipoEntidad: "Mixta", origen: "Nacional", formaPago: "Transferencia", diasPago: 120, vip: false, condicionCartera: "Pago a 120 días", inspektor: "VENCIDO" },
  { nombre: "Empresa G", tipoEntidad: "Pública", origen: "Extranjero", formaPago: "Carta de crédito", diasPago: 180, vip: true, condicionCartera: "Pago a 180 días", inspektor: "VIGENTE" },
];

/** Fecha (relativa a hoy) en la que el documento Inspektor deja de ser vigente. */
const DIAS_VENCE: Record<EstadoInspektor, number> = { VIGENTE: 180, "POR VENCER": 20, VENCIDO: -15 };
export function venceInspektor(c: Cliente, i: number): string {
  const d = new Date(new Date().toDateString());
  d.setDate(d.getDate() + DIAS_VENCE[c.inspektor] + i * 3);
  return d.toISOString().slice(0, 10);
}
