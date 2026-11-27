import {
  ESTADOS_CERRADOS,
  ESTADOS_EN_TRABAJO,
  ESTADO_CIERRE_ANTICIPADO,
  ESTADO_EN_REPARACION,
  ESTADO_ENTREGADO,
  ESTADO_LISTO,
  ESTADO_POR_REASIGNAR,
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

// Solo el técnico asignado edita, mientras la ficha esté en trabajo
// (cerrarla, el cierre anticipado o la entrega la dejan en solo lectura)
export const puedeEditarFicha = (usuario, ficha) =>
  puede(usuario, PERMISOS.REVISAR_EQUIPOS) &&
  ficha.tecnicosIds.includes(usuario.id) &&
  ESTADOS_EN_TRABAJO.includes(ficha.estado);

// Rechazar, cerrar anticipadamente o cerrar la ficha: mismas condiciones que editar
export const puedeRechazarOCerrar = puedeEditarFicha;

// Solo el técnico asignado entrega el equipo, cuando la ficha está "Listo"
// o con cierre anticipado
export const puedeEntregarFicha = (usuario, ficha) =>
  puede(usuario, PERMISOS.REVISAR_EQUIPOS) &&
  ficha.tecnicosIds.includes(usuario.id) &&
  [ESTADO_LISTO, ESTADO_CIERRE_ANTICIPADO].includes(ficha.estado);

// Fichas que el usuario puede ver
export function fichasVisibles(datos, usuario) {
  if (puede(usuario, PERMISOS.VER_TODAS_FICHAS)) return datos.fichas;
  if (!puede(usuario, PERMISOS.REVISAR_EQUIPOS)) return [];

  // Las fichas que el técnico rechazó ya no son suyas: no las ve
  const propias = datos.fichas.filter(
    (f) => !(f.rechazadaPor ?? []).includes(usuario.id),
  );
  // Equipos que este técnico revisó alguna vez
  const equiposRevisados = new Set(
    propias
      .filter((f) => f.tecnicosIds.includes(usuario.id))
      .map((f) => f.equipoId),
  );
  return propias.filter((f) => equiposRevisados.has(f.equipoId));
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

// Guardar los datos técnicos por primera vez pasa la ficha a "En reparación"
export const estadoTrasGuardarDatos = (ficha) =>
  ficha.estado === "Recibido" ? ESTADO_EN_REPARACION : ficha.estado;

// El técnico termina el trabajo: la ficha queda "Listo" para la entrega
export const cerrarFicha = (ficha, tecnicoId) => ({
  ...ficha,
  estado: ESTADO_LISTO,
  observaciones: [
    ...ficha.observaciones,
    nuevaObservacion(
      tecnicoId,
      "Ficha cerrada. Se envió un correo al propietario para que retire su equipo.",
    ),
  ],
});

// El propietario retiró su equipo: la atención termina. Se crea el token de
// la encuesta de satisfacción, que el propietario responde por QR
export const entregarFicha = (ficha, tecnicoId) => ({
  ...ficha,
  estado: ESTADO_ENTREGADO,
  tokenEncuesta: ficha.tokenEncuesta ?? crypto.randomUUID(),
  observaciones: [
    ...ficha.observaciones,
    nuevaObservacion(tecnicoId, "Equipo entregado al propietario."),
  ],
});

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
