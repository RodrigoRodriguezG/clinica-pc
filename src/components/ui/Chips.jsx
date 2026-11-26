import { cx } from "./cx.js";

// Filtro de pocas opciones como píldoras: la activa va en rojo.
// Recibe el mismo valor y setter que usaría un <select>.
export default function Chips({
  etiqueta,
  opciones,
  valor,
  onChange,
  className = "",
}) {
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className={cx("flex flex-wrap gap-2", className)}
    >
      {opciones.map(({ valor: v, texto }) => {
        const activa = v === valor;
        return (
          <button
            key={String(v)}
            type="button"
            aria-pressed={activa}
            onClick={() => onChange(v)}
            className={cx(
              "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors duration-150",
              activa
                ? "border-inacap bg-inacap text-white hover:border-inacap-oscuro hover:bg-inacap-oscuro"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
            )}
          >
            {texto}
          </button>
        );
      })}
    </div>
  );
}
