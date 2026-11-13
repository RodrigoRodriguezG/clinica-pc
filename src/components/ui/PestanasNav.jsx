import { cx } from "./cx.js";

export default function PestanasNav({
  pestanas,
  activa,
  onChange,
  etiqueta = "Secciones",
  className = "",
}) {
  return (
    <div className={cx("-mx-1 overflow-x-auto pb-px", className)}>
      <div
        role="tablist"
        aria-label={etiqueta}
        className="flex min-w-max gap-1 border-b border-neutral-200 px-1"
      >
        {pestanas.map(({ id, etiqueta: texto, disabled }) => {
          const seleccionada = activa === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              disabled={disabled}
              onClick={() => onChange(id)}
              className={cx(
                "min-h-11 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
                seleccionada
                  ? "border-inacap font-semibold text-inacap"
                  : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-tinta",
              )}
            >
              {texto}
            </button>
          );
        })}
      </div>
    </div>
  );
}
