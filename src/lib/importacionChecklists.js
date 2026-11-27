import { descargarXlsx, leerTablaExcel } from "./importacion.js";
import { normalizar } from "./texto.js";

// Encabezados aceptados (ya normalizados: sin tildes ni mayúsculas)
const ALIAS_PLANTILLA = [
  "plantilla",
  "nombre plantilla",
  "nombre de la plantilla",
  "checklist",
];
const ALIAS_ITEM = ["item", "items", "texto", "descripcion"];

// Mismos límites que los campos de la página de Checklists
export const MAX_NOMBRE_PLANTILLA = 60;
export const MAX_ITEM = 80;

const claveNombre = (nombre) => normalizar(nombre).trim();

// Una fila por ítem; las filas con el mismo nombre forman una plantilla
export const leerFilasChecklist = (archivo) =>
  leerTablaExcel(archivo, {
    plantilla: { alias: ALIAS_PLANTILLA, etiqueta: "Plantilla" },
    item: { alias: ALIAS_ITEM, etiqueta: "Ítem" },
  });

// Marca cada fila con el motivo por el que no se puede crear (o null)
export function validarFilasChecklist(filas, plantillasExistentes) {
  const existentes = new Set(plantillasExistentes.map((p) => claveNombre(p.nombre)));
  const vistos = new Set(); // "plantilla|ítem" ya aceptados

  return filas.map((f) => {
    const nombre = claveNombre(f.plantilla);
    const item = `${nombre}|${normalizar(f.item).trim()}`;
    let error = null;
    if (!f.plantilla) error = "Falta el nombre de la plantilla";
    else if (f.plantilla.length > MAX_NOMBRE_PLANTILLA)
      error = `Nombre muy largo (máx. ${MAX_NOMBRE_PLANTILLA})`;
    else if (existentes.has(nombre))
      error = "La clínica ya tiene una plantilla con ese nombre";
    else if (!f.item) error = "Falta el ítem";
    else if (f.item.length > MAX_ITEM) error = `Ítem muy largo (máx. ${MAX_ITEM})`;
    else if (vistos.has(item)) error = "Ítem repetido en la plantilla";
    if (!error) vistos.add(item);
    return { ...f, error };
  });
}

// Agrupa las filas válidas en plantillas, respetando el orden del archivo.
// El nombre que se guarda es el de la primera fila de cada grupo
export function agruparPlantillas(filasValidas) {
  const grupos = new Map();
  for (const f of filasValidas) {
    const clave = claveNombre(f.plantilla);
    if (!grupos.has(clave))
      grupos.set(clave, { id: crypto.randomUUID(), nombre: f.plantilla, items: [] });
    grupos.get(clave).items.push({ id: crypto.randomUUID(), texto: f.item });
  }
  return [...grupos.values()];
}

export const descargarPlantillaChecklist = () =>
  descargarXlsx(
    [
      ["Plantilla", "Ítem"],
      ["Revisión de notebooks", "Enciende correctamente"],
      ["Revisión de notebooks", "Batería carga"],
      ["Revisión de notebooks", "Bisagras firmes"],
      ["Revisión de escritorio", "Enciende correctamente"],
      ["Revisión de escritorio", "Ventilador sin ruido"],
    ],
    [30, 40],
    "Checklists",
    "plantilla-checklists.xlsx",
  );
