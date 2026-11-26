import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../store.jsx";
import { PERMISOS } from "../constantes.js";
import { nombreRol } from "../lib/roles.js";
import { puede } from "../lib/permisos.js";
import { normalizar, nombreCompleto } from "../lib/texto.js";
import { formatearFecha } from "../lib/fechas.js";
import { limpiarRut, enmascararRut } from "../lib/rut.js";
import { clinicaEsActiva } from "../lib/clinicas.js";
import AjustesClinica from "../components/AjustesClinica.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import PestanasNav from "../components/ui/PestanasNav.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import {
  IconoCalendario,
  IconoChecklist,
  IconoClinicas,
  IconoFlechaIzquierda,
  IconoMonitor,
  IconoUsuarios,
} from "../components/ui/iconos.jsx";

// Input de filtro reutilizable para las tres listas
function Filtro({ valor, onChange, placeholder, ariaLabel }) {
  return (
    <Campo
      etiqueta={ariaLabel}
      type="search"
      className="sm:max-w-md"
      placeholder={placeholder}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      autoComplete="off"
    />
  );
}

// Encabezado de cada pestaña: descripción a la izquierda y "N de M" a la derecha
function CabeceraPanel({ descripcion, visibles, total }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-slate-600">{descripcion}</p>
      <p
        className="text-sm tabular-nums text-slate-500"
        aria-live="polite"
      >
        {visibles} de {total}
      </p>
    </div>
  );
}

