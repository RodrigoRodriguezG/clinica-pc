import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store.jsx";
import { normalizar } from "../lib/texto.js";
import { formatearFecha, hoyLocal, mananaLocal } from "../lib/fechas.js";
import { clinicaEsActiva, nombreClinica } from "../lib/clinicas.js";
import { plantillasBaseDe, SEDES } from "../constantes.js";
import {
  alcanceTodas,
  clinicasPermitidas,
  motivoSinClinicas,
} from "../lib/sedes.js";
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

const FORMULARIO_VACIO = { nombre: "", sede: "" };

export default function Clinicas() {
  const { datos, actualizar, usuario } = useApp();

  // Con el permiso de todas las sedes se elige cualquier sede; con el de su
  // sede, la clínica queda en la sede del usuario
  const todas = alcanceTodas(usuario, "clinicas");
  const sedesPermitidas = todas ? SEDES : usuario.sede ? [usuario.sede] : [];
  const clinicas = clinicasPermitidas(datos, usuario, "clinicas");

  const [form, setForm] = useState(() => ({
    ...FORMULARIO_VACIO,
    sede: sedesPermitidas[0] ?? "",
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

  const fichasDe = (id) =>
    datos.fichas.filter((f) => f.clinicaId === id).length;

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
    const sede = form.sede;

    if (!sedesPermitidas.includes(sede))
      return setError("Elige una sede válida.");
    if (dias.length === 0)
      return setError("Agrega al menos un día para la clínica.");
    // Por si el formulario quedó abierto de un día para otro
    if (dias.some((d) => d < hoyLocal()))
      return setError(
        "Hay días anteriores a hoy; quítalos antes de crear la clínica.",
      );
    if (
      datos.clinicas.some(
        (c) =>
          c.sede === sede &&
          c.nombre.trim().toLowerCase() === nombre.toLowerCase(),
      )
    )
      return setError("Ya existe una clínica con ese nombre en esta sede.");

    setError("");
    const nueva = {
      id: crypto.randomUUID(),
      nombre,
      sede,
      dias, // ya viene ordenado
    };
    // La clínica parte con su propia copia de los 3 checklists de servicio
    actualizar((d) => ({
      ...d,
      clinicas: [...d.clinicas, nueva],
      plantillas: [...d.plantillas, ...plantillasBaseDe(nueva.id)],
    }));

    // Limpiar el formulario
    setForm({ ...FORMULARIO_VACIO, sede: sedesPermitidas[0] ?? "" });
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

  const clinicasVisibles = clinicas.filter((c) => {
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

  const botonNueva = sedesPermitidas.length > 0 && (
    <Boton onClick={() => setMostrarFormulario(true)} className="pl-4.5">
      <IconoMas className="h-4 w-4" />
      Nueva clínica
    </Boton>
  );

  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Clínicas"
        descripcion="Jornadas de atención de cada sede y sus días."
        acciones={!mostrarFormulario && botonNueva}
      />

      {mostrarFormulario && (
        <PanelCreacion
          titulo="Nueva clínica"
          descripcion="Completa los dos pasos. El personal se asigna después, desde el detalle de la clínica."
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
                  as="select"
                  etiqueta="Sede"
                  value={form.sede}
                  onChange={cambiar("sede")}
                  disabled={!todas}
                  ayuda={
                    todas ? undefined : "Solo puedes crear clínicas de tu sede."
                  }
                >
                  {sedesPermitidas.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Campo>
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
            ? `${clinicasVisibles.length} de ${clinicas.length}`
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
                : sedesPermitidas.length === 0
                  ? motivoSinClinicas(usuario, "clinicas")
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
                  titulo={nombreClinica(c)}
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
                  {fichasDe(c.id)} ficha(s) registradas
                </TarjetaEnlace>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </div>
  );
}
