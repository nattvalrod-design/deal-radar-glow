import { createFileRoute, Link } from "@tanstack/react-router";
import { CLIENTES_SEED, venceInspektor } from "@/lib/clientes";
import { COLOR_INSPEKTOR, diasRestantes, formatoFecha } from "@/lib/opportunities";

export const Route = createFileRoute("/inspektor")({
  head: () => ({
    meta: [
      { title: "Inspektor por cliente — OfferPulse" },
      { name: "description", content: "Estado Inspektor de cada cliente y fecha en la que su documento deja de ser vigente." },
      { property: "og:title", content: "Inspektor por cliente — OfferPulse" },
      { property: "og:description", content: "Vigencia del documento Inspektor por cliente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inspektor,
});

function Inspektor() {
  const th = "px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground";
  const filas = CLIENTES_SEED.map((c, i) => ({ c, vence: venceInspektor(c, i) })).sort((a, b) => a.vence.localeCompare(b.vence));
  return (
    <div className="min-h-screen bg-ink text-foreground">
      <div className="mx-auto max-w-[1100px] px-6 py-7 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
            Offer<span className="text-brand">Pulse</span> · Inspektor
          </h1>
          <Link to="/" className="rounded-md border border-line bg-panel px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-accent hover:border-brand">← Pipeline</Link>
        </header>
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr><th className={th}>Cliente</th><th className={th}>Estado</th><th className={th}>Vigente hasta</th><th className={th}>Días restantes</th></tr>
            </thead>
            <tbody>
              {filas.map(({ c, vence }) => {
                const d = diasRestantes(vence);
                return (
                  <tr key={c.nombre} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-semibold">{c.nombre}</td>
                    <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${COLOR_INSPEKTOR[c.inspektor]}`}>{c.inspektor}</span></td>
                    <td className="px-4 py-3">{formatoFecha(vence)} {vence.slice(0, 4)}</td>
                    <td className={`px-4 py-3 ${d < 0 ? "text-stop" : d <= 30 ? "text-warn" : "text-muted-foreground"}`}>
                      {d < 0 ? `Venció hace ${-d} días` : `${d} días`}
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
