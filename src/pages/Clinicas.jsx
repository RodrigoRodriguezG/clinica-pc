import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store.jsx";
import { normalizar } from "../lib/texto.js";
import { formatearFecha } from "../lib/fechas.js";
import { clinicaEsActiva } from "../lib/clinicas.js";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import {
  IconoCalendario,
  IconoChevronDerecha,
  IconoClinicas,
  IconoMas,
} from "../components/ui/iconos.jsx";

const FORMULARIO_VACIO = { nombre: "", sede: "", plantillaId: "" };

export default function Clinicas() {
  const { datos, actualizar } = useApp();

  // Se parte con la primera plantilla seleccionada
  const [form, setForm] = useState(() => ({
    ...FORMULARIO_VACIO,
    plantillaId: datos.plantillas[0]?.id ?? "",
  }));
  const [dias, setDias] = useState([]);
  const [dia, setDia] = useState("");
  const [filtro, setFiltro] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [error, setError] = useState("");

  // Actualiza un solo campo del formulario sin perder los demás
  const cambiar = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  const nombrePlantilla = (id) =>
    datos.plantillas.find((p) => p.id === id)?.nombre ?? "Sin plantilla";

  // Agrega una fecha a la lista, sin duplicados y ordenada
  const agregarDia = () => {
    if (!dia) return;
    setDias((prev) => (prev.includes(dia) ? prev : [...prev, dia].sort()));
    setDia("");
  };

  const quitarDia = (fecha) =>
    setDias((prev) => prev.filter((d) => d !== fecha));

  const crear = (e) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const sede = form.sede.trim();

    if (dias.length === 0)
      return setError("Agrega al menos un día para la clínica.");
    if (!form.plantillaId)
      return setError("Selecciona una plantilla de checklist.");
    if (
      datos.clinicas.some(
        (c) => c.nombre.trim().toLowerCase() === nombre.toLowerCase(),
      )
    )
      return setError("Ya existe una clínica con ese nombre.");

    setError("");
    const nueva = {
      id: crypto.randomUUID(),
      nombre,
      sede,
      dias, // ya viene ordenado
      plantillaId: form.plantillaId,
    };
    actualizar((d) => ({ ...d, clinicas: [...d.clinicas, nueva] }));

    // Limpiar el formulario
    setForm({
      ...FORMULARIO_VACIO,
      plantillaId: datos.plantillas[0]?.id ?? "",
    });
    setDias([]);
    setDia("");
  };

  // Filtro en vivo por nombre o sede, y por fecha
  const busqueda = normalizar(filtro.trim());
  const busquedaFecha = normalizar(filtroFecha.trim());

  const coincideFecha = (c) => {
    if (!busquedaFecha) return true;
    return c.dias.some(
      (fecha) =>
        normalizar(formatearFecha(fecha)).includes(busquedaFecha) ||
        normalizar(fecha).includes(busquedaFecha),
    );
  };

  const clinicasVisibles = datos.clinicas.filter((c) => {
    const coincideTexto =
      !busqueda ||
      normalizar(c.nombre).includes(busqueda) ||
      normalizar(c.sede).includes(busqueda);
    return coincideTexto && coincideFecha(c);
  });

  const hayFiltros = Boolean(filtro || filtroFecha);

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Clínicas"
        descripcion="Crea las jornadas de atención, define sus días y asigna la plantilla de checklist."
      />

      <Tarjeta className="p-4 sm:p-5">
        <form onSubmit={crear} className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-control bg-inacap-tenue text-inacap-oscuro"
            >
              <IconoClinicas className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold text-tinta">Nueva clínica</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Campo
              etiqueta="Nombre"
              placeholder="Nombre de la clínica"
              value={form.nombre}
              onChange={cambiar("nombre")}
              required
            />
            <Campo
              etiqueta="Sede"
              placeholder="Sede"
              value={form.sede}
              onChange={cambiar("sede")}
              required
            />
            <Campo
              as="select"
              etiqueta="Plantilla de checklist"
              value={form.plantillaId}
              onChange={cambiar("plantillaId")}
            >
              {datos.plantillas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Campo>
            <div className="flex items-end">
              <Boton type="submit" bloque>
                Crear clínica
              </Boton>
            </div>
          </div>

          <div className="rounded-control border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Campo
                etiqueta="Días de atención"
                type="date"
                className="sm:max-w-xs"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                aria-label="Día de la clínica"
              />
              <Boton type="button" variante="secundario" onClick={agregarDia}>
                <IconoMas className="h-4 w-4" />
                Agregar día
              </Boton>
            </div>

            {dias.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {dias.map((fecha) => (
                  <li
                    key={fecha}
                    className="flex min-h-11 items-center gap-1 rounded-control border border-neutral-200 bg-white py-1 pl-3 pr-1 text-sm"
                  >
                    <IconoCalendario
                      className="h-4 w-4 text-neutral-500"
                      aria-hidden="true"
                    />
                    {formatearFecha(fecha)}
                    <button
                      type="button"
                      onClick={() => quitarDia(fecha)}
                      aria-label={`Quitar ${fecha}`}
                      className="flex h-11 w-11 items-center justify-center rounded-control text-lg leading-none text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-error"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-neutral-500">
                Agrega al menos un día para poder crear la clínica.
              </p>
            )}
          </div>

          {error && (
            <Alerta variante="error" role="alert">
              {error}
            </Alerta>
          )}
        </form>
      </Tarjeta>

      <Tarjeta className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <Campo
            etiqueta="Buscar clínica"
            type="search"
            placeholder="Filtrar por nombre o sede"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            aria-label="Filtrar clínicas por nombre o sede"
            autoComplete="off"
          />
          <Campo
            etiqueta="Filtrar por día"
            type="search"
            placeholder="Ej. 09/10/2026"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            aria-label="Filtrar clínicas por día"
            autoComplete="off"
          />
          {hayFiltros && (
            <Boton
              variante="enlace"
              onClick={() => {
                setFiltro("");
                setFiltroFecha("");
              }}
            >
              Limpiar filtros
            </Boton>
          )}
        </div>
      </Tarjeta>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-700">
          Clínicas registradas
        </h2>
        <p className="text-sm text-neutral-600" aria-live="polite">
          {clinicasVisibles.length}{" "}
          {clinicasVisibles.length === 1 ? "clínica" : "clínicas"}
        </p>
      </div>

      {clinicasVisibles.length === 0 ? (
        <EstadoVacio
          icono={<IconoClinicas className="h-6 w-6" />}
          titulo="No hay clínicas que coincidan"
          descripcion={
            hayFiltros
              ? "Prueba con otro nombre, sede o día."
              : "Crea la primera clínica para comenzar a recibir equipos."
          }
          accion={
            hayFiltros ? (
              <Boton
                variante="secundario"
                onClick={() => {
                  setFiltro("");
                  setFiltroFecha("");
                }}
              >
                Limpiar filtros
              </Boton>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-3">
          {clinicasVisibles.map((c) => (
            <li key={c.id}>
              <Tarjeta
                as={Link}
                to={`/clinicas/${c.id}`}
                interactiva
                className="group block p-4 hover:border-inacap/40 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-tinta">
                        {c.nombre}
                      </h2>
                      {clinicaEsActiva(c) && (
                        <Insignia tono="exito">Clínica activa</Insignia>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-neutral-600">
                      {c.sede} · Plantilla: {nombrePlantilla(c.plantillaId)}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-inacap">
                    Ver detalle
                    <IconoChevronDerecha className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.dias.length > 0 ? (
                    c.dias.map((fecha) => (
                      <Insignia key={fecha} tono="neutral" punto={false}>
                        <IconoCalendario className="h-3.5 w-3.5" />
                        {formatearFecha(fecha)}
                      </Insignia>
                    ))
                  ) : (
                    <span className="text-sm text-neutral-500">
                      Sin días definidos
                    </span>
                  )}
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
