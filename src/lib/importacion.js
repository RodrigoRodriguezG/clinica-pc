import { ROLES, SEDES } from "../constantes.js";
import { normalizar } from "./texto.js";

// Encabezados aceptados (ya normalizados: sin tildes ni mayúsculas)
const ALIAS_NOMBRE = ["nombre", "nombre completo", "nombres"];
const ALIAS_CORREO = ["correo", "email", "e-mail", "correo electronico", "mail"];
const ALIAS_SEDE = ["sede"];

// "san pedro de la paz" o "Sede San Pedro de la Paz" -> "Sede San Pedro de la Paz"
const claveSede = (texto) => normalizar(texto).trim().replace(/^sede\s+/, "");
export const sedeOficial = (texto) =>
  SEDES.find((s) => claveSede(s) === claveSede(texto)) ?? null;

export const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// SheetJS se carga solo cuando se usa, para no agrandar la carga inicial
const cargarXlsx = () => import("xlsx");

const buscarIndice = (encabezados, alias) =>
  encabezados.findIndex((e) => alias.includes(normalizar(e).trim()));

// Lee la primera hoja buscando las columnas pedidas por sus alias.
// columnas = { clave: { alias: [...], etiqueta } }. Devuelve { filas } o { error }
export async function leerTablaExcel(archivo, columnas) {
  try {
    const XLSX = await cargarXlsx();
    const libro = XLSX.read(await archivo.arrayBuffer());
    const hoja = libro.Sheets[libro.SheetNames[0]];
    if (!hoja) return { error: "El archivo no tiene hojas con datos." };

    const tabla = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: "" });
    const encabezados = (tabla[0] ?? []).map((e) => String(e));
    const claves = Object.keys(columnas);
    const indices = Object.fromEntries(
      claves.map((c) => [c, buscarIndice(encabezados, columnas[c].alias)]),
    );

    if (claves.some((c) => indices[c] === -1)) {
      const nombres = claves.map((c) => `"${columnas[c].etiqueta}"`);
      const lista = `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
      return {
        error: `No se encontraron las columnas ${lista} en la primera fila. Usa la plantilla.`,
      };
    }

    const filas = tabla.slice(1).map((celdas, i) => ({
      fila: i + 2, // número de fila tal como se ve en Excel
      ...Object.fromEntries(
        claves.map((c) => [c, String(celdas[indices[c]] ?? "").trim()]),
      ),
    }));
    return { filas: filas.filter((f) => claves.some((c) => f[c])) };
  } catch {
    return {
      error: "No se pudo leer el archivo. Verifica que sea un Excel o CSV válido.",
    };
  }
}

// Lee técnicos (columnas Nombre, Correo y Sede). Devuelve { filas } o { error }
export async function leerFilasExcel(archivo) {
  const resultado = await leerTablaExcel(archivo, {
    nombre: { alias: ALIAS_NOMBRE, etiqueta: "Nombre" },
    correo: { alias: ALIAS_CORREO, etiqueta: "Correo" },
    sede: { alias: ALIAS_SEDE, etiqueta: "Sede" },
  });
  if (resultado.error) return resultado;
  return {
    filas: resultado.filas.map((f) => ({
      ...f,
      correo: f.correo.toLowerCase(),
      // Se guarda con el nombre oficial; si no coincide queda el texto original
      sede: sedeOficial(f.sede) ?? f.sede,
    })),
  };
}

// Marca cada fila con el motivo por el que no se puede crear (o null)
export function validarFilas(filas, usuariosExistentes) {
  const existentes = new Set(usuariosExistentes.map((u) => u.correo));
  const vistos = new Set();

  return filas.map((f) => {
    let error = null;
    if (f.nombre.length < 3) error = "Nombre muy corto";
    else if (!FORMATO_CORREO.test(f.correo)) error = "Correo inválido";
    else if (existentes.has(f.correo)) error = "Correo ya registrado";
    else if (vistos.has(f.correo)) error = "Correo repetido en el archivo";
    else if (!f.sede) error = "Falta la sede";
    else if (!SEDES.includes(f.sede)) error = "Sede no válida";
    vistos.add(f.correo);
    return { ...f, error };
  });
}

// Misma forma que un usuario creado desde el formulario de Usuarios
export const crearTecnico = ({ nombre, correo, sede }, clave, permisos) => ({
  id: crypto.randomUUID(),
  nombre,
  correo,
  clave,
  rol: ROLES.TECNICO,
  permisos,
  sede,
  activo: true,
});

// Genera y descarga un .xlsx de una hoja con las filas dadas
export const descargarXlsx = (filas, anchos, nombreHoja, nombreArchivo) =>
  descargarLibroXlsx([{ nombre: nombreHoja, filas, anchos }], nombreArchivo);

// Genera y descarga un .xlsx con varias hojas: [{ nombre, filas, anchos }]
export async function descargarLibroXlsx(hojas, nombreArchivo) {
  const XLSX = await cargarXlsx();
  const libro = XLSX.utils.book_new();
  for (const { nombre, filas, anchos } of hojas) {
    const hoja = XLSX.utils.aoa_to_sheet(filas);
    hoja["!cols"] = anchos.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(libro, hoja, nombre);
  }
  XLSX.writeFile(libro, nombreArchivo);
}

export const descargarPlantilla = () =>
  descargarXlsx(
    [
      ["Nombre", "Correo", "Sede"],
      ["Juan Pérez", "juan.perez@inacap.cl", SEDES[0]],
    ],
    [30, 34, 28],
    "Técnicos",
    "plantilla-tecnicos.xlsx",
  );
