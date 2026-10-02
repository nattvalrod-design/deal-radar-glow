import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useOfertas } from "@/lib/useOfertas";
import { COLOR_INSPEKTOR, formatoMoneda } from "@/lib/opportunities";
import { CLIENTES_SEED, UMBRAL_CARTERA_VIP, requiereCartera, type TipoEntidad } from "@/lib/clientes";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — OfferPulse" },
      { name: "description", content: "Ficha de clientes: forma de pago, tipo de entidad, días de pago, estatus VIP, cartera e Inspektor." },
      { property: "og:title", content: "Clientes — OfferPulse" },
      { property: "og:description", content: "Clientes relacionados con ofertas adjudicadas, condiciones de pago y estado en Inspektor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Clientes,
});

function Clientes() {
  const { oportunidades, listo } = useOfertas();
  const [tipo, setTipo] = useState<"Todas" | TipoEntidad>("Todas");
  const [soloVip, setSoloVip] = useState(false);

  const filas = useMemo(
    () =>
      CLIENTES_SEED.filter((c) => (tipo === "Todas" || c.tipoEntidad === tipo) && (!soloVip || c.vip)).map((c) => {
        const adjudicadas = oportunidades.filter((o) => o.cliente === c.nombre && o.estado === "Ganada");
        const mayor = Math.max(0, ...adjudicadas.map((o) => o.valor));
        return {
          c,
          adjudicadas,
          consultaCartera: adjudicadas.length > 0 ? requiereCartera(c, mayor) : !c.vip,
        };
      }),
    [oportunidades, tipo, soloVip],
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
              Offer<span className="text-brand">Pulse</span> · Clientes
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              VIP: la cartera solo se consulta cuando la oferta supera {formatoMoneda(UMBRAL_CARTERA_VIP)}.
            </p>
          </div>
          <Link to="/" className="rounded-md border border-line bg-panel px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-accent hover:border-brand">
            ← Pipeline
          </Link>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <select className={sel} value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
            <option value="Todas">Todas las entidades</option>
            <option value="Pública">Pública</option>
            <option value="Mixta">Mixta</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soloVip} onChange={(e) => setSoloVip(e.target.checked)} /> Solo VIP
          </label>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Cliente</th>
                <th className={th}>Entidad</th>
                <th className={th}>Origen</th>
                <th className={th}>Forma de pago</th>
                <th className={th}>Días de pago</th>
                <th className={th}>VIP</th>
                <th className={th}>Cartera</th>
                <th className={th}>Inspektor</th>
                <th className={th}>Ofertas adjudicadas</th>
                <th className={th}>Código oportunidad</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ c, adjudicadas, consultaCartera }) => (
                <tr key={c.nombre} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{c.nombre}</td>
                  <td className="px-4 py-3">{c.tipoEntidad}</td>
                  <td className="px-4 py-3">{c.origen}</td>
                  <td className="px-4 py-3">{c.formaPago}</td>
                  <td className="px-4 py-3">{c.diasPago === 0 ? "Anticipado" : `${c.diasPago} días`}</td>
                  <td className="px-4 py-3">
                    {c.vip ? <span className="rounded bg-brand/15 px-2 py-0.5 text-xs font-semibold text-accent">VIP</span> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {consultaCartera ? (
                      <span>{c.condicionCartera}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No requiere consulta</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${COLOR_INSPEKTOR[c.inspektor]}`}>{c.inspektor}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {adjudicadas.length ? adjudicadas.map((o) => o.nombre).join(", ") : <span className="text-muted-foreground">Sin adjudicaciones</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-accent">
                    {adjudicadas.length ? adjudicadas.map((o) => o.id).join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
