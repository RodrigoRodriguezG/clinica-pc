import { useId } from "react";
import { cx } from "./cx.js";

// Bloque de página con un título claro, un contador opcional y su contenido.
export default function Seccion({
  titulo,
  descripcion,
  contador,
  acciones,
  className = "",
  children,
}) {
  const id = useId();

  return (
    <section aria-labelledby={id} className={cx("space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 space-y-0.5">
          <h2
            id={id}
            className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900"
          >
            {titulo}
            {contador !== undefined && contador !== null && (
              <span
                aria-live="polite"
                className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700 ring-1 ring-inset ring-slate-300"
              >
                <span className="sr-only">, </span>
                {contador}
              </span>
            )}
          </h2>
          {descripcion && (
            <p className="text-sm leading-relaxed text-slate-600">
              {descripcion}
            </p>
          )}
        </div>
        {acciones && (
          <div className="flex flex-wrap items-center gap-2">{acciones}</div>
        )}
      </div>
      {children}
    </section>
  );
}
