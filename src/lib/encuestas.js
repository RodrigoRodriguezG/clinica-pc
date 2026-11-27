import { ESTADO_ENTREGADO } from "../constantes.js";

// Encuesta de satisfacción (RF-10). Cada ficha entregada tiene un token
// aleatorio: el QR lleva el token y no el id, para que no se pueda adivinar
// la encuesta de otra persona. La respuesta sirve como constancia de recepción.

export const LARGO_COMENTARIO = 500;

// Enlace público a la encuesta de una ficha (la app usa HashRouter)
export const enlaceEncuesta = (token) =>
  `${window.location.origin}${window.location.pathname}#/encuesta/${token}`;

export const fichaPorToken = (datos, token) =>
  (token && datos.fichas.find((f) => f.tokenEncuesta === token)) || null;

export const respuestaDeFicha = (datos, fichaId) =>
  (datos.retros ?? []).find((r) => r.fichaId === fichaId) ?? null;

// Por qué la ficha no puede recibir respuestas (null si puede)
export function motivoEncuestaNoDisponible(datos, ficha) {
  if (!ficha) return "invalida";
  if (ficha.estado !== ESTADO_ENTREGADO) return "no-entregada";
  if (respuestaDeFicha(datos, ficha.id)) return "respondida";
  return null;
}

// Devuelve un mensaje de error o null si la respuesta es válida
export function validarRespuesta({ nota, conforme, comentario, recibido }) {
  if (![1, 2, 3, 4, 5].includes(nota))
    return "Elige una nota del 1 al 5.";
  if (typeof conforme !== "boolean")
    return "Indica si recibiste tu equipo conforme.";
  if (comentario.trim().length > LARGO_COMENTARIO)
    return `El comentario no puede superar los ${LARGO_COMENTARIO} caracteres.`;
  if (!recibido) return "Confirma que recibiste tu equipo.";
  return null;
}

export const nuevaRespuesta = (fichaId, { nota, conforme, comentario }) => ({
  id: crypto.randomUUID(),
  fichaId,
  fecha: new Date().toISOString(),
  nota,
  conforme,
  comentario: comentario.trim(),
});

// Promedio de notas con un decimal (null si no hay respuestas)
export const notaPromedio = (respuestas) =>
  respuestas.length
    ? Math.round(
        (respuestas.reduce((s, r) => s + r.nota, 0) / respuestas.length) * 10,
      ) / 10
    : null;

export const porcentaje = (parte, total) =>
  total ? Math.round((parte / total) * 100) : null;
