import { useEffect, useRef } from "react";
import { cx } from "./cx.js";
import { IconoCerrar } from "./iconos.jsx";

// Panel que se despliega bajo el encabezado para crear un registro.
// El acento superior lo distingue de las tarjetas de la lista.
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
        "overflow-hidden rounded-tarjeta border border-transparent bg-white shadow-tarjeta",
        className,
      )}
    >
      <div aria-hidden="true" className="h-1 bg-inacap" />
      <header className="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {icono && (
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-inacap-tenue text-inacap-oscuro"
            >
              {icono}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-tinta">
              {titulo}
            </h2>
            {descripcion && (
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">
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
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-tinta"
          >
            <IconoCerrar className="h-5 w-5" />
          </button>
        )}
      </header>
      <div className="px-4 py-5 sm:px-6">{children}</div>
    </section>
  );
}

// Pie de acciones del panel: Cancelar y la acción principal a la derecha
export function PieAcciones({ children }) {
  return (
    <div className="-mx-4 -mb-5 mt-6 flex flex-col-reverse gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
      {children}
    </div>
  );
}
