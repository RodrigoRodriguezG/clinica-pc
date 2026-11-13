import { IconoBuscar } from "./iconos.jsx";

export default function EstadoVacio({
  titulo,
  descripcion,
  accion,
  icono,
  className = "",
}) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center rounded-tarjeta border border-dashed border-neutral-300 bg-white px-5 py-9 text-center sm:px-8 sm:py-12 " +
        className
      }
    >
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        {icono ?? <IconoBuscar className="h-6 w-6" />}
      </span>
      <p className="font-semibold text-tinta">{titulo}</p>
      {descripcion && (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-neutral-600">
          {descripcion}
        </p>
      )}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}