export default function ClinicaDetalle() {
  const { clinicaId } = useParams();
  const { datos, usuario } = useApp();

  const [filtroParticipantes, setFiltroParticipantes] = useState("");
  const [filtroPropietarios, setFiltroPropietarios] = useState("");
  const [filtroEquipos, setFiltroEquipos] = useState("");

  const puedeConfigurar = puede(usuario, PERMISOS.CREAR_CLINICAS);
  // Solo visual: qué pestaña se está mirando
  const [pestana, setPestana] = useState(
    puedeConfigurar ? "personal" : "participantes",
  );

  const clinica = datos.clinicas.find((c) => c.id === clinicaId);

  if (!clinica) {
    return (
      <div className="mx-auto max-w-xl">
        <EstadoVacio
          icono={<IconoClinicas className="h-6 w-6" />}
          titulo="Clínica no encontrada"
          descripcion="Puede que el enlace sea incorrecto o que la clínica ya no exista."
          accion={
            <Boton as={Link} to="/clinicas">
              Volver a clínicas
            </Boton>
          }
        />
      </div>
    );
  }

  const nombrePlantilla =
    datos.plantillas.find((p) => p.id === clinica.plantillaId)?.nombre ??
    "Sin plantilla";

  // Todo lo que ocurrió en esta clínica
  const fichas = datos.fichas.filter((f) => f.clinicaId === clinica.id);

  // Participantes: recepcionistas y técnicos que aparecen en las fichas
  const resumenUsuarios = new Map();
  fichas.forEach((f) => {
    const sumar = (id, campo) => {
      const usuario = datos.usuarios.find((u) => u.id === id);
      if (!usuario) return;
      const actual = resumenUsuarios.get(id) ?? {
        usuario,
        fichas: 0,
        recepciones: 0,
        revisiones: 0,
      };
      actual.fichas += 1;
      actual[campo] += 1;
      resumenUsuarios.set(id, actual);
    };
    if (f.recepcionistaId) sumar(f.recepcionistaId, "recepciones");
    (f.tecnicosIds ?? []).forEach((id) => sumar(id, "revisiones"));
  });
  const participantes = [...resumenUsuarios.values()];

  // Equipos y propietarios que pasaron por esta clínica
  const idsEquipos = new Set(fichas.map((f) => f.equipoId));
  const equiposClinica = datos.equipos.filter((e) => idsEquipos.has(e.id));
  const idsPropietarios = new Set(equiposClinica.map((e) => e.propietarioId));
  const propietarios = datos.propietarios.filter((p) =>
    idsPropietarios.has(p.id),
  );

  // --- Filtros en vivo ---
  const qParticipantes = normalizar(filtroParticipantes.trim());
  const participantesVisibles = participantes
    .filter(
      ({ usuario }) =>
        !qParticipantes ||
        normalizar(usuario.nombre).includes(qParticipantes) ||
        normalizar(usuario.correo).includes(qParticipantes) ||
        normalizar(nombreRol(datos, usuario.rol)).includes(qParticipantes),
    )
    .sort((a, b) => a.usuario.nombre.localeCompare(b.usuario.nombre));

  const qPropietarios = normalizar(filtroPropietarios.trim());
  const qRut = limpiarRut(filtroPropietarios);
  const propietariosVisibles = propietarios
    .filter(
      (p) =>
        !qPropietarios ||
        normalizar(nombreCompleto(p)).includes(qPropietarios) ||
        normalizar(p.correo).includes(qPropietarios) ||
        normalizar(p.comuna).includes(qPropietarios) ||
        normalizar(p.telefono).includes(qPropietarios) ||
        (qRut.length >= 3 && limpiarRut(p.rut).includes(qRut)),
    )
    .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)));

  const qEquipos = normalizar(filtroEquipos.trim());
  const equiposVisibles = equiposClinica
    .map((equipo) => ({
      equipo,
      propietario: datos.propietarios.find(
        (p) => p.id === equipo.propietarioId,
      ),
      fichasEquipo: fichas.filter((f) => f.equipoId === equipo.id),
    }))
    .filter(({ equipo, propietario }) => {
      if (!qEquipos) return true;
      return (
        normalizar(equipo.numeroEquipo).includes(qEquipos) ||
        normalizar(equipo.tipo).includes(qEquipos) ||
        normalizar(equipo.marca).includes(qEquipos) ||
        normalizar(equipo.modelo).includes(qEquipos) ||
        normalizar(equipo.numeroSerie).includes(qEquipos) ||
        normalizar(propietario ? nombreCompleto(propietario) : "").includes(
          qEquipos,
        )
      );
    })
    .sort((a, b) => a.equipo.numeroEquipo.localeCompare(b.equipo.numeroEquipo));

  const resumen = [
    {
      etiqueta: "Fichas",
      valor: fichas.length,
      uno: "ficha",
      varios: "fichas",
    },
    {
      etiqueta: "Participantes",
      valor: participantes.length,
      uno: "participante",
      varios: "participantes",
    },
    {
      etiqueta: "Propietarios",
      valor: propietarios.length,
      uno: "propietario",
      varios: "propietarios",
    },
    {
      etiqueta: "Equipos",
      valor: equiposClinica.length,
      uno: "equipo",
      varios: "equipos",
    },
  ];

  const pestanas = [
    puedeConfigurar && {
      id: "personal",
      etiqueta: `Personal asignado (${(clinica.personalIds ?? []).length})`,
    },
    { id: "participantes", etiqueta: `Participantes (${participantes.length})` },
    { id: "propietarios", etiqueta: `Propietarios (${propietarios.length})` },
    { id: "equipos", etiqueta: `Equipos (${equiposClinica.length})` },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <Link
        to="/clinicas"
        className="-mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors duration-150 hover:text-inacap"
      >
        <IconoFlechaIzquierda className="h-4 w-4" />
        Volver a clínicas
      </Link>

      {/* Encabezado de la clínica: tarjeta protagonista con acento rojo */}
      <Tarjeta acento className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-inacap">
              {clinica.sede}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-slate-900">
              {clinica.nombre}
            </h1>
          </div>
          {clinicaEsActiva(clinica) ? (
            <Insignia tono="exito">Activa</Insignia>
          ) : (
            <Insignia tono="neutral">Inactiva</Insignia>
          )}
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <IconoChecklist className="h-3.5 w-3.5" />
              Plantilla de checklist
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {nombrePlantilla}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <IconoCalendario className="h-3.5 w-3.5" />
              Días de atención
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {clinica.dias.length > 0
                ? clinica.dias.map(formatearFecha).join(" · ")
                : "Sin días definidos"}
            </dd>
          </div>
        </dl>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {resumen.map(({ etiqueta, valor, uno, varios }) => (
            <div key={etiqueta} className="rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-500">
                {etiqueta}
              </dt>
              <dd className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">
                {valor}
                <span className="sr-only"> {valor === 1 ? uno : varios}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Tarjeta>

      <div className="space-y-5">
        <PestanasNav
          pestanas={pestanas}
          activa={pestana}
          onChange={setPestana}
          etiqueta="Información de la clínica"
        />

        {pestana === "personal" && puedeConfigurar && (
          <Tarjeta role="tabpanel" className="p-5 sm:p-6">
            <AjustesClinica clinica={clinica} />
          </Tarjeta>
        )}

        {/* Participantes */}
        {pestana === "participantes" && (
          <section role="tabpanel" aria-label="Participantes" className="space-y-4">
            <CabeceraPanel
              descripcion="Recepcionistas y técnicos que trabajaron en esta clínica."
              visibles={participantesVisibles.length}
              total={participantes.length}
            />
            {participantes.length > 0 && (
              <Filtro
                valor={filtroParticipantes}
                onChange={setFiltroParticipantes}
                placeholder="Filtrar por nombre, correo o rol"
                ariaLabel="Filtrar participantes"
              />
            )}
            {participantesVisibles.length === 0 ? (
              <EstadoVacio
                icono={<IconoUsuarios className="h-6 w-6" />}
                titulo={
                  participantes.length === 0
                    ? "Esta clínica aún no tiene fichas registradas."
                    : "No hay participantes que coincidan con el filtro."
                }
                descripcion={
                  participantes.length === 0
                    ? "Los participantes aparecerán cuando se cree la primera ficha."
                    : "Prueba con otro nombre, correo o rol."
                }
                accion={
                  participantes.length > 0 ? (
                    <Boton
                      variante="secundario"
                      onClick={() => setFiltroParticipantes("")}
                    >
                      Limpiar filtro
                    </Boton>
                  ) : null
                }
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {participantesVisibles.map(
                  ({ usuario, fichas: totalFichas, recepciones, revisiones }) => (
                    <Tarjeta as="li" key={usuario.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                        >
                          <IconoUsuarios className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="font-semibold text-slate-900">
                            {usuario.nombre}
                          </p>
                          <p className="break-all text-sm text-slate-600">
                            {nombreRol(datos, usuario.rol)} · {usuario.correo}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            <Insignia tono="neutral">
                              {totalFichas}{" "}
                              {totalFichas === 1 ? "ficha" : "fichas"}
                            </Insignia>
                            {recepciones > 0 && (
                              <Insignia tono="info">
                                {recepciones} recepción(es)
                              </Insignia>
                            )}
                            {revisiones > 0 && (
                              <Insignia tono="aviso">
                                {revisiones} revisión(es)
                              </Insignia>
                            )}
                          </div>
                        </div>
                      </div>
                    </Tarjeta>
                  ),
                )}
              </ul>
            )}
          </section>
        )}

        {/* Propietarios */}
        {pestana === "propietarios" && (
          <section role="tabpanel" aria-label="Propietarios" className="space-y-4">
            <CabeceraPanel
              descripcion="Personas que trajeron equipos a esta clínica."
              visibles={propietariosVisibles.length}
              total={propietarios.length}
            />
            {propietarios.length > 0 && (
              <Filtro
                valor={filtroPropietarios}
                onChange={setFiltroPropietarios}
                placeholder="Nombre, RUT, correo, teléfono o comuna"
                ariaLabel="Filtrar propietarios"
              />
            )}
            {propietariosVisibles.length === 0 ? (
              <EstadoVacio
                icono={<IconoUsuarios className="h-6 w-6" />}
                titulo={
                  propietarios.length === 0
                    ? "Esta clínica aún no tiene propietarios registrados."
                    : "No hay propietarios que coincidan con el filtro."
                }
                descripcion={
                  propietarios.length === 0
                    ? "Los propietarios aparecerán cuando se registre la primera ficha."
                    : "Prueba con otro nombre, RUT, correo, teléfono o comuna."
                }
                accion={
                  propietarios.length > 0 ? (
                    <Boton
                      variante="secundario"
                      onClick={() => setFiltroPropietarios("")}
                    >
                      Limpiar filtro
                    </Boton>
                  ) : null
                }
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {propietariosVisibles.map((p) => {
                  const susEquipos = equiposClinica.filter(
                    (e) => e.propietarioId === p.id,
                  );
                  return (
                    <Tarjeta as="li" key={p.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          {nombreCompleto(p)}
                        </p>
                        <Insignia tono="neutral" punto={false}>
                          <IconoMonitor className="h-3.5 w-3.5" />
                          {susEquipos.length}{" "}
                          {susEquipos.length === 1 ? "equipo" : "equipos"}
                        </Insignia>
                      </div>
                      <dl className="mt-2 space-y-0.5 text-sm text-slate-600">
                        <div>
                          <dt className="sr-only">RUT y comuna</dt>
                          <dd>
                            RUT {enmascararRut(p.rut)} · {p.comuna}
                          </dd>
                        </div>
                        <div>
                          <dt className="sr-only">Contacto</dt>
                          <dd className="break-all">
                            {p.correo} · {p.telefono}
                          </dd>
                        </div>
                      </dl>
                    </Tarjeta>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* Equipos */}
        {pestana === "equipos" && (
          <section role="tabpanel" aria-label="Equipos" className="space-y-4">
            <CabeceraPanel
              descripcion="Equipos recibidos, con el estado de su ficha."
              visibles={equiposVisibles.length}
              total={equiposClinica.length}
            />
            {equiposClinica.length > 0 && (
              <Filtro
                valor={filtroEquipos}
                onChange={setFiltroEquipos}
                placeholder="N° de equipo, tipo, marca, serie o propietario"
                ariaLabel="Filtrar equipos"
              />
            )}
            {equiposVisibles.length === 0 ? (
              <EstadoVacio
                icono={<IconoMonitor className="h-6 w-6" />}
                titulo={
                  equiposClinica.length === 0
                    ? "Esta clínica aún no tiene equipos recibidos."
                    : "No hay equipos que coincidan con el filtro."
                }
                descripcion={
                  equiposClinica.length === 0
                    ? "Los equipos aparecerán cuando se cree la primera ficha."
                    : "Prueba con otro número, tipo, marca, serie o propietario."
                }
                accion={
                  equiposClinica.length > 0 ? (
                    <Boton
                      variante="secundario"
                      onClick={() => setFiltroEquipos("")}
                    >
                      Limpiar filtro
                    </Boton>
                  ) : null
                }
              />
            ) : (
              <ul className="grid gap-3">
                {equiposVisibles.map(({ equipo, propietario, fichasEquipo }) => (
                  <Tarjeta as="li" key={equipo.id} className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-inacap-tenue text-inacap-oscuro sm:flex"
                        >
                          <IconoMonitor className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="font-semibold text-slate-900">
                            {equipo.numeroEquipo} · {equipo.tipo}
                          </p>
                          <p className="text-sm text-slate-700">
                            {propietario
                              ? nombreCompleto(propietario)
                              : "Sin propietario registrado"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {[
                              equipo.marca,
                              equipo.modelo,
                              equipo.numeroSerie &&
                                `Serie ${equipo.numeroSerie}`,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Datos técnicos pendientes"}
                          </p>
                        </div>
                      </div>
                      <ul className="flex flex-col gap-1.5 sm:items-end">
                        {fichasEquipo.map((f) => (
                          <li
                            key={f.id}
                            className="flex flex-wrap items-center gap-2 sm:justify-end"
                          >
                            <span className="text-xs font-semibold tabular-nums text-slate-500">
                              {f.numero}
                            </span>
                            <Insignia estado={f.estado} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Tarjeta>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
