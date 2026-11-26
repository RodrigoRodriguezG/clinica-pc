import { createElement } from "react";
import { cx } from "./cx.js";

export default function Tarjeta({
  as: Componente = "div",
  interactiva = false,
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
        interactiva &&
          "transition-shadow duration-150 hover:shadow-tarjeta-hover",
        className,
      ),
      ...props,
    },
    children,
  );
}
