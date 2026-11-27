import { IDS_PLANTILLAS_SERVICIO } from "../constantes.js";
import { normalizar } from "./texto.js";

// Cada checklist representa un servicio: el servicio de la ficha es el nombre
// del checklist elegido.

export const esPlantillaDeServicio = (id) =>
  IDS_PLANTILLAS_SERVICIO.includes(id);

// Checklist cuyo nombre coincide con el servicio (null si no hay o es "Otro")
export const plantillaPorServicio = (datos, servicio) =>
  (servicio &&
    datos.plantillas.find(
      (p) => normalizar(p.nombre).trim() === normalizar(servicio).trim(),
    )) ||
  null;

// Primero los checklists de servicio, después los creados por el encargado
export const plantillasOrdenadas = (datos) => [
  ...IDS_PLANTILLAS_SERVICIO.map((id) =>
    datos.plantillas.find((p) => p.id === id),
  ).filter(Boolean),
  ...datos.plantillas.filter((p) => !esPlantillaDeServicio(p.id)),
];

// La ficha toma el checklist: su servicio y una copia de los ítems
export const aplicarPlantilla = (ficha, plantilla) => ({
  ...ficha,
  plantillaId: plantilla.id,
  servicio: plantilla.nombre,
  checklist: plantilla.items.map((i) => ({
    itemId: i.id,
    texto: i.texto,
    ok: null,
  })),
});

// Con algún ítem ya revisado el checklist no se puede cambiar
export const checklistIniciado = (ficha) =>
  ficha.checklist.some((i) => i.ok !== null);
