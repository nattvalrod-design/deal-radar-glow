import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { NuevaOportunidad } from "@/components/NuevaOportunidad";
import { useOfertas } from "@/lib/useOfertas";
import { predecirCierre } from "@/lib/ia";
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
  type Estado,
  type EstadoInspektor,
  type Segmento,
  type Semaforo,
} from "@/lib/opportunities";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vanta Pulse — Seguimiento de ofertas comerciales" },
      {
        name: "description",
        content:
          "Panel de seguimiento de ofertas comerciales: indicadores, alertas de vencimiento, filtros, actividades pendientes y semáforo de riesgo.",
      },
      { property: "og:title", content: "Vanta Pulse — Seguimiento de ofertas comerciales" },
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
    agregarOportunidad,
    eliminarOportunidad,
    alternarActividad,
  } = useOfertas();

  const [abrirForm, setAbrirForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [fEstado, setFEstado] = useState<Estado | "Todos">("Todos");
  const [fComercial, setFComercial] = useState("Todos");
  const [fTecnico, setFTecnico] = useState("Todos");
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
            ![o.id, o.nombre, o.cliente, o.comercial, o.tecnico].some((v) =>
              v.toLowerCase().includes(q),
            )
          )
            return false;
          if (fEstado !== "Todos" && o.estado !== fEstado) return false;
          if (fComercial !== "Todos" && o.comercial !== fComercial) return false;
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
  const pipelineTotal = activas.reduce((s, o) => s + o.valor, 0);
  const enNegociacion = activas.filter((o) => o.estado === "Negociación").length;
  const alertas = activas
    .filter((o) => diasRestantes(o.fechaCierre) <= 7)
    .sort((a, b) => diasRestantes(a.fechaCierre) - diasRestantes(b.fechaCierre));
  const criticas = alertas.filter((o) => diasRestantes(o.fechaCierre) < 0).length;
  const cierre30 = activas
    .filter((o) => {
      const d = diasRestantes(o.fechaCierre);
      return d >= 0 && d <= 30;
    })
    .reduce((s, o) => s + o.valor, 0);

  const conteoSemaforo = (s: Semaforo) =>
    oportunidades.filter((o) => semaforo(o) === s).length;
  const totalSem = Math.max(1, oportunidades.length);

  const porEtapa = ESTADOS.map((e) => ({
    etapa: e,
    total: oportunidades.filter((o) => o.estado === e).reduce((s, o) => s + o.valor, 0),
  }));
  const maxEtapa = Math.max(1, ...porEtapa.map((p) => p.total));

  const pendientes = actividades.filter((a) => !a.hecha);

  return (
    <div className="min-h-screen bg-ink text-foreground selection:bg-brand selection:text-accent">
      <div className="mx-auto max-w-[1440px] px-6 py-7 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-line pb-6">
          <div className="flex items-center gap-4">
            <div className="grid size-11 rotate-[-6deg] place-items-center bg-accent font-display text-2xl font-bold text-panel">
              V
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold uppercase leading-none tracking-wide">
                Vanta <span className="text-brand">Pulse</span>
              </h1>
              <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Pipeline Command Deck
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
            titulo="Pipeline total"
            valor={formatoMoneda(pipelineTotal)}
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
            titulo="Cierre estimado"
            valor={formatoMoneda(cierre30)}
            pie="próximos 30 días"
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
            value={fResponsable}
            onChange={(e) => setFResponsable(e.target.value)}
            className="rounded-full border border-line bg-panel px-4 py-1.5 text-sm text-muted-foreground outline-none hover:border-accent/40"
          >
            {responsables.map((r) => (
              <option key={r} value={r}>
                {r === "Todos" ? "Responsable: Todos" : r}
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
                    <th className="px-3 py-3 text-left font-medium">Responsable</th>
                    <th className="px-3 py-3 text-left font-medium">Estado</th>
                    <th className="px-3 py-3 text-left font-medium">Cierre</th>
                    <th className="px-5 py-3 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filtradas.map((o) => {
                    const s = semaforo(o);
                    const d = diasRestantes(o.fechaCierre);
                    const pred = predecirCierre(o);
                    return (
                      <tr key={o.id} className="group hover:bg-panel2/60">
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <span
                              className={`size-2 rounded-full ${COLOR_SEMAFORO[s]}`}
                              title={`${SEMAFORO_LABEL[s]} · prob. cierre ${pred.probabilidad}%`}
                            ></span>
                            {o.id}
                          </span>
                        </td>
                        <td className="px-3 py-4 font-medium">{o.nombre}</td>
                        <td className="px-3 py-4 text-muted-foreground">{o.cliente}</td>
                        <td className="px-3 py-4 text-muted-foreground">{o.responsable}</td>
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
                        </td>
                        <td className="px-5 py-4 text-right font-display font-semibold">
                          <span className="inline-flex items-center gap-3">
                            {formatoMoneda(o.valor)}
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
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
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
