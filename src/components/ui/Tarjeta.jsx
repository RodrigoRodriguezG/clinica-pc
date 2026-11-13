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
        "rounded-tarjeta border border-neutral-200 bg-white shadow-tarjeta",
        interactiva &&
          "transition-[border-color,box-shadow] duration-150 hover:border-neutral-300 hover:shadow-elevada",
        className,
      ),
      ...props,
    },
    children,
  );
}
