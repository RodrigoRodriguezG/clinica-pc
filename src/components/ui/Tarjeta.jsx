import { createElement } from "react";
import { cx } from "./cx.js";

export default function Tarjeta({
  as: Componente = "div",
  interactiva = false,
  // Barra roja superior: solo para la tarjeta protagonista de la página
  acento = false,
  className = "",
  children,
  ...props
}) {
  return createElement(
    Componente,
    {
      className: cx(
        // Borde transparente bajo el anillo de sombra: se ve en colores forzados
        "rounded-tarjeta border border-transparent bg-white shadow-tarjeta",
        acento && "border-t-4 border-t-inacap",
        interactiva &&
          "transition-[border-color,box-shadow] duration-150 hover:border-inacap/40 hover:shadow-tarjeta-hover",
        className,
      ),
      ...props,
    },
    children,
  );
}
