import { useRef, useState } from "react";
import { useApp } from "../store.jsx";
import {
  crearTecnico,
  descargarPlantilla,
  leerFilasExcel,
  validarFilas,
} from "../lib/importacion.js";
import Alerta from "./ui/Alerta.jsx";
import Boton from "./ui/Boton.jsx";
import Campo from "./ui/Campo.jsx";
import Insignia from "./ui/Insignia.jsx";
import Tarjeta from "./ui/Tarjeta.jsx";
import { IconoDocumento } from "./ui/iconos.jsx";

// Importación masiva de técnicos desde un Excel con columnas Nombre y Correo
export default function ImportarUsuarios() {
  const { datos, actualizar } = useApp();
  const inputArchivo = useRef(null);
  const [filas, setFilas] = useState(null); // vista previa validada
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [leyendo, setLeyendo] = useState(false);

  const validas = filas?.filter((f) => !f.error) ?? [];
  const conError = (filas?.length ?? 0) - validas.length;
  const puedeCrear = validas.length > 0 && clave.length >= 8;

  const limpiar = () => {
    setFilas(null);
    setNombreArchivo("");
    setClave("");
    if (inputArchivo.current) inputArchivo.current.value = "";
  };

  const elegirArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    setError("");
    setExito("");
    setFilas(null);
    if (!archivo) return;

    setLeyendo(true);
    const resultado = await leerFilasExcel(archivo);
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
    setFilas(validarFilas(resultado.filas, datos.usuarios));
  };

  const crear = () => {
    if (!puedeCrear) return;
    // Se vuelve a comprobar contra los datos actuales antes de crear
    const sinRepetir = (usuarios, lista) => {
      const existentes = new Set(usuarios.map((u) => u.correo));
      return lista.filter((f) => !existentes.has(f.correo));
    };
    const nuevos = sinRepetir(datos.usuarios, validas).map((f) =>
      crearTecnico(f, clave),
    );
    actualizar((d) => ({
      ...d,
      usuarios: [...d.usuarios, ...sinRepetir(d.usuarios, nuevos)],
    }));
    setExito(
      `Se crearon ${nuevos.length} técnicos. Comunícales su correo y la contraseña inicial para que ingresen.`,
    );
    limpiar();
  };

  return (
    <Tarjeta className="p-4 sm:p-5">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-control bg-inacap-tenue text-inacap-oscuro"
            >
              <IconoDocumento className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-tinta">
                Importar técnicos desde Excel
              </h2>
              <p className="text-sm text-neutral-600">
                Columnas: Nombre y Correo. Todos se crean como técnicos.
              </p>
            </div>
          </div>
          <Boton
            type="button"
            variante="secundario"
            onClick={descargarPlantilla}
          >
            Descargar plantilla
          </Boton>
        </div>

        <Campo
          etiqueta="Archivo"
          type="file"
          accept=".xlsx,.xls,.csv"
          ref={inputArchivo}
          onChange={elegirArchivo}
          disabled={leyendo}
          ayuda="Formatos .xlsx, .xls o .csv. Se lee la primera hoja."
          classNameControl="file:mr-3 file:rounded-control file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-tinta"
        />

        {error && (
          <Alerta variante="error" role="alert">
            {error}
          </Alerta>
        )}
        {exito && (
          <Alerta variante="exito" role="status">
            {exito}
          </Alerta>
        )}

        {filas && (
          <div className="space-y-4 border-t border-neutral-200 pt-4">
            <p className="text-sm text-neutral-700" aria-live="polite">
              <span className="font-semibold">{nombreArchivo}</span>:{" "}
              {validas.length} listos para crear
              {conError > 0 && `, ${conError} con errores (se omitirán)`}.
            </p>

            <div className="max-h-80 overflow-auto rounded-control border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Fila</th>
                    <th className="px-3 py-2 font-semibold">Nombre</th>
                    <th className="px-3 py-2 font-semibold">Correo</th>
                    <th className="px-3 py-2 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filas.map((f) => (
                    <tr key={f.fila}>
                      <td className="px-3 py-2 text-neutral-500">{f.fila}</td>
                      <td className="px-3 py-2 text-tinta">{f.nombre || "—"}</td>
                      <td className="break-all px-3 py-2 text-neutral-700">
                        {f.correo || "—"}
                      </td>
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

            <Campo
              etiqueta="Contraseña inicial para todos"
              type="password"
              className="sm:max-w-sm"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="new-password"
              maxLength={100}
              ayuda="Mínimo 8 caracteres. Se aplica a todos los técnicos importados."
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Boton type="button" variante="secundario" onClick={limpiar}>
                Cancelar
              </Boton>
              <Boton type="button" onClick={crear} disabled={!puedeCrear}>
                Crear {validas.length} técnicos
              </Boton>
            </div>
          </div>
        )}
      </div>
    </Tarjeta>
  );
}
