import { useEffect, useRef } from "react";
import { cx } from "./cx.js";
import { IconoCerrar } from "./iconos.jsx";

// Panel que se despliega bajo el encabezado para crear un registro.
// La barra roja superior lo marca como la tarjeta protagonista de la página.
export default function PanelCreacion({
  titulo,
  descripcion,
  icono,
  onCerrar,
  className = "",
  children,
}) {
  const ref = useRef(null);

  // Al abrirse, el foco va al primer campo para escribir de inmediato
  useEffect(() => {
    ref.current
      ?.querySelector("input:not([type=hidden]), select, textarea")
      ?.focus();
  }, []);

  return (
    <section
      ref={ref}
      aria-label={titulo}
      className={cx(
        "rounded-tarjeta border border-transparent border-t-4 border-t-inacap bg-white shadow-tarjeta",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {icono && (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-inacap-tenue text-inacap-oscuro"
            >
              {icono}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-900">
              {titulo}
            </h2>
            {descripcion && (
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {descripcion}
              </p>
            )}
          </div>
        </div>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label={`Cerrar: ${titulo}`}
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
          >
            <IconoCerrar className="h-5 w-5" />
          </button>
        )}
      </header>
      <div className="px-5 pt-6 pb-5 sm:px-6 sm:pb-6">{children}</div>
    </section>
  );
}

// Pie de acciones: en móvil dos píldoras de igual ancho; en escritorio a la derecha
export function PieAcciones({ children }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:flex sm:justify-end [&>*]:w-full sm:[&>*]:w-auto sm:[&>*]:min-w-36">
      {children}
    </div>
  );
}
