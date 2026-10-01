import { jsPDF } from "jspdf";
import {
  diasRestantes,
  formatoMoneda,
  semaforo,
  SEMAFORO_LABEL,
  type Oportunidad,
} from "./opportunities";

export type PanelVendedor = {
  nombre: string;
  vigentes: Oportunidad[];
  porVencer: Oportunidad[];
  vencidas: Oportunidad[];
  ganado: number;
  estimado: number;
};

function descargar(nombre: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function celdaCsv(v: string | number): string {
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportarCSV(ops: Oportunidad[], panel: PanelVendedor[]) {
  const lineas: string[] = [];
  lineas.push("PIPELINE DE OFERTAS");
  lineas.push(
    [
      "ID",
      "Oportunidad",
      "Cliente",
      "Comercial",
      "Técnico",
      "Vendedor",
      "Segmento",
      "Inspektor",
      "Estado",
      "Fecha cierre",
      "Días restantes",
      "Semáforo",
      "Valor",
    ].join(";"),
  );
  ops.forEach((o) => {
    lineas.push(
      [
        o.id,
        o.nombre,
        o.cliente,
        o.comercial,
        o.tecnico,
        o.vendedor,
        o.segmento,
        o.inspektor,
        o.estado,
        o.fechaCierre,
        diasRestantes(o.fechaCierre),
        SEMAFORO_LABEL[semaforo(o)],
        o.valor,
      ]
        .map(celdaCsv)
        .join(";"),
    );
  });
  lineas.push("");
  lineas.push("ESTADOS POR VENDEDOR");
  lineas.push(
    ["Vendedor", "Vigentes", "Por vencer", "Vencidas", "Ganado", "Pipeline estimado"].join(";"),
  );
  panel.forEach((v) => {
    lineas.push(
      [v.nombre, v.vigentes.length, v.porVencer.length, v.vencidas.length, v.ganado, v.estimado]
        .map(celdaCsv)
        .join(";"),
    );
  });
  const blob = new Blob(["﻿" + lineas.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  descargar("offerpulse-pipeline.csv", blob);
}

export function exportarPDF(ops: Oportunidad[], panel: PanelVendedor[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
  const W = doc.internal.pageSize.getWidth();
  let y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 45, 90);
  doc.text("OfferPulse — Pipeline de ofertas", 40, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 120, 135);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 40, y + 16);
  y += 40;

  const cols = [
    "ID",
    "Oportunidad",
    "Cliente",
    "Vendedor",
    "Seg.",
    "Inspektor",
    "Estado",
    "Cierre",
    "Días",
    "Valor",
  ];
  const anchos = [58, 175, 75, 70, 34, 75, 78, 62, 40, 70];
  const x0 = 40;

  const fila = (vals: (string | number)[], header = false, roja = false) => {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 48;
    }
    let x = x0;
    doc.setFont("helvetica", header ? "bold" : "normal");
    doc.setFontSize(8.5);
    vals.forEach((v, i) => {
      if (header) doc.setTextColor(255, 255, 255);
      else if (roja) doc.setTextColor(200, 30, 30);
      else doc.setTextColor(40, 50, 65);
      doc.text(String(v), x, y);
      x += anchos[i];
    });
    if (header) {
      doc.setDrawColor(15, 45, 90);
      doc.setFillColor(15, 45, 90);
      doc.rect(x0 - 4, y - 11, W - 72, 16, "F");
      x = x0;
      doc.setTextColor(255, 255, 255);
      vals.forEach((v, i) => {
        doc.text(String(v), x, y);
        x += anchos[i];
      });
    }
    y += 15;
  };

  fila(cols, true);
  ops.forEach((o) => {
    const d = diasRestantes(o.fechaCierre);
    const critica = o.estado !== "Ganada" && o.estado !== "Perdida" && d < 7;
    fila(
      [
        o.id,
        o.nombre.slice(0, 38),
        o.cliente,
        o.vendedor,
        o.segmento,
        o.inspektor,
        o.estado,
        o.fechaCierre,
        d,
        formatoMoneda(o.valor),
      ],
      false,
      critica,
    );
  });

  y += 22;
  if (y > doc.internal.pageSize.getHeight() - 120) {
    doc.addPage();
    y = 48;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 45, 90);
  doc.text("Estados por vendedor", 40, y);
  y += 20;

  const colsV = ["Vendedor", "Vigentes", "Por vencer", "Vencidas", "Ganado", "Pipeline estimado"];
  const anchosV = [110, 70, 80, 70, 90, 110];
  const filaV = (vals: (string | number)[], header = false) => {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 48;
    }
    let x = x0;
    doc.setFont("helvetica", header ? "bold" : "normal");
    doc.setFontSize(9);
    if (header) {
      doc.setFillColor(15, 45, 90);
      doc.rect(x0 - 4, y - 11, anchosV.reduce((a, b) => a + b, 0) + 8, 16, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(40, 50, 65);
    }
    vals.forEach((v, i) => {
      doc.text(String(v), x, y);
      x += anchosV[i];
    });
    y += 15;
  };

  filaV(colsV, true);
  panel.forEach((v) => {
    filaV([
      v.nombre,
      v.vigentes.length,
      v.porVencer.length,
      v.vencidas.length,
      formatoMoneda(v.ganado),
      formatoMoneda(v.estimado),
    ]);
  });

  doc.save("offerpulse-pipeline.pdf");
}
