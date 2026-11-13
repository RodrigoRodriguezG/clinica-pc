import { ESTADOS_CERRADOS } from "../constantes.js";

export const estaAbierta = (ficha) => !ESTADOS_CERRADOS.includes(ficha.estado);

// Fichas de un equipo, de la más nueva a la más antigua
export const fichasDeEquipo = (datos, equipoId) =>
  datos.fichas
    .filter((f) => f.equipoId === equipoId)
    .sort((a, b) => b.creada.localeCompare(a.creada));
