import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { NuevaOportunidad } from "@/components/NuevaOportunidad";
import { useOfertas } from "@/lib/useOfertas";
import { predecirCierre } from "@/lib/ia";
import { exportarCSV, exportarPDF } from "@/lib/exportar";
import {
  COLOR_INSPEKTOR,
  ESTADOS,
  ESTADOS_INSPEKTOR,
  SEGMENTOS,
  SEGMENTO_LABEL,
  SEMAFORO_LABEL,
  diasRestantes,
  formatoFecha,
  formatoMoneda,
  semaforo,
  DIAS_VALIDEZ_DEFAULT,
  fechaFinValidez,
  type Estado,
  type EstadoInspektor,
  type Oportunidad,
  type Segmento,
  type Semaforo,
} from "@/lib/opportunities";
import { AmpliarDeadline } from "@/components/AmpliarDeadline";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OfferPulse — Seguimiento de ofertas comerciales" },
      {
        name: "description",
        content:
          "Panel de seguimiento de ofertas comerciales: indicadores, alertas de vencimiento, filtros, actividades pendientes y semáforo de riesgo.",
      },
      { property: "og:title", content: "OfferPulse — Seguimiento de ofertas comerciales" },
      {
        property: "og:description",
        content:
          "Dashboard de pipeline comercial con KPIs, alertas de vencimiento y semáforo de seguimiento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const COLOR_SEMAFORO: Record<Semaforo, string> = {
  verde: "bg-go",
  ambar: "bg-warn",
  rojo: "bg-stop",
};

const COLOR_ESTADO: Record<Estado, string> = {
  Calificación: "bg-panel2 text-muted-foreground",
  Propuesta: "bg-warn/15 text-warn",
  Negociación: "bg-accent/15 text-accent",
  Ganada: "bg-go/15 text-go",
  Perdida: "bg-stop/15 text-stop",
};

