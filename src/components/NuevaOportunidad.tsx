import { useState } from "react";
import { ESTADOS, type Estado, type Oportunidad } from "@/lib/opportunities";

export function NuevaOportunidad({
  onGuardar,
  onCerrar,
}: {
  onGuardar: (o: Oportunidad) => void;
  onCerrar: () => void;
}) {
  const [form, setForm] = useState({
    id: "",
    nombre: "",
    cliente: "",
    responsable: "",
    estado: "Calificación" as Estado,
    fechaCierre: new Date().toISOString().slice(0, 10),
    valor: "",
  });

  const campo =
    "w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white outline-none focus:border-brand";
  const etiqueta = "text-[11px] uppercase tracking-[0.18em] text-white/45";

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.nombre || !form.cliente) return;
    onGuardar({
      id: form.id.trim(),
      nombre: form.nombre.trim(),
      cliente: form.cliente.trim(),
      responsable: form.responsable.trim() || "Sin asignar",
      estado: form.estado,
      fechaCierre: form.fechaCierre,
      valor: Number(form.valor) || 0,
    });
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form
        onSubmit={enviar}
        className="w-full max-w-xl rounded-xl border border-line bg-panel p-6"
      >
        <h2 className="font-display text-xl font-semibold uppercase tracking-wide">
          Nueva oportunidad
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className={etiqueta}>Opportunity ID</span>
            <input
              className={campo}
              placeholder="OPP-2050"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className={etiqueta}>Nombre de oportunidad</span>
            <input
              className={campo}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className={etiqueta}>Cliente</span>
            <input
              className={campo}
              value={form.cliente}
              onChange={(e) => setForm({ ...form, cliente: e.target.value })}
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className={etiqueta}>Responsable</span>
            <input
              className={campo}
              value={form.responsable}
              onChange={(e) => setForm({ ...form, responsable: e.target.value })}
            />
          </label>
          <label className="space-y-1.5">
            <span className={etiqueta}>Estado</span>
            <select
              className={campo}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as Estado })}
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s} className="bg-ink">
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className={etiqueta}>Fecha de cierre</span>
            <input
              type="date"
              className={campo}
              value={form.fechaCierre}
              onChange={(e) => setForm({ ...form, fechaCierre: e.target.value })}
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className={etiqueta}>Valor estimado (USD)</span>
            <input
              type="number"
              min="0"
              className={campo}
              placeholder="250000"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-line px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-white/70 hover:border-white/40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-brand px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-ink hover:brightness-110"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
