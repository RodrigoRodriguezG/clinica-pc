import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store.jsx";
import { normalizar } from "../lib/texto.js";
import { formatearFecha, hoyLocal, mananaLocal } from "../lib/fechas.js";
import { clinicaEsActiva } from "../lib/clinicas.js";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import TarjetaEnlace from "../components/ui/TarjetaEnlace.jsx";
import Seccion from "../components/ui/Seccion.jsx";
import BarraFiltros from "../components/ui/BarraFiltros.jsx";
import Paso from "../components/ui/Paso.jsx";
import PanelCreacion, {
  PieAcciones,
} from "../components/ui/PanelCreacion.jsx";
import {
  IconoCalendario,
  IconoCerrar,
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
  // Por defecto se propone el día siguiente
  const [dia, setDia] = useState(mananaLocal);
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
    // min en el input no impide escribir una fecha pasada a mano
    if (dia < hoyLocal())
      return setError("No puedes agregar una fecha anterior a hoy.");
    setError("");
    setDias((prev) => (prev.includes(dia) ? prev : [...prev, dia].sort()));
    setDia(mananaLocal());
  };

  const quitarDia = (fecha) =>
    setDias((prev) => prev.filter((d) => d !== fecha));

  const crear = (e) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const sede = form.sede.trim();

    if (dias.length === 0)
      return setError("Agrega al menos un día para la clínica.");
    // Por si el formulario quedó abierto de un día para otro
    if (dias.some((d) => d < hoyLocal()))
      return setError(
        "Hay días anteriores a hoy; quítalos antes de crear la clínica.",
      );
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
    setDia(mananaLocal());
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
    <Boton onClick={() => setMostrarFormulario(true)} className="pl-4.5">
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
                  min={hoyLocal()}
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                  aria-label="Día de la clínica"
                />
                <Boton
                  type="button"
                  variante="contorno"
                  onClick={agregarDia}
                  disabled={!dia}
                  className="pl-4.5"
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
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-3 pr-0.5 text-sm font-medium text-slate-900"
                    >
                      <IconoCalendario className="h-4 w-4 text-slate-500" />
                      {formatearFecha(fecha)}
                      <button
                        type="button"
                        onClick={() => quitarDia(fecha)}
                        aria-label={`Quitar ${formatearFecha(fecha)}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-slate-200 hover:text-error"
                      >
                        <IconoCerrar className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
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
                <TarjetaEnlace
                  as={Link}
                  to={`/clinicas/${c.id}`}
                  icono={<IconoClinicas className="h-5 w-5" />}
                  eyebrow={c.sede}
                  insignia={
                    clinicaEsActiva(c) ? (
                      <Insignia tono="exito">Activa</Insignia>
                    ) : (
                      <Insignia tono="neutral">Inactiva</Insignia>
                    )
                  }
                  titulo={c.nombre}
                  pie={
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="sr-only">Días:</span>
                      {c.dias.length > 0 ? (
                        c.dias.map((fecha) => (
                          <Insignia key={fecha} tono="blanco" punto={false}>
                            <IconoCalendario className="h-3.5 w-3.5" />
                            {formatearFecha(fecha)}
                          </Insignia>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">
                          Sin días definidos
                        </span>
                      )}
                    </span>
                  }
                >
                  Plantilla: {nombrePlantilla(c.plantillaId)}
                </TarjetaEnlace>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </div>
  );
}
