import { ROLES } from "../constantes.js";
import { normalizar } from "./texto.js";

// Encabezados aceptados (ya normalizados: sin tildes ni mayúsculas)
const ALIAS_NOMBRE = ["nombre", "nombre completo", "nombres"];
const ALIAS_CORREO = ["correo", "email", "e-mail", "correo electronico", "mail"];

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// SheetJS se carga solo cuando se usa, para no agrandar la carga inicial
const cargarXlsx = () => import("xlsx");

const buscarColumna = (encabezados, alias) =>
  encabezados.find((e) => alias.includes(normalizar(e).trim()));

// Lee la primera hoja del archivo. Devuelve { filas } o { error }
export async function leerFilasExcel(archivo) {
  try {
    const XLSX = await cargarXlsx();
    const libro = XLSX.read(await archivo.arrayBuffer());
    const hoja = libro.Sheets[libro.SheetNames[0]];
    if (!hoja) return { error: "El archivo no tiene hojas con datos." };

    const tabla = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: "" });
    const encabezados = (tabla[0] ?? []).map((e) => String(e));
    const colNombre = buscarColumna(encabezados, ALIAS_NOMBRE);
    const colCorreo = buscarColumna(encabezados, ALIAS_CORREO);

    if (!colNombre || !colCorreo)
      return {
        error:
          'No se encontraron las columnas "Nombre" y "Correo" en la primera fila. Usa la plantilla.',
      };

    const iNombre = encabezados.indexOf(colNombre);
    const iCorreo = encabezados.indexOf(colCorreo);
    const filas = tabla.slice(1).map((celdas, i) => ({
      fila: i + 2, // número de fila tal como se ve en Excel
      nombre: String(celdas[iNombre] ?? "").trim(),
      correo: String(celdas[iCorreo] ?? "")
        .trim()
        .toLowerCase(),
    }));
    return { filas: filas.filter((f) => f.nombre || f.correo) };
  } catch {
    return {
      error: "No se pudo leer el archivo. Verifica que sea un Excel o CSV válido.",
    };
  }
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
    vistos.add(f.correo);
    return { ...f, error };
  });
}

// Misma forma que un usuario creado desde el formulario de Usuarios
export const crearTecnico = ({ nombre, correo }, clave, permisos) => ({
  id: crypto.randomUUID(),
  nombre,
  correo,
  clave,
  rol: ROLES.TECNICO,
  permisos,
  activo: true,
});

export async function descargarPlantilla() {
  const XLSX = await cargarXlsx();
  const hoja = XLSX.utils.aoa_to_sheet([
    ["Nombre", "Correo"],
    ["Juan Pérez", "juan.perez@inacap.cl"],
  ]);
  hoja["!cols"] = [{ wch: 30 }, { wch: 34 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Técnicos");
  XLSX.writeFile(libro, "plantilla-tecnicos.xlsx");
}
