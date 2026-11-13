import { cx } from "./cx.js";
import {
  IconoAlerta,
  IconoCheckCircle,
  IconoInfo,
  IconoXCircle,
} from "./iconos.jsx";

const VARIANTES = {
  info: {
    caja: "border-blue-200 bg-info-tenue text-info",
    Icono: IconoInfo,
  },
  aviso: {
    caja: "border-amber-200 bg-aviso-tenue text-aviso",
    Icono: IconoAlerta,
  },
  error: {
    caja: "border-red-200 bg-error-tenue text-error",
    Icono: IconoXCircle,
  },
  exito: {
    caja: "border-green-200 bg-exito-tenue text-exito",
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
        "flex items-start gap-3 rounded-tarjeta border p-3.5 sm:p-4",
        caja,
        className,
      )}
    >
      <Icono className="mt-0.5 h-5 w-5 shrink-0" />
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
