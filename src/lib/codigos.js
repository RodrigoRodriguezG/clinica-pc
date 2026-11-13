// siguienteCodigo('FT', datos.fichas, 'numero') -> 'FT-004'
export function siguienteCodigo(prefijo, lista, campo) {
  const usados = lista
    .map((x) => Number(String(x[campo] ?? "").replace(/\D/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  const siguiente = (usados.length ? Math.max(...usados) : 0) + 1;
  return `${prefijo}-${String(siguiente).padStart(3, "0")}`;
}
