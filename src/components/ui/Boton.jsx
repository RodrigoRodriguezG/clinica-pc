import { cx } from "./cx.js";

// Botones tipo píldora, alineados con el sistema de diseño de Actas INACAP
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full text-center font-semibold leading-tight select-none transition-[background-color,border-color,color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const VARIANTES = {
  // Acción principal de la vista
  primario:
    "bg-inacap text-white shadow-sm hover:bg-inacap-oscuro active:bg-inacap-oscuro",
  // Acción secundaria destacada: contorno rojo
  contorno:
    "border border-inacap bg-white text-inacap hover:bg-inacap-tenue active:bg-inacap-tenue",
  // Acción neutral (Cancelar, Limpiar, Ver detalle): contorno gris
  secundario:
    "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100",
  peligro:
    "bg-inacap-oscuro text-white shadow-sm hover:bg-[#8f0e22] active:bg-[#8f0e22]",
  enlace:
    "min-h-11 bg-transparent px-1 text-inacap-oscuro underline decoration-inacap/40 underline-offset-2 hover:decoration-inacap",
  "peligro-enlace":
    "min-h-11 bg-transparent px-1 text-inacap-oscuro underline decoration-inacap-oscuro/40 underline-offset-2 hover:decoration-inacap-oscuro",
};

const TAMANOS = {
  sm: "min-h-9 px-4 py-1.5 text-xs",
  md: "min-h-11 px-5 py-2 text-sm",
  lg: "min-h-12 px-6 text-base",
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
  const esEnlace = variante === "enlace" || variante === "peligro-enlace";
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
