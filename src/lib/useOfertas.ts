import { useCallback, useEffect, useState } from "react";
import {
  ACTIVIDADES_SEED,
  OPORTUNIDADES_SEED,
  type Actividad,
  type Oportunidad,
} from "./opportunities";

const KEY_OPS = "ofertas.oportunidades.v2";
const KEY_ACT = "ofertas.actividades.v2";

function leer<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useOfertas() {
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>(OPORTUNIDADES_SEED);
  const [actividades, setActividades] = useState<Actividad[]>(ACTIVIDADES_SEED);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setOportunidades(leer(KEY_OPS, OPORTUNIDADES_SEED));
    setActividades(leer(KEY_ACT, ACTIVIDADES_SEED));
    setListo(true);
  }, []);

  useEffect(() => {
    if (listo) window.localStorage.setItem(KEY_OPS, JSON.stringify(oportunidades));
  }, [oportunidades, listo]);

  useEffect(() => {
    if (listo) window.localStorage.setItem(KEY_ACT, JSON.stringify(actividades));
  }, [actividades, listo]);

  const agregarOportunidad = useCallback((o: Oportunidad) => {
    setOportunidades((prev) => [o, ...prev.filter((p) => p.id !== o.id)]);
  }, []);

  const eliminarOportunidad = useCallback((id: string) => {
    setOportunidades((prev) => prev.filter((p) => p.id !== id));
    setActividades((prev) => prev.filter((a) => a.oportunidadId !== id));
  }, []);

  const alternarActividad = useCallback((id: string) => {
    setActividades((prev) =>
      prev.map((a) => (a.id === id ? { ...a, hecha: !a.hecha } : a)),
    );
  }, []);

  const agregarActividad = useCallback((a: Actividad) => {
    setActividades((prev) => [...prev, a]);
  }, []);

  return {
    oportunidades,
    actividades,
    listo,
    agregarOportunidad,
    eliminarOportunidad,
    alternarActividad,
    agregarActividad,
  };
}
