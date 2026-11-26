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
import Seccion from "../components/ui/Seccion.jsx";
import BarraFiltros from "../components/ui/BarraFiltros.jsx";
import Paso from "../components/ui/Paso.jsx";
import PanelCreacion, {
  PieAcciones,
} from "../components/ui/PanelCreacion.jsx";
import {
  IconoCalendario,
  IconoCerrar,
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
  // Solo visual: si el panel de creación está desplegado
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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
    setMostrarFormulario(false);
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

  const limpiarFiltros = () => {
    setFiltro("");
    setFiltroFecha("");
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setError("");
  };

  const botonNueva = (
    <Boton onClick={() => setMostrarFormulario(true)} className="pl-3.5">
      <IconoMas className="h-4 w-4" />
      Nueva clínica
    </Boton>
  );

  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Clínicas"
        descripcion="Crea las jornadas de atención, define sus días y asigna la plantilla de checklist."
        acciones={!mostrarFormulario && botonNueva}
      />

      {mostrarFormulario && (
        <PanelCreacion
          titulo="Nueva clínica"
          descripcion="Completa los tres pasos. El personal se asigna después, desde el detalle de la clínica."
          icono={<IconoClinicas className="h-5 w-5" />}
          onCerrar={cerrarFormulario}
        >
          <form onSubmit={crear}>
            <Paso
              numero={1}
              titulo="Datos de la clínica"
              ayuda="Cómo se identificará en el sistema."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  etiqueta="Nombre"
                  placeholder="Ej. Clínica PC 2026"
                  value={form.nombre}
                  onChange={cambiar("nombre")}
                  required
                />
                <Campo
                  etiqueta="Sede"
                  placeholder="Ej. Santiago Centro"
                  value={form.sede}
                  onChange={cambiar("sede")}
                  required
                />
              </div>
            </Paso>

            <Paso
              numero={2}
              titulo="Días de atención"
              ayuda="Agrega cada día en que se recibirán equipos. Se necesita al menos uno."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Campo
                  etiqueta="Fecha"
                  type="date"
                  className="sm:w-56"
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                  aria-label="Día de la clínica"
                />
                <Boton
                  type="button"
                  variante="secundario"
                  onClick={agregarDia}
                  disabled={!dia}
                  className="pl-3.5"
                >
                  <IconoMas className="h-4 w-4" />
                  Agregar día
                </Boton>
              </div>

              {dias.length > 0 ? (
                <ul
                  aria-label="Días agregados"
                  className="mt-4 flex flex-wrap gap-2"
                >
                  {dias.map((fecha) => (
                    <li
                      key={fecha}
                      className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 py-0.5 pl-3 pr-0.5 text-sm font-medium text-tinta"
                    >
                      <IconoCalendario className="h-4 w-4 text-neutral-500" />
                      {formatearFecha(fecha)}
                      <button
                        type="button"
                        onClick={() => quitarDia(fecha)}
                        aria-label={`Quitar ${formatearFecha(fecha)}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors duration-150 hover:bg-neutral-200 hover:text-error"
                      >
                        <IconoCerrar className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">
                  Aún no agregas días.
                </p>
              )}
            </Paso>

            <Paso
              numero={3}
              titulo="Checklist"
              ayuda="La plantilla que completarán los técnicos al revisar cada equipo."
            >
              <Campo
                as="select"
                etiqueta="Plantilla de checklist"
                className="sm:max-w-sm"
                value={form.plantillaId}
                onChange={cambiar("plantillaId")}
              >
                {datos.plantillas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </Campo>
            </Paso>

            {error && (
              <Alerta variante="error" role="alert" className="mt-5">
                {error}
              </Alerta>
            )}

            <PieAcciones>
              <Boton variante="secundario" onClick={cerrarFormulario}>
                Cancelar
              </Boton>
              <Boton type="submit">Crear clínica</Boton>
            </PieAcciones>
          </form>
        </PanelCreacion>
      )}

      <Seccion
        titulo="Clínicas registradas"
        contador={
          hayFiltros
            ? `${clinicasVisibles.length} de ${datos.clinicas.length}`
            : clinicasVisibles.length
        }
      >
        <BarraFiltros hayFiltros={hayFiltros} onLimpiar={limpiarFiltros}>
          <Campo
            etiqueta="Buscar clínica"
            type="search"
            placeholder="Nombre o sede"
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
        </BarraFiltros>

        {clinicasVisibles.length === 0 ? (
          <EstadoVacio
            icono={<IconoClinicas className="h-6 w-6" />}
            titulo={
              hayFiltros ? "No hay clínicas que coincidan" : "Aún no hay clínicas"
            }
            descripcion={
              hayFiltros
                ? "Prueba con otro nombre, sede o día."
                : "Crea la primera clínica para comenzar a recibir equipos."
            }
            accion={
              hayFiltros ? (
                <Boton variante="secundario" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Boton>
              ) : (
                !mostrarFormulario && botonNueva
              )
            }
          />
        ) : (
          <ul className="grid gap-3">
            {clinicasVisibles.map((c) => (
              <li key={c.id}>
                <Tarjeta
                  as={Link}
                  to={`/clinicas/${c.id}`}
                  interactiva
                  className="group block"
                >
                  <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-control bg-neutral-100 text-neutral-600 sm:flex"
                      >
                        <IconoClinicas className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-tinta">
                            {c.nombre}
                          </h3>
                          {clinicaEsActiva(c) && (
                            <Insignia tono="exito">Clínica activa</Insignia>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-neutral-600">
                          {c.sede}
                          <span
                            aria-hidden="true"
                            className="px-1.5 text-neutral-300"
                          >
                            |
                          </span>
                          Plantilla: {nombrePlantilla(c.plantillaId)}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex min-h-10 shrink-0 items-center gap-1 text-sm font-semibold text-inacap">
                      <span className="hidden sm:inline">Ver detalle</span>
                      <IconoChevronDerecha className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" />
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 border-t border-neutral-100 px-4 py-3 sm:px-5">
                    <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Días
                    </span>
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
      </Seccion>
    </div>
  );
}
