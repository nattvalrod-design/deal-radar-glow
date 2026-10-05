import { useState } from "react";
import { formatoFecha, type Oportunidad } from "@/lib/opportunities";

export function AmpliarDeadline({
  o,
  onGuardar,
  onCerrar,
}: {
  o: Oportunidad;
  onGuardar: (fecha: string, motivo: string) => void;
  onCerrar: () => void;
}) {
  const [fecha, setFecha] = useState(o.fechaCierre);
  const [motivo, setMotivo] = useState("");
  const campo =
    "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-brand";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-accent/55 p-4 backdrop-blur-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (fecha <= o.fechaCierre) return;
          onGuardar(fecha, motivo.trim() || "Comunicado por el cliente");
        }}
        className="w-full max-w-md space-y-4 rounded-xl border border-line bg-panel p-6"
      >
        <h2 className="font-display text-xl font-semibold uppercase tracking-wide">Ampliar deadline</h2>
        <p className="text-sm text-muted-foreground">
          {o.id} · {o.nombre}. Fecha actual: {formatoFecha(o.fechaCierre)}
        </p>
        <label className="block space-y-1.5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Nueva fecha</span>
          <input type="date" min={o.fechaCierre} className={campo} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Motivo / comunicación del cliente</span>
          <textarea className={campo} rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCerrar} className="rounded-md border border-line px-4 py-2 text-sm">Cancelar</button>
          <button type="submit" disabled={fecha <= o.fechaCierre} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-panel disabled:opacity-40">Guardar</button>
        </div>
      </form>
    </div>
  );
}
