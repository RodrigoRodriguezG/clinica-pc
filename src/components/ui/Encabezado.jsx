import { cx } from "./cx.js";

export default function Encabezado({
  titulo,
  descripcion,
  acciones,
  superior,
  // Etiqueta corta en rojo y mayúsculas sobre el título
  eyebrow,
  className = "",
}) {
  return (
    <header
      className={cx(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {superior}
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wide text-inacap">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900">
          {titulo}
        </h1>
        {descripcion && (
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
            {descripcion}
          </p>
        )}
      </div>
      {acciones && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {acciones}
        </div>
      )}
    </header>
  );
}
