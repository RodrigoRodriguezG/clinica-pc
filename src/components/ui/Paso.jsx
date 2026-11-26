// Bloque numerado de un formulario: guía al usuario de arriba hacia abajo.
export default function Paso({ numero, titulo, ayuda, children }) {
  return (
    <div className="mt-6 grid gap-3 border-t border-slate-100 pt-6 first:mt-0 first:border-t-0 first:pt-0 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-inacap-tenue text-xs font-bold tabular-nums text-inacap-oscuro"
        >
          {numero}
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-base font-semibold text-slate-900">{titulo}</h3>
          {ayuda && (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              {ayuda}
            </p>
          )}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
