// Une clases condicionales sin dependencias externas.
export function cx(...clases) {
  return clases.filter(Boolean).join(" ");
}
