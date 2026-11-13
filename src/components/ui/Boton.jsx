import { cx } from "./cx.js";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control text-center font-semibold leading-tight transition-[background-color,border-color,color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const VARIANTES = {
  primario:
    "bg-inacap text-white shadow-sm hover:bg-inacap-oscuro active:bg-inacap-oscuro",
  secundario:
    "border border-neutral-300 bg-white text-tinta hover:border-neutral-400 hover:bg-neutral-50 active:bg-neutral-100",
  peligro:
    "bg-error text-white shadow-sm hover:bg-red-800 active:bg-red-900",
  enlace:
    "min-h-11 bg-transparent px-1 text-inacap underline underline-offset-4 hover:text-inacap-oscuro",
};

const TAMANOS = {
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

export default function Boton({
  variante = "primario",
  tamano = "md",
  bloque = false,
  className = "",
  as: Componente = "button",
  type,
  disabled = false,
  children,
  ...props
}) {
  const esBoton = Componente === "button";
  const esEnlace = variante === "enlace";
  const claseTamano = esEnlace
    ? "min-h-11 px-1 text-sm"
    : cx(TAMANOS[tamano] ?? TAMANOS.md, bloque && "w-full");

  return (
    <Componente
      type={esBoton ? (type ?? "button") : undefined}
      disabled={esBoton ? disabled : undefined}
      aria-disabled={!esBoton && disabled ? "true" : undefined}
      tabIndex={!esBoton && disabled ? -1 : undefined}
      className={cx(
        BASE,
        VARIANTES[variante] ?? VARIANTES.primario,
        claseTamano,
        className,
      )}
      {...props}
    >
      {children}
    </Componente>
  );
}
