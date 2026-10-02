import type { EstadoInspektor } from "./opportunities";

export type TipoEntidad = "Pública" | "Mixta";
export type EstadoCartera = "Al día" | "En mora";

export type Cliente = {
  nombre: string; // debe coincidir con Oportunidad.cliente
  tipoEntidad: TipoEntidad;
  formaPago: string;
  diasPago: number;
  vip: boolean;
  estadoCartera: EstadoCartera;
  inspektor: EstadoInspektor;
};

/** Umbral a partir del cual se consulta cartera de clientes VIP (USD). */
export const UMBRAL_CARTERA_VIP = 3_000_000;

/** Un cliente VIP solo requiere consulta de cartera si la oferta supera el umbral. */
export function requiereCartera(c: Cliente, valorOferta: number): boolean {
  return !c.vip || valorOferta > UMBRAL_CARTERA_VIP;
}

export const CLIENTES_SEED: Cliente[] = [
  { nombre: "Empresa A", tipoEntidad: "Pública", formaPago: "Transferencia", diasPago: 60, vip: true, estadoCartera: "Al día", inspektor: "VIGENTE" },
  { nombre: "Empresa B", tipoEntidad: "Mixta", formaPago: "Crédito 30/60", diasPago: 45, vip: false, estadoCartera: "Al día", inspektor: "POR VENCER" },
  { nombre: "Empresa C", tipoEntidad: "Pública", formaPago: "Anticipo 30% + saldo", diasPago: 90, vip: false, estadoCartera: "En mora", inspektor: "VENCIDO" },
  { nombre: "Empresa D", tipoEntidad: "Mixta", formaPago: "Transferencia", diasPago: 30, vip: true, estadoCartera: "Al día", inspektor: "VIGENTE" },
  { nombre: "Empresa E", tipoEntidad: "Pública", formaPago: "Carta de crédito", diasPago: 75, vip: false, estadoCartera: "Al día", inspektor: "POR VENCER" },
  { nombre: "Empresa F", tipoEntidad: "Mixta", formaPago: "Crédito 60 días", diasPago: 60, vip: false, estadoCartera: "En mora", inspektor: "VENCIDO" },
  { nombre: "Empresa G", tipoEntidad: "Pública", formaPago: "Transferencia", diasPago: 120, vip: true, estadoCartera: "Al día", inspektor: "VIGENTE" },
];
