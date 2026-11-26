// Fila numerada de un formulario: guía al usuario de arriba hacia abajo.
export default function Paso({ numero, titulo, ayuda, children }) {
  return (
    <div className="mt-5 grid gap-3 border-t border-neutral-200 pt-5 first:mt-0 first:border-t-0 first:pt-0 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tinta text-xs font-bold tabular-nums text-white"
        >
          {numero}
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold text-tinta">{titulo}</h3>
          {ayuda && (
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
              {ayuda}
            </p>
          )}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
