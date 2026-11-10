import { useCallback, useEffect, useState } from "react";

export const TAREAS = [
  "Pliegos",
  "Consultas sobre la oferta",
  "Formatos",
  "Consulta Taxes",
  "Consulta Cartera",
  "Póliza de seriedad",
  "Otras pólizas",
  "Factores financieros",
  "Soporte del formato de escalación",
  "Formato de escalación APLICA",
  "FOCAL",
];

const KEY = "ofertas.checklist.v1";
const EVT = "ofertas-checklist";
export type EstadoChecklist = Record<string, Record<string, boolean>>;

export function useChecklist() {
  const [estado, setEstado] = useState<EstadoChecklist>({});
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const leer = () => {
      try { setEstado(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* */ }
    };
    leer();
    setCargado(true);
    window.addEventListener(EVT, leer);
    window.addEventListener("storage", leer);
    return () => { window.removeEventListener(EVT, leer); window.removeEventListener("storage", leer); };
  }, []);

  const alternar = useCallback((oid: string, t: string) => {
    setEstado((p) => {
      const n = { ...p, [oid]: { ...(p[oid] ?? {}), [t]: !p[oid]?.[t] } };
      localStorage.setItem(KEY, JSON.stringify(n));
      return n;
    });
  }, []);

  const pendientesDe = useCallback(
    (oid: string) => TAREAS.filter((t) => !estado[oid]?.[t]),
    [estado],
  );

  return { estado, cargado, alternar, pendientesDe };
}
