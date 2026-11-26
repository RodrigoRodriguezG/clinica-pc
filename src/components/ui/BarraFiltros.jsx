import { cx } from "./cx.js";
import Boton from "./Boton.jsx";

// Filtros de una lista: sin tarjeta propia, pegados a la lista que filtran.
export default function BarraFiltros({
  hayFiltros = false,
  onLimpiar,
  className = "",
  children,
}) {
  return (
    <div
      role="search"
      className={cx(
        "flex flex-col gap-3 rounded-tarjeta bg-neutral-200/50 p-3 sm:flex-row sm:items-end sm:p-4",
        className,
      )}
    >
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
        {children}
      </div>
      {onLimpiar && hayFiltros && (
        <Boton variante="enlace" onClick={onLimpiar} className="self-end">
          Limpiar filtros
        </Boton>
      )}
    </div>
  );
}
