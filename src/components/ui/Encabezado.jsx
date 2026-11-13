import { cx } from "./cx.js";

export default function Encabezado({
  titulo,
  descripcion,
  acciones,
  superior,
  className = "",
}) {
  return (
    <header
      className={cx(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {superior}
        <h1 className="text-2xl font-bold tracking-tight text-tinta sm:text-3xl">
          {titulo}
        </h1>
        {descripcion && (
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
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
