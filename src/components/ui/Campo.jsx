import { createElement, useId } from "react";
import { cx } from "./cx.js";

const CONTROL_BASE =
  "block w-full min-h-11 rounded-control border border-neutral-300 bg-white px-3 py-2.5 text-base text-tinta placeholder:text-neutral-400 transition-[border-color,box-shadow,background-color] duration-150 hover:border-neutral-400 focus:border-inacap focus:outline-none focus:ring-4 focus:ring-inacap/15 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500";

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
        className="block text-sm font-semibold text-tinta"
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
              "border-error focus:border-error focus:ring-error/15 hover:border-error",
            classNameControl,
          ),
          ...props,
        },
        children,
      )}

      {ayuda && !error && (
        <p id={idAyuda} className="text-xs leading-relaxed text-neutral-500">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="text-sm font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
