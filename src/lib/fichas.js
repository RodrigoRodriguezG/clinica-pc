import {
  ESTADOS_CERRADOS,
  ESTADOS_EN_TRABAJO,
  PERMISOS,
} from "../constantes.js";
import { puede } from "./permisos.js";

export const estaAbierta = (ficha) => !ESTADOS_CERRADOS.includes(ficha.estado);

// Fichas de un equipo, de la más nueva a la más antigua
export const fichasDeEquipo = (datos, equipoId) =>
  datos.fichas
    .filter((f) => f.equipoId === equipoId)
    .sort((a, b) => b.creada.localeCompare(a.creada));

// Ficha en la que el técnico está trabajando ahora (null si está libre)
export const fichaEnCursoDe = (datos, usuarioId) =>
  datos.fichas.find(
    (f) =>
      ESTADOS_EN_TRABAJO.includes(f.estado) &&
      f.tecnicosIds.includes(usuarioId),
  ) ?? null;

// El propietario dueño de una ficha (ficha -> equipo -> propietario)
export function propietarioDeFicha(datos, ficha) {
  const equipo = datos.equipos.find((e) => e.id === ficha.equipoId);
  return datos.propietarios.find((p) => p.id === equipo?.propietarioId) ?? null;
}

// Contacto del propietario: el encargado siempre; el técnico solo si está asignado y la ficha sigue abierta
export const puedeVerContacto = (usuario, ficha) =>
  Boolean(usuario) &&
  (puede(usuario, PERMISOS.VER_TODAS_FICHAS) ||
    (ficha.tecnicosIds.includes(usuario.id) && estaAbierta(ficha)));

// Solo el técnico asignado puede modificar, y mientras la ficha esté abierta
export const puedeEditarFicha = (usuario, ficha) =>
  puede(usuario, PERMISOS.REVISAR_EQUIPOS) &&
  ficha.tecnicosIds.includes(usuario.id) &&
  estaAbierta(ficha);

// Fichas que el usuario puede ver
export function fichasVisibles(datos, usuario) {
  if (puede(usuario, PERMISOS.VER_TODAS_FICHAS)) return datos.fichas;
  if (!puede(usuario, PERMISOS.REVISAR_EQUIPOS)) return [];

  // Equipos que este técnico revisó alguna vez
  const equiposRevisados = new Set(
    datos.fichas
      .filter((f) => f.tecnicosIds.includes(usuario.id))
      .map((f) => f.equipoId),
  );
  return datos.fichas.filter((f) => equiposRevisados.has(f.equipoId));
}
