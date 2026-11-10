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
const KEY_NA = "ofertas.checklist.na.v1";
const KEY_COM = "ofertas.checklist.comentarios.v1";
export type EstadoChecklist = Record<string, Record<string, boolean>>;
export type Comentario = { texto: string; fecha: string };
export type Comentarios = Record<string, Record<string, Comentario[]>>;
function leerJSON<T>(k: string): T { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch { return {} as T; } }

export function useChecklist() {
  const [estado, setEstado] = useState<EstadoChecklist>({});
  const [na, setNa] = useState<EstadoChecklist>({});
  const [comentarios, setComentarios] = useState<Comentarios>({});
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const leer = () => {
      setEstado(leerJSON(KEY)); setNa(leerJSON(KEY_NA)); setComentarios(leerJSON(KEY_COM));
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

  const alternarNA = useCallback((oid: string, t: string) => {
    setNa((p) => {
      const n = { ...p, [oid]: { ...(p[oid] ?? {}), [t]: !p[oid]?.[t] } };
      localStorage.setItem(KEY_NA, JSON.stringify(n));
      return n;
    });
  }, []);

  const comentar = useCallback((oid: string, t: string, texto: string) => {
    setComentarios((p) => {
      const lista = [...(p[oid]?.[t] ?? []), { texto, fecha: new Date().toISOString() }];
      const n = { ...p, [oid]: { ...(p[oid] ?? {}), [t]: lista } };
      localStorage.setItem(KEY_COM, JSON.stringify(n));
      return n;
    });
  }, []);

  /** Tareas que aplican a la oferta (excluye "No aplica"). */
  const aplicanDe = useCallback((oid: string) => TAREAS.filter((t) => !na[oid]?.[t]), [na]);

  const pendientesDe = useCallback(
    (oid: string) => TAREAS.filter((t) => !na[oid]?.[t] && !estado[oid]?.[t]),
    [estado, na],
  );

  return { estado, na, comentarios, cargado, alternar, alternarNA, comentar, aplicanDe, pendientesDe };
}
