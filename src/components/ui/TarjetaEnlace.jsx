import { createElement } from "react";
import { cx } from "./cx.js";
import { IconoChevronDerecha } from "./iconos.jsx";

// Tarjeta navegable: ícono a la izquierda, contenido y chevron a la derecha.
// Toda la tarjeta es el enlace o botón (as + props).
export default function TarjetaEnlace({
  as = "a",
  icono,
  eyebrow,
  titulo,
  insignia,
  children,
  pie,
  className = "",
  ...props
}) {
  return createElement(
    as,
    {
      className: cx(
        "group block rounded-tarjeta border border-transparent bg-white shadow-tarjeta transition-[border-color,box-shadow,transform] duration-150 hover:border-inacap/40 hover:shadow-tarjeta-hover active:scale-[0.995]",
        className,
      ),
      ...props,
    },
    <div className="flex items-center gap-4 p-4">
      {icono && (
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-inacap-tenue text-inacap-oscuro"
        >
          {icono}
        </span>
      )}
      <span className="block min-w-0 flex-1">
        {(eyebrow || insignia) && (
          <span className="flex items-center justify-between gap-3">
            <span className="truncate text-xs font-semibold uppercase tracking-wide text-inacap">
              {eyebrow}
            </span>
            {insignia}
          </span>
        )}
        <span className="mt-1 block font-semibold leading-snug text-slate-900 transition-colors duration-150 group-hover:text-inacap-oscuro">
          {titulo}
        </span>
        {children && (
          <span className="mt-1 block text-xs leading-relaxed text-slate-600">
            {children}
          </span>
        )}
      </span>
      <IconoChevronDerecha className="h-5 w-5 shrink-0 text-slate-400 transition-colors duration-150 group-hover:text-inacap" />
    </div>,
    pie && (
      <div className="border-t border-slate-100 px-4 py-2.5">{pie}</div>
    ),
  );
}
