import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useOfertas } from "@/lib/useOfertas";
import { exportarPrerequisitoPDF } from "@/lib/exportar";
import {
  DIAS_VALIDEZ_DEFAULT,
  UMBRAL_REUNION,
  fechaFinValidez,
  formatoFecha,
  formatoMoneda,
  requiereReunion,
} from "@/lib/opportunities";

export const Route = createFileRoute("/prerequisito")({
  head: () => ({
    meta: [
      { title: "Pre-requisito aprobación — OfferPulse" },
      { name: "description", content: "Valor de cada oferta y si requiere reunión de aprobación según segmento." },
      { property: "og:title", content: "Pre-requisito aprobación — OfferPulse" },
      { property: "og:description", content: "Aprobación de ofertas MV y PA desde 150K USD, con informe PDF por bid manager." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Prerequisito,
});

type Rol = "tecnico" | "comercial";
const ROL_LABEL: Record<Rol, string> = { tecnico: "Bid manager", comercial: "Commercial bid manager" };

function Prerequisito() {
  const { oportunidades, listo } = useOfertas();
  const [rol, setRol] = useState<Rol>("tecnico");
  const [persona, setPersona] = useState("Todos");

  const personas = useMemo(() => [...new Set(oportunidades.map((o) => o[rol]))].sort(), [oportunidades, rol]);
  const filas = useMemo(
    () =>
      oportunidades
        .filter((o) => persona === "Todos" || o[rol] === persona)
        .sort((a, b) => a.fechaCierre.localeCompare(b.fechaCierre)),
    [oportunidades, rol, persona],
  );

  if (!listo) return <div className="min-h-screen bg-ink" />;
  const th = "px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground";
  const sel = "rounded-md border border-line bg-panel px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-ink text-foreground">
      <div className="mx-auto max-w-[1440px] px-6 py-7 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
              Offer<span className="text-brand">Pulse</span> · Pre-requisito aprobación
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              MV y PA: menos de {formatoMoneda(UMBRAL_REUNION)} no requiere reunión; desde ese valor sí.
            </p>
          </div>
          <Link to="/" className="rounded-md border border-line bg-panel px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-accent hover:border-brand">← Pipeline</Link>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <select className={sel} value={rol} onChange={(e) => { setRol(e.target.value as Rol); setPersona("Todos"); }}>
            <option value="tecnico">Por bid manager</option>
            <option value="comercial">Por commercial bid manager</option>
          </select>
          <select className={sel} value={persona} onChange={(e) => setPersona(e.target.value)}>
            <option value="Todos">Todos</option>
            {personas.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={() => exportarPrerequisitoPDF(filas, `${ROL_LABEL[rol]}: ${persona}`)}
            className="rounded-md bg-accent px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-panel hover:bg-accent/90"
          >
            Descargar PDF
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>ID</th><th className={th}>Oportunidad</th><th className={th}>Cliente</th>
                <th className={th}>Bid manager</th><th className={th}>Commercial BM</th><th className={th}>Segmento</th>
                <th className={th}>Entrega</th><th className={th}>Validez</th><th className={th}>Válida hasta</th>
                <th className={th}>Valor</th><th className={th}>Reunión</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((o) => {
                const r = requiereReunion(o);
                return (
                  <tr key={o.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                    <td className="px-4 py-3 font-medium">{o.nombre}</td>
                    <td className="px-4 py-3">{o.cliente}</td>
                    <td className="px-4 py-3">{o.tecnico}</td>
                    <td className="px-4 py-3">{o.comercial}</td>
                    <td className="px-4 py-3">{o.segmento}</td>
                    <td className="px-4 py-3">{formatoFecha(o.fechaCierre)}</td>
                    <td className="px-4 py-3">{o.diasValidez ?? DIAS_VALIDEZ_DEFAULT} días</td>
                    <td className="px-4 py-3">{formatoFecha(fechaFinValidez(o))}</td>
                    <td className="px-4 py-3 font-display font-semibold">{formatoMoneda(o.valor)}</td>
                    <td className="px-4 py-3">
                      {r === null ? <span className="text-xs text-muted-foreground">No aplica</span>
                        : r ? <span className="rounded bg-stop/15 px-2 py-0.5 text-xs font-semibold text-stop">Requiere reunión</span>
                        : <span className="rounded bg-go/15 px-2 py-0.5 text-xs font-semibold text-go">No requiere</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
