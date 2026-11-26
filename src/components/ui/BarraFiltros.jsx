import { cx } from "./cx.js";
import Boton from "./Boton.jsx";

// Filtros de una lista, al estilo "Buscar actas": campos en una fila,
// chips debajo y "Limpiar filtros" a la derecha. Sin tarjeta propia.
export default function BarraFiltros({
  hayFiltros = false,
  onLimpiar,
  chips,
  className = "",
  children,
}) {
  const limpiar = onLimpiar && hayFiltros && (
    <Boton variante="enlace" onClick={onLimpiar} className="ml-auto shrink-0">
      Limpiar filtros
    </Boton>
  );

  return (
    <div role="search" className={cx("space-y-3", className)}>
      {children && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
            {children}
          </div>
          {!chips && limpiar}
        </div>
      )}
      {chips && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {chips}
          {limpiar}
        </div>
      )}
    </div>
  );
}
