import {
  ESTADOS_CERRADOS,
  ESTADOS_EN_TRABAJO,
  ESTADO_CIERRE_ANTICIPADO,
  ESTADO_POR_REASIGNAR,
  LIMITE_FICHAS_TECNICO,
  PERMISOS,
} from "../constantes.js";
import { puede } from "./permisos.js";

export const estaAbierta = (ficha) => !ESTADOS_CERRADOS.includes(ficha.estado);

// Fichas de un equipo, de la más nueva a la más antigua
export const fichasDeEquipo = (datos, equipoId) =>
  datos.fichas
    .filter((f) => f.equipoId === equipoId)
    .sort((a, b) => b.creada.localeCompare(a.creada));

// Fichas en las que el técnico está trabajando ahora
export const fichasEnCursoDe = (datos, usuarioId) =>
  datos.fichas.filter(
    (f) =>
      ESTADOS_EN_TRABAJO.includes(f.estado) &&
      f.tecnicosIds.includes(usuarioId),
  );

// ¿Ya llegó al máximo de fichas en trabajo?
export const tecnicoLleno = (datos, usuarioId) =>
  fichasEnCursoDe(datos, usuarioId).length >= LIMITE_FICHAS_TECNICO;

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

// Solo el técnico asignado edita, mientras la ficha esté abierta y no tenga cierre anticipado
export const puedeEditarFicha = (usuario, ficha) =>
  puede(usuario, PERMISOS.REVISAR_EQUIPOS) &&
  ficha.tecnicosIds.includes(usuario.id) &&
  estaAbierta(ficha) &&
  ficha.estado !== ESTADO_CIERRE_ANTICIPADO;

// Rechazar o cerrar anticipadamente: solo mientras la ficha está en trabajo
export const puedeRechazarOCerrar = (usuario, ficha) =>
  puedeEditarFicha(usuario, ficha) && ESTADOS_EN_TRABAJO.includes(ficha.estado);

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

// --- Cambios de una ficha (devuelven la ficha nueva; no modifican la original) ---

const nuevaObservacion = (autorId, texto) => ({
  id: crypto.randomUUID(),
  fecha: new Date().toISOString(),
  autorId,
  texto,
});

export function rechazarFicha(ficha, tecnicoId, motivo) {
  const restantes = ficha.tecnicosIds.filter((id) => id !== tecnicoId);
  return {
    ...ficha,
    tecnicosIds: restantes,
    rechazadaPor: [...(ficha.rechazadaPor ?? []), tecnicoId],
    estado: restantes.length === 0 ? ESTADO_POR_REASIGNAR : ficha.estado,
    observaciones: [
      ...ficha.observaciones,
      nuevaObservacion(tecnicoId, `Rechazó la ficha. Motivo: ${motivo}`),
    ],
  };
}

// El técnico deja de trabajar en el equipo; la ficha sigue abierta para la entrega
export const cerrarAnticipadamente = (ficha, tecnicoId, motivo) => ({
  ...ficha,
  estado: ESTADO_CIERRE_ANTICIPADO,
  observaciones: [
    ...ficha.observaciones,
    nuevaObservacion(tecnicoId, `Cierre anticipado. Motivo: ${motivo}`),
  ],
});

// Recepción asigna nuevos técnicos a una ficha por reasignar
export const reasignarFicha = (ficha, tecnicosIds, usuarioId) => ({
  ...ficha,
  tecnicosIds,
  estado: "Recibido",
  observaciones: [
    ...ficha.observaciones,
    nuevaObservacion(usuarioId, "Ficha reasignada a nuevos técnicos."),
  ],
});
