// '2026-12-01' -> '01/12/2026'. Se arma con T00:00:00 para que sea hora local
export const formatearFecha = (fecha) =>
  new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

// Fecha local en formato 2026-11-12 a partir de un ISO. Evita que una ficha creada de noche
// aparezca en el día siguiente (los ISO vienen en UTC)
export const fechaLocal = (iso) => new Date(iso).toLocaleDateString("en-CA");

// Hoy y mañana en hora local, formato 2026-11-12 (sirve para inputs type="date")
export const hoyLocal = () => new Date().toLocaleDateString("en-CA");

export const mananaLocal = () => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
  return fecha.toLocaleDateString("en-CA");
};
