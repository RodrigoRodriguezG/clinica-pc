import { useRef, useState } from "react";
import { useApp } from "../store.jsx";
import { ROLES } from "../constantes.js";
import { permisosDeRol } from "../lib/roles.js";
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
import Paso from "./ui/Paso.jsx";
import PanelCreacion, { PieAcciones } from "./ui/PanelCreacion.jsx";
import { IconoDocumento } from "./ui/iconos.jsx";

// Importación masiva de técnicos desde un Excel con columnas Nombre y Correo
export default function ImportarUsuarios({ onCerrar }) {
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
  // Los roles se pueden eliminar: sin el rol Técnico no hay con qué crear las cuentas
  const hayRolTecnico = datos.roles.some((r) => r.id === ROLES.TECNICO);
  const puedeCrear = hayRolTecnico && validas.length > 0 && clave.length >= 8;

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
      crearTecnico(f, clave, permisosDeRol(datos, ROLES.TECNICO)),
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
    <PanelCreacion
      titulo="Importar técnicos desde Excel"
      descripcion="Crea muchas cuentas a la vez. Todas se crean con el rol de técnico."
      icono={<IconoDocumento className="h-5 w-5" />}
      onCerrar={onCerrar}
    >
      <Paso
        numero={1}
        titulo="Prepara el archivo"
        ayuda="Usa la plantilla: columnas Nombre y Correo."
      >
        <Boton
          type="button"
          variante="secundario"
          onClick={descargarPlantilla}
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
              {validas.length} listos para crear
              {conError > 0 && `, ${conError} con errores (se omitirán)`}.
            </p>

            <div className="max-h-80 overflow-auto overscroll-contain rounded-control border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Fila</th>
                    <th className="px-3 py-2 font-semibold">Nombre</th>
                    <th className="px-3 py-2 font-semibold">Correo</th>
                    <th className="px-3 py-2 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filas.map((f) => (
                    <tr key={f.fila}>
                      <td className="px-3 py-2 tabular-nums text-slate-500">
                        {f.fila}
                      </td>
                      <td className="px-3 py-2 text-slate-900">{f.nombre || "—"}</td>
                      <td className="break-all px-3 py-2 text-slate-700">
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
          </div>
        )}
      </Paso>

      {filas && !hayRolTecnico && (
        <Alerta variante="aviso" role="alert" className="mt-5">
          El rol Técnico fue eliminado, así que no se pueden importar técnicos.
          Créalo de nuevo en Roles o crea las cuentas una por una.
        </Alerta>
      )}

      {filas && (
        <PieAcciones>
          <Boton type="button" variante="secundario" onClick={limpiar}>
            Descartar archivo
          </Boton>
          <Boton type="button" onClick={crear} disabled={!puedeCrear}>
            Crear {validas.length} técnicos
          </Boton>
        </PieAcciones>
      )}
    </PanelCreacion>
  );
}
