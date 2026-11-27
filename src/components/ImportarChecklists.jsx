import { useRef, useState } from "react";
import { useApp } from "../store.jsx";
import {
  agruparPlantillas,
  descargarPlantillaChecklist,
  leerFilasChecklist,
  validarFilasChecklist,
} from "../lib/importacionChecklists.js";
import { normalizar } from "../lib/texto.js";
import Alerta from "./ui/Alerta.jsx";
import Boton from "./ui/Boton.jsx";
import Campo from "./ui/Campo.jsx";
import Insignia from "./ui/Insignia.jsx";
import Paso from "./ui/Paso.jsx";
import PanelCreacion, { PieAcciones } from "./ui/PanelCreacion.jsx";
import { IconoDocumento } from "./ui/iconos.jsx";

// Importación masiva de plantillas de checklist desde un Excel con columnas
// Plantilla e Ítem. Las plantillas se crean en la clínica elegida
export default function ImportarChecklists({ clinica, onCerrar }) {
  const { datos, actualizar } = useApp();
  const deLaClinica = (plantillas) =>
    plantillas.filter((p) => p.clinicaId === clinica.id);
  const inputArchivo = useRef(null);
  const [filas, setFilas] = useState(null); // vista previa validada
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [leyendo, setLeyendo] = useState(false);

  const validas = filas?.filter((f) => !f.error) ?? [];
  const conError = (filas?.length ?? 0) - validas.length;
  const nuevas = agruparPlantillas(validas);
  const puedeCrear = nuevas.length > 0;

  const limpiar = () => {
    setFilas(null);
    setNombreArchivo("");
    if (inputArchivo.current) inputArchivo.current.value = "";
  };

  const elegirArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    setError("");
    setExito("");
    setFilas(null);
    if (!archivo) return;

    setLeyendo(true);
    const resultado = await leerFilasChecklist(archivo);
    setLeyendo(false);

    if (resultado.error) {
      setError(resultado.error);
      e.target.value = "";
      return;
    }
    if (resultado.filas.length === 0) {
      setError("El archivo no tiene filas con datos.");
      e.target.value = "";
      return;
    }
    setNombreArchivo(archivo.name);
    setFilas(validarFilasChecklist(resultado.filas, deLaClinica(datos.plantillas)));
  };

  const crear = () => {
    if (!puedeCrear) return;
    // Se vuelve a comprobar contra los datos actuales antes de crear
    const sinRepetir = (plantillas, lista) => {
      const existentes = new Set(plantillas.map((p) => normalizar(p.nombre).trim()));
      return lista.filter((p) => !existentes.has(normalizar(p.nombre).trim()));
    };
    const creadas = sinRepetir(deLaClinica(datos.plantillas), nuevas).map(
      (p) => ({ ...p, clinicaId: clinica.id }),
    );
    actualizar((d) => ({
      ...d,
      plantillas: [
        ...d.plantillas,
        ...sinRepetir(deLaClinica(d.plantillas), creadas),
      ],
    }));
    setExito(
      creadas.length === 1
        ? "Se creó 1 plantilla. Ya la pueden elegir los técnicos."
        : `Se crearon ${creadas.length} plantillas. Ya las pueden elegir los técnicos.`,
    );
    limpiar();
  };

  return (
    <PanelCreacion
      titulo="Importar checklists desde Excel"
      descripcion={`Crea varias plantillas a la vez en ${clinica.nombre}.`}
      icono={<IconoDocumento className="h-5 w-5" />}
      onCerrar={onCerrar}
    >
      <Paso
        numero={1}
        titulo="Prepara el archivo"
        ayuda="Usa la plantilla: columnas Plantilla e Ítem, una fila por ítem. Las filas con el mismo nombre de plantilla se agrupan."
      >
        <Boton
          type="button"
          variante="secundario"
          onClick={descargarPlantillaChecklist}
          className="pl-4.5"
        >
          <IconoDocumento className="h-4 w-4" />
          Descargar plantilla
        </Boton>
      </Paso>

      <Paso
        numero={2}
        titulo="Sube el archivo"
        ayuda="Formatos .xlsx, .xls o .csv. Se lee la primera hoja."
      >
        <Campo
          etiqueta="Archivo"
          type="file"
          accept=".xlsx,.xls,.csv"
          ref={inputArchivo}
          onChange={elegirArchivo}
          disabled={leyendo}
          className="sm:max-w-md"
          classNameControl="file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-900"
        />

        {error && (
          <Alerta variante="error" role="alert" className="mt-4">
            {error}
          </Alerta>
        )}
        {exito && (
          <Alerta variante="exito" role="status" className="mt-4">
            {exito}
          </Alerta>
        )}
      </Paso>

      <Paso
        numero={3}
        titulo="Revisa y crea"
        ayuda="Las filas con errores se omiten."
      >
        {!filas ? (
          <p className="text-sm text-slate-500">
            Aquí verás la vista previa cuando subas un archivo.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-700" aria-live="polite">
              <span className="font-semibold">{nombreArchivo}</span>:{" "}
              {nuevas.length} plantillas con {validas.length} ítems listos para
              crear
              {conError > 0 && `, ${conError} filas con errores (se omitirán)`}.
            </p>

            <div className="max-h-80 overflow-auto overscroll-contain rounded-control border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Fila</th>
                    <th className="px-3 py-2 font-semibold">Plantilla</th>
                    <th className="px-3 py-2 font-semibold">Ítem</th>
                    <th className="px-3 py-2 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filas.map((f) => (
                    <tr key={f.fila}>
                      <td className="px-3 py-2 tabular-nums text-slate-500">
                        {f.fila}
                      </td>
                      <td className="px-3 py-2 text-slate-900">
                        {f.plantilla || "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{f.item || "—"}</td>
                      <td className="px-3 py-2">
                        <Insignia tono={f.error ? "error" : "exito"}>
                          {f.error ?? "Listo"}
                        </Insignia>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Paso>

      {filas && (
        <PieAcciones>
          <Boton type="button" variante="secundario" onClick={limpiar}>
            Descartar archivo
          </Boton>
          <Boton type="button" onClick={crear} disabled={!puedeCrear}>
            Crear {nuevas.length} plantillas
          </Boton>
        </PieAcciones>
      )}
    </PanelCreacion>
  );
}
