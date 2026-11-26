import { createElement, useId } from "react";
import { cx } from "./cx.js";

// Mismo control que el sistema de Actas: borde slate, sombra mínima y anillo rojo al enfocar
const CONTROL_BASE =
  "block w-full min-h-11 rounded-control border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-xs placeholder:text-slate-400 transition-[border-color,box-shadow,background-color] duration-150 hover:border-slate-400 focus:border-inacap focus:outline-none focus:ring-3 focus:ring-inacap/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:text-sm";

export default function Campo({
  etiqueta,
  id,
  ayuda,
  error,
  requerido = false,
  as: Control = "input",
  className = "",
  classNameControl = "",
  children,
  ...props
}) {
  const generado = useId();
  const idCampo = id ?? `campo-${generado}`;
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined;
  const idError = error ? `${idCampo}-error` : undefined;
  const descritoPor = [idAyuda, idError].filter(Boolean).join(" ") || undefined;
  const esRequerido = requerido || props.required;

  return (
    <div className={cx("space-y-1.5", className)}>
      <label
        htmlFor={idCampo}
        className="block text-sm font-medium text-slate-700"
      >
        {etiqueta}
        {esRequerido && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-inacap">
              *
            </span>
            <span className="sr-only"> (obligatorio)</span>
          </>
        )}
      </label>

      {createElement(
        Control,
        {
          id: idCampo,
          required: esRequerido || undefined,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": descritoPor,
          className: cx(
            CONTROL_BASE,
            error &&
              "border-inacap bg-inacap-tenue/40 focus:border-inacap focus:ring-inacap/25 hover:border-inacap",
            classNameControl,
          ),
          ...props,
        },
        children,
      )}

      {ayuda && !error && (
        <p id={idAyuda} className="text-xs leading-relaxed text-slate-600">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="text-sm font-medium text-inacap-oscuro">
          {error}
        </p>
      )}
    </div>
  );
}
