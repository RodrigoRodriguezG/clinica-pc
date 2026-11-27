import { SERVICIOS, plantillasBaseDe } from "../constantes.js";
import { normalizar } from "./texto.js";

// Cada checklist pertenece a una clínica y representa un servicio: el
// servicio de la ficha es el nombre del checklist elegido.

export const esPlantillaDeServicio = (plantilla) =>
  Boolean(plantilla?.servicioBase);

export const plantillasDeClinica = (datos, clinicaId) =>
  datos.plantillas.filter((p) => p.clinicaId === clinicaId);

const mismoNombre = (a, b) => normalizar(a).trim() === normalizar(b).trim();

// ¿Ya hay un checklist con ese nombre en la clínica?
export const nombreOcupado = (datos, clinicaId, nombre, idActual = null) =>
  plantillasDeClinica(datos, clinicaId).some(
    (p) => p.id !== idActual && mismoNombre(p.nombre, nombre),
  );

// Checklist de la clínica cuyo nombre coincide con el servicio
// (null si no hay o el propietario eligió "Otro")
export const plantillaPorServicio = (datos, servicio, clinicaId) =>
  (servicio &&
    plantillasDeClinica(datos, clinicaId).find((p) =>
      mismoNombre(p.nombre, servicio),
    )) ||
  null;

// Primero los checklists de servicio (en el orden de SERVICIOS), después los
// adicionales de la clínica
export const plantillasOrdenadas = (datos, clinicaId) => {
  const propias = plantillasDeClinica(datos, clinicaId);
  const base = propias
    .filter(esPlantillaDeServicio)
    .sort(
      (a, b) => SERVICIOS.indexOf(a.nombre) - SERVICIOS.indexOf(b.nombre),
    );
  return [...base, ...propias.filter((p) => !esPlantillaDeServicio(p))];
};

// Los 3 checklists de servicio que le faltan a una clínica
export const plantillasBaseFaltantes = (plantillas, clinicaId) =>
  plantillasBaseDe(clinicaId).filter(
    (b) =>
      !plantillas.some(
        (p) =>
          p.clinicaId === clinicaId &&
          p.servicioBase &&
          mismoNombre(p.nombre, b.nombre),
      ),
  );

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
