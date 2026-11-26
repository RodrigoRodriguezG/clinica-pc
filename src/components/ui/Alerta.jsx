import { cx } from "./cx.js";
import {
  IconoAlerta,
  IconoCheckCircle,
  IconoInfo,
  IconoXCircle,
} from "./iconos.jsx";

const VARIANTES = {
  info: {
    caja: "border-sky-200 bg-sky-50 text-sky-900",
    Icono: IconoInfo,
  },
  aviso: {
    caja: "border-amber-200 bg-amber-50 text-amber-900",
    Icono: IconoAlerta,
  },
  error: {
    caja: "border-inacap/30 bg-inacap-tenue text-inacap-oscuro",
    Icono: IconoXCircle,
  },
  exito: {
    caja: "border-emerald-200 bg-emerald-50 text-emerald-900",
    Icono: IconoCheckCircle,
  },
};

export default function Alerta({
  variante = "info",
  titulo,
  children,
  acciones,
  className = "",
  role,
}) {
  const { caja, Icono } = VARIANTES[variante] ?? VARIANTES.info;

  return (
    <div
      role={role}
      className={cx(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        caja,
        className,
      )}
    >
      <Icono className="mt-px h-5 w-5 shrink-0" strokeWidth="1.5" />
      <div className="min-w-0 flex-1 space-y-1">
        {titulo && <p className="font-semibold leading-snug">{titulo}</p>}
        {children && (
          <div className="text-sm leading-relaxed break-words">{children}</div>
        )}
        {acciones && (
          <div className="flex flex-wrap gap-2 pt-2">{acciones}</div>
        )}
      </div>
    </div>
  );
}
