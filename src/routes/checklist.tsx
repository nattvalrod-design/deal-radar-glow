import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOfertas } from "@/lib/useOfertas";
import { formatoFecha } from "@/lib/opportunities";

const TAREAS = [
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
type Estado = Record<string, Record<string, boolean>>;

export const Route = createFileRoute("/checklist")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s["id"] === "string" ? s["id"] : undefined }),
  head: () => ({
    meta: [
      { title: "Checklist de verificación — OfferPulse" },
      { name: "description", content: "Checklist de tareas de verificación por oferta conectado al pipeline." },
      { property: "og:title", content: "Checklist de verificación — OfferPulse" },
      { property: "og:description", content: "Verifica pliegos, pólizas, cartera y más por cada oferta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checklist,
});

function Checklist() {
  const { id } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { oportunidades, listo } = useOfertas();
  const [estado, setEstado] = useState<Estado>({});
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    try { setEstado(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* */ }
    setCargado(true);
  }, []);
  useEffect(() => { if (cargado) localStorage.setItem(KEY, JSON.stringify(estado)); }, [estado, cargado]);

  const seleccion = id ?? oportunidades[0]?.id;
  const o = oportunidades.find((x) => x.id === seleccion);
  const marcas = (seleccion && estado[seleccion]) || {};
  const hechas = TAREAS.filter((t) => marcas[t]).length;
  const pct = Math.round((hechas / TAREAS.length) * 100);

  const alternar = (t: string) => {
    if (!seleccion) return;
    setEstado((p) => ({ ...p, [seleccion]: { ...(p[seleccion] ?? {}), [t]: !p[seleccion]?.[t] } }));
  };

  const progreso = (oid: string) => TAREAS.filter((t) => estado[oid]?.[t]).length;

  return (
    <div className="min-h-screen bg-ink text-foreground">
      <div className="mx-auto max-w-[1100px] px-6 py-7 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
            Offer<span className="text-brand">Pulse</span> · Checklist
          </h1>
          <Link to="/" className="rounded-md border border-line bg-panel px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-accent hover:border-brand">← Pipeline</Link>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-xl border border-line bg-panel p-3">
            <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Ofertas del pipeline</p>
            <ul className="space-y-1">
              {listo && oportunidades.map((x) => {
                const n = cargado ? progreso(x.id) : 0;
                const activo = x.id === seleccion;
                return (
                  <li key={x.id}>
                    <button
                      onClick={() => navigate({ search: { id: x.id } })}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm ${activo ? "bg-brand/15 text-accent" : "hover:bg-panel2"}`}
                    >
                      <span className="flex justify-between gap-2">
                        <span className="font-mono text-xs">{x.id}</span>
                        <span className={`text-xs font-semibold ${n === TAREAS.length ? "text-go" : "text-muted-foreground"}`}>{n}/{TAREAS.length}</span>
                      </span>
                      <span className="block truncate">{x.nombre}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="rounded-xl border border-line bg-panel p-6">
            {!o ? (
              <p className="text-muted-foreground">Selecciona una oferta.</p>
            ) : (
              <>
                <p className="font-mono text-xs text-muted-foreground">{o.id}</p>
                <h2 className="font-display text-xl font-bold">{o.nombre}</h2>
                <p className="text-sm text-muted-foreground">
                  {o.cliente} · {o.segmento} · Comercial {o.comercial} · Técnico {o.tecnico} · Entrega {formatoFecha(o.fechaCierre)}
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm"><span>Verificación</span><span className="font-semibold">{hechas}/{TAREAS.length} · {pct}%</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel2">
                    <div className={`h-full ${pct === 100 ? "bg-go" : "bg-brand"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <ul className="mt-5 divide-y divide-line">
                  {TAREAS.map((t) => (
                    <li key={t}>
                      <label className="flex cursor-pointer items-center gap-3 py-3">
                        <input type="checkbox" checked={!!marcas[t]} onChange={() => alternar(t)} className="size-4 accent-[var(--brand)]" />
                        <span className={marcas[t] ? "text-muted-foreground line-through" : ""}>{t}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