function Index() {
  const {
    oportunidades,
    actividades,
    listo,
    agregarOportunidad,
    eliminarOportunidad,
    alternarActividad,
    ampliarDeadline,
  } = useOfertas();

  const [abrirForm, setAbrirForm] = useState(false);
  const [ampliar, setAmpliar] = useState<Oportunidad | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [fEstado, setFEstado] = useState<Estado | "Todos">("Todos");
  const [fComercial, setFComercial] = useState("Todos");
  const [fTecnico, setFTecnico] = useState("Todos");
  const [fPersona, setFPersona] = useState("Todos");
  const personas = useMemo(
    () => [...new Set(oportunidades.flatMap((o) => [o.comercial, o.tecnico]))].sort(),
    [oportunidades],
  );
  const [fSegmento, setFSegmento] = useState<Segmento | "Todos">("Todos");
  const [fInspektor, setFInspektor] = useState<EstadoInspektor | "Todos">("Todos");
  const [soloSemana, setSoloSemana] = useState(false);
  const [soloGrandes, setSoloGrandes] = useState(false);

  const comerciales = useMemo(
    () => ["Todos", ...Array.from(new Set(oportunidades.map((o) => o.comercial)))],
    [oportunidades],
  );
  const tecnicos = useMemo(
    () => ["Todos", ...Array.from(new Set(oportunidades.map((o) => o.tecnico)))],
    [oportunidades],
  );

  const filtradas = useMemo(
    () =>
      oportunidades
        .filter((o) => {
          const q = busqueda.trim().toLowerCase();
          if (
            q &&
            ![o.id, o.nombre, o.cliente, o.comercial, o.tecnico, o.vendedor].some((v) =>
              v.toLowerCase().includes(q),
            )
          )
            return false;
          if (fEstado !== "Todos" && o.estado !== fEstado) return false;
          if (fComercial !== "Todos" && o.comercial !== fComercial) return false;
          if (fPersona !== "Todos" && o.comercial !== fPersona && o.tecnico !== fPersona) return false;
          if (fTecnico !== "Todos" && o.tecnico !== fTecnico) return false;
          if (fSegmento !== "Todos" && o.segmento !== fSegmento) return false;
          if (fInspektor !== "Todos" && o.inspektor !== fInspektor) return false;
          const d = diasRestantes(o.fechaCierre);
          if (soloSemana && (d < 0 || d > 7)) return false;
          if (soloGrandes && o.valor <= 500_000) return false;
          return true;
        })
        .sort((a, b) => a.fechaCierre.localeCompare(b.fechaCierre)),
    [
      oportunidades,
      busqueda,
      fEstado,
      fComercial,
      fPersona,
      fTecnico,
      fSegmento,
      fInspektor,
      soloSemana,
      soloGrandes,
    ],
  );


  const activas = oportunidades.filter(
    (o) => o.estado !== "Ganada" && o.estado !== "Perdida",
  );
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth();
  const pipelineAnio = activas
    .filter((o) => new Date(o.fechaCierre + "T00:00:00").getFullYear() === anioActual)
    .reduce((s, o) => s + o.valor, 0);
  const enNegociacion = activas.filter((o) => o.estado === "Negociación").length;
  const alertas = activas
    .filter((o) => diasRestantes(o.fechaCierre) <= 7)
    .sort((a, b) => diasRestantes(a.fechaCierre) - diasRestantes(b.fechaCierre));
  const criticas = alertas.filter((o) => diasRestantes(o.fechaCierre) < 0).length;
  const cierreMes = activas
    .filter((o) => {
      const f = new Date(o.fechaCierre + "T00:00:00");
      return f.getFullYear() === anioActual && f.getMonth() === mesActual;
    })
    .reduce((s, o) => s + o.valor, 0);
  const ofertasMes = activas.filter((o) => {
    const f = new Date(o.fechaCierre + "T00:00:00");
    return f.getFullYear() === anioActual && f.getMonth() === mesActual;
  }).length;

  // Ganadas vs pipeline estimado, últimos 6 meses
  const meses = Array.from({ length: 6 }, (_, k) => {
    const base = new Date(anioActual, mesActual - (5 - k), 1);
    const ganadas = oportunidades
      .filter((o) => {
        const f = new Date(o.fechaCierre + "T00:00:00");
        return (
          o.estado === "Ganada" &&
          f.getFullYear() === base.getFullYear() &&
          f.getMonth() === base.getMonth()
        );
      })
      .reduce((s, o) => s + o.valor, 0);
    const estimado = oportunidades
      .filter((o) => {
        const f = new Date(o.fechaCierre + "T00:00:00");
        return (
          o.estado !== "Ganada" &&
          o.estado !== "Perdida" &&
          f.getFullYear() === base.getFullYear() &&
          f.getMonth() === base.getMonth()
        );
      })
      .reduce((s, o) => s + o.valor, 0);
    return {
      etiqueta: base.toLocaleDateString("es-ES", { month: "short" }),
      ganadas,
      estimado,
    };
  });
  const maxMes = Math.max(1, ...meses.map((m) => Math.max(m.ganadas, m.estimado)));
  const totalGanadas = meses.reduce((s, m) => s + m.ganadas, 0);
  const totalEstimado = meses.reduce((s, m) => s + m.estimado, 0);
  const tasaConversion = Math.round(
    (totalGanadas / Math.max(1, totalGanadas + totalEstimado)) * 100,
  );

  const conteoSemaforo = (s: Semaforo) =>
    oportunidades.filter((o) => semaforo(o) === s).length;
  const totalSem = Math.max(1, oportunidades.length);

  const porEtapa = ESTADOS.map((e) => ({
    etapa: e,
    total: oportunidades.filter((o) => o.estado === e).reduce((s, o) => s + o.valor, 0),
  }));
  const maxEtapa = Math.max(1, ...porEtapa.map((p) => p.total));

  const pendientes = actividades.filter((a) => !a.hecha);

  // Panel por vendedor: vigentes / por vencer / vencidas + pipeline personal
  const panelVendedores = useMemo(() => {
    const nombres = Array.from(new Set(oportunidades.map((o) => o.vendedor)));
    return nombres.map((v) => {
      const mias = oportunidades.filter((o) => o.vendedor === v);
      const abiertas = mias.filter((o) => o.estado !== "Ganada" && o.estado !== "Perdida");
      const vigentes = abiertas.filter((o) => diasRestantes(o.fechaCierre) > 7);
      const porVencer = abiertas.filter((o) => {
        const d = diasRestantes(o.fechaCierre);
        return d >= 0 && d <= 7;
      });
      const vencidas = abiertas.filter((o) => diasRestantes(o.fechaCierre) < 0);
      const ganado = mias
        .filter((o) => o.estado === "Ganada")
        .reduce((s, o) => s + o.valor, 0);
      const estimado = abiertas.reduce((s, o) => s + o.valor, 0);
      return { nombre: v, vigentes, porVencer, vencidas, ganado, estimado };
    });
  }, [oportunidades]);

  // Ofertas no adjudicadas cuya validez vence en 15 días o menos (o ya venció)
  const alertasValidez = activas
    .map((o) => ({ o, d: diasRestantes(fechaFinValidez(o)) }))
    .filter(({ d }) => d <= 15)
    .sort((a, b) => a.d - b.d);

  // Notificaciones automáticas al responsable por ofertas que vencen en <7 días
  const notificadas = useRef(false);
  useEffect(() => {
    if (!listo || notificadas.current) return;
    notificadas.current = true;
    alertas.forEach((o, i) => {
      const d = diasRestantes(o.fechaCierre);
      const detalle =
        d < 0
          ? `Vencida hace ${Math.abs(d)} días · Responsable: ${o.comercial}`
          : `Vence en ${d} días · Responsable: ${o.comercial}`;
      setTimeout(() => {
        if (d < 0) toast.error(`${o.id} · ${o.nombre}`, { description: detalle });
        else toast.warning(`${o.id} · ${o.nombre}`, { description: detalle });
      }, 400 + i * 600);
    });
    alertasValidez.forEach(({ o, d }, i) => {
      const detalle =
        d < 0
          ? `Validez de la oferta vencida hace ${Math.abs(d)} días · Responsable: ${o.comercial}`
          : `La validez de la oferta vence en ${d} días (${formatoFecha(fechaFinValidez(o))}) · Responsable: ${o.comercial}`;
      setTimeout(() => {
        if (d < 0) toast.error(`Validez · ${o.id} · ${o.nombre}`, { description: detalle });
        else toast.warning(`Validez · ${o.id} · ${o.nombre}`, { description: detalle });
      }, 400 + (alertas.length + i) * 600);
    });
  }, [listo, alertas, alertasValidez]);

  if (!listo) return <div className="min-h-screen bg-ink"></div>;

  return (
    <div className="min-h-screen bg-ink text-foreground selection:bg-brand selection:text-accent">
      <div className="mx-auto max-w-[1440px] px-6 py-7 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-line pb-6">
          <div className="flex items-center gap-4">
            <div className="grid size-11 rotate-[-6deg] place-items-center bg-accent font-display text-2xl font-bold text-panel">
              O
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold uppercase leading-none tracking-wide">
                Offer<span className="text-brand">Pulse</span>
              </h1>
              <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Pipeline Command Deck
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/clientes" className="rounded-md border border-line bg-panel px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-accent hover:border-brand">
              Clientes
            </Link>
            <Link to="/prerequisito" className="rounded-md border border-line bg-panel px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-accent hover:border-brand">
              Pre-requisito aprobación
            </Link>
            <Link to="/inspektor" className="rounded-md border border-line bg-panel px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-accent hover:border-brand">
              Inspektor
            </Link>
            <Link to="/checklist" search={{ id: undefined }} className="rounded-md border border-line bg-panel px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-accent hover:border-brand">
              Checklist
            </Link>
            <div className="hidden items-center gap-2 rounded-full border border-line bg-panel px-4 py-2 md:flex">
              <span className="size-2 rounded-full bg-brand"></span>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar oportunidad, cliente, ID..."
                className="w-56 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={() => exportarCSV(filtradas, panelVendedores)}
              className="rounded-md border border-line bg-panel px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:border-accent/40 hover:text-accent"
            >
              CSV
            </button>
            <button
              onClick={() =>
                exportarPDF(filtradas, panelVendedores, fPersona !== "Todos" ? `Responsable: ${fPersona}` : undefined)
              }
              className="rounded-md border border-line bg-panel px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:border-accent/40 hover:text-accent"
            >
              PDF
            </button>
            <button
              onClick={() => setAbrirForm(true)}
              className="rounded-md bg-accent px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-panel hover:bg-accent/90"
            >
              + Nueva oportunidad
            </button>
          </div>
        </header>

        <section className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi
            barra="bg-brand"
            titulo={`Pipeline total ${anioActual}`}
            valor={formatoMoneda(pipelineAnio)}
            pie={`${activas.length} ofertas abiertas`}
            pieClase="text-go"
          />
          <Kpi
            barra="bg-accent"
            titulo="Oportunidades activas"
            valor={String(activas.length)}
            pie={`${enNegociacion} en negociación`}
          />
          <Kpi
            barra="bg-warn"
            titulo="Alertas de vencimiento"
            valor={String(alertas.length)}
            valorClase="text-warn"
            pie={`${criticas} vencidas`}
          />
          <Kpi
            barra="bg-go"
            titulo="Cierre estimado del mes"
            valor={formatoMoneda(cierreMes)}
            pie={`${ofertasMes} ofertas este mes`}
          />
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Filtros
          </span>
          <select
            value={fEstado}
            onChange={(e) => setFEstado(e.target.value as Estado | "Todos")}
            className="rounded-full border border-line bg-panel px-4 py-1.5 text-sm text-muted-foreground outline-none hover:border-accent/40"
          >
            <option value="Todos">Estado: Todos</option>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSoloSemana((v) => !v)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              soloSemana
                ? "border-brand/40 bg-brand/10 font-medium text-brand"
                : "border-line bg-panel text-muted-foreground hover:border-accent/40"
            }`}
          >
            Esta semana
          </button>
          <select
            value={fPersona}
            onChange={(e) => setFPersona(e.target.value)}
            className={`rounded-full border px-4 py-1.5 text-sm outline-none ${
              fPersona !== "Todos"
                ? "border-brand/40 bg-brand/10 font-medium text-brand"
                : "border-line bg-panel text-muted-foreground hover:border-accent/40"
            }`}
          >
            <option value="Todos">Nombre (comercial o técnico): Todos</option>
            {personas.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={fComercial}
            onChange={(e) => setFComercial(e.target.value)}
            className="rounded-full border border-line bg-panel px-4 py-1.5 text-sm text-muted-foreground outline-none hover:border-accent/40"
          >
            {comerciales.map((r) => (
              <option key={r} value={r}>
                {r === "Todos" ? "Comercial: Todos" : r}
              </option>
            ))}
          </select>
          <select
            value={fTecnico}
            onChange={(e) => setFTecnico(e.target.value)}
            className="rounded-full border border-line bg-panel px-4 py-1.5 text-sm text-muted-foreground outline-none hover:border-accent/40"
          >
            {tecnicos.map((r) => (
              <option key={r} value={r}>
                {r === "Todos" ? "Técnico: Todos" : r}
              </option>
            ))}
          </select>
          <select
            value={fSegmento}
            onChange={(e) => setFSegmento(e.target.value as Segmento | "Todos")}
            className="rounded-full border border-line bg-panel px-4 py-1.5 text-sm text-muted-foreground outline-none hover:border-accent/40"
          >
            <option value="Todos">Segmento: Todos</option>
            {SEGMENTOS.map((s) => (
              <option key={s} value={s}>
                {SEGMENTO_LABEL[s]}
              </option>
            ))}
          </select>
          <select
            value={fInspektor}
            onChange={(e) => setFInspektor(e.target.value as EstadoInspektor | "Todos")}
            className="rounded-full border border-line bg-panel px-4 py-1.5 text-sm text-muted-foreground outline-none hover:border-accent/40"
          >
            <option value="Todos">Inspektor: Todos</option>
            {ESTADOS_INSPEKTOR.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={() => setSoloGrandes((v) => !v)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              soloGrandes
                ? "border-brand/40 bg-brand/10 font-medium text-brand"
                : "border-line bg-panel text-muted-foreground hover:border-accent/40"
            }`}
          >
            Valor &gt; $500K
          </button>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-12">
          <div className="overflow-hidden rounded-xl border border-line bg-panel lg:col-span-8">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                Oportunidades en seguimiento
              </h2>
              <span className="text-xs text-muted-foreground">
                {filtradas.length} de {oportunidades.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel2/50 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                    <th className="px-5 py-3 text-left font-medium">ID</th>
                    <th className="px-3 py-3 text-left font-medium">Oportunidad</th>
                    <th className="px-3 py-3 text-left font-medium">Cliente</th>
                    <th className="px-3 py-3 text-left font-medium">Comercial</th>
                    <th className="px-3 py-3 text-left font-medium">Técnico</th>
                    <th className="px-3 py-3 text-left font-medium">Vendedor</th>
                    <th className="px-3 py-3 text-left font-medium">Segmento</th>
                    <th className="px-3 py-3 text-left font-medium">Inspektor</th>

                    <th className="px-3 py-3 text-left font-medium">Estado</th>
                    <th className="px-3 py-3 text-left font-medium">Cierre</th>
                    <th className="px-3 py-3 text-left font-medium">Validez</th>
                    <th className="px-5 py-3 text-right font-medium">Válida hasta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filtradas.map((o) => {
                    const s = semaforo(o);
                    const d = diasRestantes(o.fechaCierre);
                    const pred = predecirCierre(o);
                    const critica =
                      o.estado !== "Ganada" && o.estado !== "Perdida" && d < 7;
                    return (
                      <tr
                        key={o.id}
                        className={`group ${
                          critica
                            ? "bg-stop/10 hover:bg-stop/15"
                            : "hover:bg-panel2/60"
                        }`}
                      >
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <span
                              className={`size-2 rounded-full ${COLOR_SEMAFORO[s]}`}
                              title={`${SEMAFORO_LABEL[s]} · prob. cierre ${pred.probabilidad}%`}
                            ></span>
                            <Link to="/checklist" search={{ id: o.id }} className="underline decoration-dotted hover:text-accent" title="Abrir checklist de verificación">{o.id}</Link>
                          </span>
                        </td>
                        <td className="px-3 py-4 font-medium">{o.nombre}</td>
                        <td className="px-3 py-4 text-muted-foreground">{o.cliente}</td>
                        <td className="px-3 py-4 text-muted-foreground">{o.comercial}</td>
                        <td className="px-3 py-4 text-muted-foreground">{o.tecnico}</td>
                        <td className="px-3 py-4 text-muted-foreground">{o.vendedor}</td>
                        <td className="px-3 py-4">
                          <span
                            className="inline-flex rounded-md bg-brand/15 px-2 py-1 font-display text-xs font-semibold tracking-wide text-brand"
                            title={SEGMENTO_LABEL[o.segmento]}
                          >
                            {o.segmento}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${COLOR_INSPEKTOR[o.inspektor]}`}
                          >
                            <span className="size-1.5 rounded-full bg-current"></span>
                            {o.inspektor}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${COLOR_ESTADO[o.estado]}`}
                          >
                            <span className="size-1.5 rounded-full bg-current"></span>
                            {o.estado}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-muted-foreground">
                          {formatoFecha(o.fechaCierre)}
                          <span
                            className={`ml-2 text-xs ${d < 0 ? "text-stop" : d <= 7 ? "text-warn" : "text-muted-foreground"}`}
                          >
                            {d < 0 ? `${Math.abs(d)}d vencida` : `${d}d`}
                          </span>
                          {o.ampliaciones?.length ? (
                            <span
                              title={o.ampliaciones.map((a) => `${a.anterior} → ${a.nueva}: ${a.motivo}`).join("\n")}
                              className="ml-2 rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent"
                            >
                              Ampliado ×{o.ampliaciones.length}
                            </span>
                          ) : null}
                          {o.estado !== "Ganada" && o.estado !== "Perdida" && (
                            <button
                              onClick={() => setAmpliar(o)}
                              className="ml-2 text-xs font-semibold text-brand underline-offset-2 hover:underline"
                            >
                              Ampliar
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-4 text-muted-foreground">
                          {o.diasValidez ?? DIAS_VALIDEZ_DEFAULT} días
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center gap-3">
                            <span className={diasRestantes(fechaFinValidez(o)) < 0 ? "text-stop" : "text-muted-foreground"}>
                              {formatoFecha(fechaFinValidez(o))}
                            </span>
                            <button
                              onClick={() => eliminarOportunidad(o.id)}
                              aria-label={`Eliminar ${o.id}`}
                              className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-stop"
                            >
                              ×
                            </button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filtradas.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-5 py-10 text-center text-muted-foreground">
                        No hay oportunidades con estos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-4">
            <div className="rounded-xl border border-line bg-panel p-5">
              <h2 className="mb-4 font-display text-lg font-semibold uppercase tracking-wide">
                Semáforo de seguimiento
              </h2>
              <div className="space-y-3">
                {(["verde", "ambar", "rojo"] as Semaforo[]).map((s) => {
                  const n = conteoSemaforo(s);
                  return (
                    <div key={s} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`size-2.5 rounded-full ${COLOR_SEMAFORO[s]}`}></span>
                        <span className="text-sm text-muted-foreground">{SEMAFORO_LABEL[s]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                          <span
                            className={`block h-full ${COLOR_SEMAFORO[s]}`}
                            style={{ width: `${(n / totalSem) * 100}%` }}
                          ></span>
                        </span>
                        <span className="font-display text-sm font-semibold">{n}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 rounded-xl border border-line bg-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                  Alertas de vencimiento
                </h2>
                <span className="grid size-5 place-items-center rounded-full bg-stop/20 text-xs font-bold text-stop">
                  {alertas.length}
                </span>
              </div>
              <div className="space-y-3">
                {alertas.slice(0, 5).map((o) => {
                  const d = diasRestantes(o.fechaCierre);
                  return (
                    <div
                      key={o.id}
                      className={`rounded-lg border-l-2 bg-panel2/60 px-3.5 py-3 ${d < 0 ? "border-stop" : "border-warn"}`}
                    >
                      <p className="text-sm font-medium">
                        {o.id} · {o.nombre}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d < 0 ? `Vencida hace ${Math.abs(d)} días` : `Cierre en ${d} días`} ·{" "}
                        {o.cliente}
                      </p>
                    </div>
                  );
                })}
                {alertas.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin vencimientos próximos.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-12">
          <div className="rounded-xl border border-line bg-panel p-5 lg:col-span-7">
            <h2 className="mb-5 font-display text-lg font-semibold uppercase tracking-wide">
              Actividades pendientes
            </h2>
            <div className="space-y-2.5">
              {pendientes.map((a) => {
                const d = diasRestantes(a.fecha);
                return (
                  <button
                    key={a.id}
                    onClick={() => alternarActividad(a.id)}
                    className="flex w-full items-center gap-3 rounded-lg bg-panel2 px-4 py-3 text-left hover:bg-brand/15"
                  >
                    <span className="size-4 shrink-0 rounded-full border-2 border-accent/30"></span>
                    <span className="flex-1 text-sm">{a.titulo}</span>
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wide ${d <= 0 ? "text-accent" : "text-muted-foreground"}`}
                    >
                      {d < 0 ? "Atrasada" : d === 0 ? "Hoy" : formatoFecha(a.fecha)}
                    </span>
                  </button>
                );
              })}
              {pendientes.length === 0 && (
                <p className="text-sm text-muted-foreground">Todo al día.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col rounded-xl border border-line bg-panel p-5 lg:col-span-5">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                Pipeline por etapa
              </h2>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                valor estimado
              </span>
            </div>
            <div className="flex h-40 items-end justify-between gap-3">
              {porEtapa.map((p, i) => (
                <div key={p.etapa} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={`bar-anim w-full ${
                      i === 4 ? "bg-stop/60" : i === 3 ? "bg-go" : i === 2 ? "bg-brand" : "bg-accent"
                    }`}
                    style={{ height: `${Math.max(4, (p.total / maxEtapa) * 100)}%` }}
                    title={formatoMoneda(p.total)}
                  ></div>
                  <span className="text-[10px] text-muted-foreground">{p.etapa}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-line bg-panel p-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
              Ofertas ganadas vs pipeline estimado
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-go"></span> Ganadas{" "}
                <b className="text-foreground">{formatoMoneda(totalGanadas)}</b>
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-brand"></span> Estimado{" "}
                <b className="text-foreground">{formatoMoneda(totalEstimado)}</b>
              </span>
              <span className="rounded-full bg-panel2 px-3 py-1">
                Conversión {tasaConversion}%
              </span>
            </div>
          </div>
          <div className="flex h-52 items-end justify-between gap-4">
            {meses.map((m) => (
              <div key={m.etiqueta} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full items-end justify-center gap-1.5">
                  <div
                    className="bar-anim w-1/3 rounded-t-sm bg-go"
                    style={{ height: `${Math.max(2, (m.ganadas / maxMes) * 100)}%` }}
                    title={`Ganadas ${formatoMoneda(m.ganadas)}`}
                  ></div>
                  <div
                    className="bar-anim w-1/3 rounded-t-sm bg-brand"
                    style={{ height: `${Math.max(2, (m.estimado / maxMes) * 100)}%` }}
                    title={`Estimado ${formatoMoneda(m.estimado)}`}
                  ></div>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {m.etiqueta}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
              Panel por vendedor
            </h2>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              vigentes · por vencer · vencidas
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {panelVendedores.map((v) => {
              const maxBarra = Math.max(1, v.ganado, v.estimado);
              return (
                <div
                  key={v.nombre}
                  className="rounded-xl border border-line bg-panel p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base font-semibold uppercase tracking-wide">
                      {v.nombre}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {v.vigentes.length + v.porVencer.length + v.vencidas.length} abiertas
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-go/10 py-2">
                      <p className="font-display text-xl font-bold text-go">
                        {v.vigentes.length}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Vigentes
                      </p>
                    </div>
                    <div className="rounded-lg bg-warn/10 py-2">
                      <p className="font-display text-xl font-bold text-warn">
                        {v.porVencer.length}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Por vencer
                      </p>
                    </div>
                    <div className="rounded-lg bg-stop/10 py-2">
                      <p className="font-display text-xl font-bold text-stop">
                        {v.vencidas.length}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Vencidas
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Ganado</span>
                        <span className="font-semibold text-go">
                          {formatoMoneda(v.ganado)}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
                        <div
                          className="bar-anim h-full bg-go"
                          style={{ width: `${(v.ganado / maxBarra) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Pipeline estimado</span>
                        <span className="font-semibold text-brand">
                          {formatoMoneda(v.estimado)}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
                        <div
                          className="bar-anim h-full bg-brand"
                          style={{ width: `${(v.estimado / maxBarra) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="relative mt-5 overflow-hidden rounded-xl border border-line bg-panel2">
          <div className="tick absolute inset-y-0 right-0 w-24 opacity-30"></div>
          <div className="relative flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide">
                Motor de IA · pronto
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Estructura de datos lista para scoring predictivo de cierre y asistente de
                negociación.
              </p>
            </div>
            <button className="rounded-md border border-accent/40 bg-accent/10 px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-accent hover:bg-accent/20">
              Conectar IA
            </button>
          </div>
        </div>
      </div>

      {abrirForm && (
        <NuevaOportunidad
          onGuardar={agregarOportunidad}
          onCerrar={() => setAbrirForm(false)}
        />
      )}
      {ampliar && (
        <AmpliarDeadline
          o={ampliar}
          onGuardar={(f, m) => {
            ampliarDeadline(ampliar.id, f, m);
            toast.success(`Deadline de ${ampliar.id} ampliado a ${formatoFecha(f)}`);
            setAmpliar(null);
          }}
          onCerrar={() => setAmpliar(null)}
        />
      )}
    </div>
  );
}

function Kpi({
  barra,
  titulo,
  valor,
  valorClase = "",
  pie,
  pieClase = "text-muted-foreground",
}: {
  barra: string;
  titulo: string;
  valor: string;
  valorClase?: string;
  pie: string;
  pieClase?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-panel p-5">
      <div className={`absolute inset-y-0 right-0 w-1.5 ${barra}`}></div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{titulo}</p>
      <p className={`mt-3 font-display text-4xl font-bold tracking-wide ${valorClase}`}>
        {valor}
      </p>
      <p className={`mt-2 text-xs font-medium ${pieClase}`}>{pie}</p>
    </div>
  );
}
