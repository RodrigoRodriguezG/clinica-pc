import { ESTADO_CIERRE_ANTICIPADO, ESTADO_ENTREGADO } from "../constantes.js";
import { notaPromedio, porcentaje, respuestaDeFicha } from "./encuestas.js";
import { fechaLocal, formatearFecha } from "./fechas.js";
import { descargarLibroXlsx } from "./importacion.js";
import { nombreClinica } from "./clinicas.js";

// Informes de equipos (RF-14). Una fila por ficha (atención), con los datos
// del equipo. Solo se usa la comuna del propietario: los reportes no incluyen
// RUT, nombre ni contacto (minimización de datos).

const SIN_DATO = "Sin dato";

// Dimensiones por las que se agrupan los conteos
export const DIMENSIONES = [
  { campo: "marca", titulo: "Por marca" },
  { campo: "tipo", titulo: "Por tipo de equipo" },
  { campo: "servicio", titulo: "Por servicio" },
  { campo: "estado", titulo: "Por estado" },
  { campo: "comuna", titulo: "Por comuna del propietario" },
];

// idsClinicas: las clínicas que el usuario puede ver (y el filtro elegido)
export function filasReporte(datos, idsClinicas) {
  return datos.fichas
    .filter((f) => idsClinicas.includes(f.clinicaId))
    .map((f) => {
      const equipo = datos.equipos.find((e) => e.id === f.equipoId);
      const propietario = datos.propietarios.find(
        (p) => p.id === equipo?.propietarioId,
      );
      const clinica = datos.clinicas.find((c) => c.id === f.clinicaId);
      const respuesta = respuestaDeFicha(datos, f.id);
      return {
        ficha: f.numero,
        clinica: clinica ? nombreClinica(clinica) : SIN_DATO,
        fecha: formatearFecha(fechaLocal(f.creada)),
        numeroEquipo: equipo?.numeroEquipo ?? "",
        tipo: equipo?.tipo || SIN_DATO,
        marca: equipo?.marca?.trim() || SIN_DATO,
        modelo: equipo?.modelo ?? "",
        numeroSerie: equipo?.numeroSerie ?? "",
        servicio: f.servicio || SIN_DATO,
        estado: f.estado,
        comuna: propietario?.comuna || SIN_DATO,
        tecnicos: f.tecnicosIds
          .map((id) => datos.usuarios.find((u) => u.id === id)?.nombre)
          .filter(Boolean)
          .join(", "),
        nota: respuesta?.nota ?? null,
        conforme: respuesta ? respuesta.conforme : null,
      };
    });
}

// [{ valor, cantidad }] de mayor a menor; "Sin dato" siempre al final
export function contarPor(filas, campo) {
  const cuenta = new Map();
  for (const fila of filas)
    cuenta.set(fila[campo], (cuenta.get(fila[campo]) ?? 0) + 1);
  return [...cuenta]
    .map(([valor, cantidad]) => ({ valor, cantidad }))
    .sort(
      (a, b) =>
        (a.valor === SIN_DATO) - (b.valor === SIN_DATO) ||
        b.cantidad - a.cantidad ||
        a.valor.localeCompare(b.valor, "es"),
    );
}

export function resumen(filas) {
  const entregadas = filas.filter((f) => f.estado === ESTADO_ENTREGADO);
  const respondidas = filas.filter((f) => f.nota !== null);
  return {
    total: filas.length,
    entregadas: entregadas.length,
    cierreAnticipado: filas.filter((f) => f.estado === ESTADO_CIERRE_ANTICIPADO)
      .length,
    respuestas: respondidas.length,
    tasaRespuesta: porcentaje(respondidas.length, entregadas.length),
    notaPromedio: notaPromedio(respondidas),
    conformes: porcentaje(
      respondidas.filter((f) => f.conforme).length,
      respondidas.length,
    ),
  };
}

const COLUMNAS_DETALLE = [
  ["Ficha", "ficha", 10],
  ["Clínica", "clinica", 38],
  ["Fecha", "fecha", 12],
  ["N° equipo", "numeroEquipo", 11],
  ["Tipo", "tipo", 20],
  ["Marca", "marca", 14],
  ["Modelo", "modelo", 18],
  ["N° de serie", "numeroSerie", 16],
  ["Servicio", "servicio", 18],
  ["Estado", "estado", 18],
  ["Comuna", "comuna", 20],
  ["Técnicos", "tecnicos", 34],
  ["Nota encuesta", "nota", 14],
];

export function exportarReporte(filas, etiquetaClinica) {
  const r = resumen(filas);
  const filasResumen = [
    ["Reporte de equipos · Clínica del PC"],
    ["Clínica", etiquetaClinica],
    ["Generado", new Date().toLocaleString("es-CL")],
    [],
    ["Fichas", r.total],
    ["Entregadas", r.entregadas],
    ["Cierre anticipado", r.cierreAnticipado],
    ["Encuestas respondidas", r.respuestas],
    ["Nota promedio", r.notaPromedio ?? "—"],
  ];
  for (const { campo, titulo } of DIMENSIONES) {
    filasResumen.push([], [titulo, "Cantidad"]);
    for (const { valor, cantidad } of contarPor(filas, campo))
      filasResumen.push([valor, cantidad]);
  }

  return descargarLibroXlsx(
    [
      { nombre: "Resumen", filas: filasResumen, anchos: [32, 40] },
      {
        nombre: "Detalle",
        filas: [
          COLUMNAS_DETALLE.map(([t]) => t),
          ...filas.map((f) => COLUMNAS_DETALLE.map(([, c]) => f[c] ?? "")),
        ],
        anchos: COLUMNAS_DETALLE.map(([, , a]) => a),
      },
    ],
    `reporte-clinica-pc-${new Date().toLocaleDateString("en-CA")}.xlsx`,
  );
}
