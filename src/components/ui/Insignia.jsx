import { cx } from "./cx.js";

const TONOS = {
  neutral: "border-neutral-200 bg-neutral-100 text-neutral-700",
  info: "border-blue-200 bg-info-tenue text-info",
  aviso: "border-amber-200 bg-aviso-tenue text-aviso",
  exito: "border-green-200 bg-exito-tenue text-exito",
  "exito-fuerte": "border-green-300 bg-green-100 text-exito-fuerte",
  error: "border-red-200 bg-error-tenue text-error",
  inacap: "border-inacap/20 bg-inacap-tenue text-inacap-oscuro",
};

const PUNTO = {
  neutral: "bg-neutral-500",
  info: "bg-info",
  aviso: "bg-aviso",
  exito: "bg-exito",
  "exito-fuerte": "bg-exito-fuerte",
  error: "bg-error",
  inacap: "bg-inacap",
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
        "inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        TONOS[clave] ?? TONOS.neutral,
        className,
      )}
    >
      {punto && (
        <span
          aria-hidden="true"
          className={cx(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            PUNTO[clave] ?? PUNTO.neutral,
          )}
        />
      )}
      {texto}
    </span>
  );
}
