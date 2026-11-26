import { cx } from "./cx.js";

// Badges con anillo interior; el texto siempre acompaña al color
const TONOS = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/25",
  info: "bg-sky-50 text-sky-800 ring-sky-600/25",
  aviso: "bg-amber-50 text-amber-800 ring-amber-600/30",
  exito: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
  "exito-fuerte": "bg-emerald-100 text-emerald-900 ring-emerald-700/30",
  error: "bg-inacap-tenue text-inacap-oscuro ring-inacap/30",
  inacap: "bg-inacap-tenue text-inacap-oscuro ring-inacap/30",
  blanco: "bg-white text-slate-700 ring-slate-300",
};

const TONO_POR_ESTADO = {
  Recibido: "neutral",
  "En diagnóstico": "info",
  "En reparación": "aviso",
  Listo: "exito",
  Entregado: "exito-fuerte",
  "No retirado": "error",
  "Por reasignar": "aviso",
  "Cierre anticipado": "neutral",
};

export default function Insignia({
  tono,
  estado,
  children,
  punto = true,
  className = "",
}) {
  const clave = tono ?? TONO_POR_ESTADO[estado] ?? "neutral";
  const texto = children ?? estado;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none ring-1 ring-inset",
        TONOS[clave] ?? TONOS.neutral,
        className,
      )}
    >
      {punto && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
        />
      )}
      {texto}
    </span>
  );
}
