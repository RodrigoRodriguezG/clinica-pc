import { IconoMonitor } from "./ui/iconos.jsx";

// Marco de las páginas públicas (sin sesión) a las que se llega por QR
export default function MarcoPublico({ subtitulo, children }) {
  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-inacap text-white"
            >
              <IconoMonitor className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-tight text-tinta">
                Clínica del PC
              </p>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                INACAP
              </p>
            </div>
          </div>
          {subtitulo && (
            <span className="hidden text-xs font-medium text-neutral-500 sm:block">
              {subtitulo}
            </span>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
