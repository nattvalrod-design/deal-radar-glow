import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TAREAS, useChecklist } from "@/lib/checklist";
import { useOfertas } from "@/lib/useOfertas";
import { formatoFecha } from "@/lib/opportunities";

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
  const { estado, cargado, alternar: alt, na, comentarios, alternarNA, comentar, aplicanDe, pendientesDe } = useChecklist();
  const [abierta, setAbierta] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [rol, setRol] = useState<"vendedor" | "comercial" | "tecnico">("comercial");
  const [persona, setPersona] = useState("");
  const nombres = Array.from(new Set(oportunidades.map((x) => x[rol]))).sort();
  const lista = oportunidades.filter((x) => !persona || x[rol] === persona);

  const seleccion = id ?? lista[0]?.id;
  const o = oportunidades.find((x) => x.id === seleccion);
  const marcas = (seleccion && estado[seleccion]) || {};
  const nas = (seleccion && na[seleccion]) || {};
  const coms = (seleccion && comentarios[seleccion]) || {};
  const total = seleccion ? aplicanDe(seleccion).length : TAREAS.length;
  const hechas = seleccion ? total - pendientesDe(seleccion).length : 0;
  const pct = total ? Math.round((hechas / total) * 100) : 100;

  const alternar = (t: string) => {
    if (!seleccion) return;
    alt(seleccion, t);
  };

  const progreso = (oid: string) => aplicanDe(oid).length - pendientesDe(oid).length;

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
            <div className="mb-3 grid grid-cols-2 gap-2 px-2">
              <select aria-label="Rol" value={rol} onChange={(e) => { setRol(e.target.value as typeof rol); setPersona(""); }} className="rounded-md border border-line bg-panel2 px-2 py-1.5 text-sm">
                <option value="vendedor">Vendedor</option>
                <option value="comercial">Comercial</option>
                <option value="tecnico">Técnico</option>
              </select>
              <select aria-label="Persona" value={persona} onChange={(e) => setPersona(e.target.value)} className="rounded-md border border-line bg-panel2 px-2 py-1.5 text-sm">
                <option value="">Todos</option>
                {nombres.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <ul className="space-y-1">
              {listo && lista.map((x) => {
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
                        <span className={`text-xs font-semibold ${n === aplicanDe(x.id).length ? "text-go" : "text-muted-foreground"}`}>{n}/{cargado ? aplicanDe(x.id).length : TAREAS.length}</span>
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
                  {o.cliente} · {o.segmento} · Comercial {o.comercial} · Técnico {o.tecnico} · Vendedor {o.vendedor} · Entrega {formatoFecha(o.fechaCierre)}
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm"><span>Verificación</span><span className="font-semibold">{hechas}/{total} · {pct}%{TAREAS.length - total > 0 ? ` · ${TAREAS.length - total} no aplica` : ""}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel2">
                    <div className={`h-full ${pct === 100 ? "bg-go" : "bg-brand"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <ul className="mt-5 divide-y divide-line">
                  {TAREAS.map((t) => {
                    const esNA = !!nas[t];
                    const lista = coms[t] ?? [];
                    return (
                      <li key={t} className="py-2">
                        <div className="flex items-center gap-3">
                          <label className="flex flex-1 cursor-pointer items-center gap-3 py-1">
                            <input type="checkbox" disabled={esNA} checked={!!marcas[t] && !esNA} onChange={() => alternar(t)} className="size-4 accent-[var(--brand)]" />
                            <span className={esNA ? "text-muted-foreground italic" : marcas[t] ? "text-muted-foreground line-through" : ""}>{t}</span>
                            {esNA && <span className="rounded bg-panel2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">No aplica</span>}
                          </label>
                          <button onClick={() => alternarNA(o.id, t)} className={`rounded-md border px-2 py-1 text-xs ${esNA ? "border-brand text-accent" : "border-line text-muted-foreground hover:border-brand"}`}>
                            {esNA ? "Sí aplica" : "No aplica"}
                          </button>
                          <button onClick={() => { setAbierta(abierta === t ? null : t); setTexto(""); }} className="rounded-md border border-line px-2 py-1 text-xs text-muted-foreground hover:border-brand">
                            Comentarios{lista.length ? ` (${lista.length})` : ""}
                          </button>
                        </div>
                        {abierta === t && (
                          <div className="ml-7 mt-2 space-y-2">
                            {lista.map((c, i) => (
                              <div key={i} className="rounded-md bg-panel2 px-3 py-2 text-sm">
                                <span className="block text-[11px] text-muted-foreground">{new Date(c.fecha).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                {c.texto}
                              </div>
                            ))}
                            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!texto.trim()) return; comentar(o.id, t, texto.trim()); setTexto(""); }}>
                              <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Comentario de seguimiento…" className="flex-1 rounded-md border border-line bg-panel2 px-3 py-1.5 text-sm" />
                              <button type="submit" className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-primary-foreground">Agregar</button>
                            </form>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
