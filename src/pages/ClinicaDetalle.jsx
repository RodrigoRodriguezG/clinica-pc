import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../store.jsx";
import { NOMBRE_ROL, PERMISOS } from "../constantes.js";
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
import Tarjeta from "../components/ui/Tarjeta.jsx";
import {
  IconoCalendario,
  IconoClinicas,
  IconoFlechaIzquierda,
  IconoUsuarios,
} from "../components/ui/iconos.jsx";

// Input de filtro reutilizable para las tres listas
function Filtro({ valor, onChange, placeholder, ariaLabel }) {
  return (
    <Campo
      etiqueta={ariaLabel}
      type="search"
      placeholder={placeholder}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      autoComplete="off"
    />
  );
}

export default function ClinicaDetalle() {
  const { clinicaId } = useParams();
  const { datos, usuario } = useApp();

  const [filtroParticipantes, setFiltroParticipantes] = useState("");
  const [filtroPropietarios, setFiltroPropietarios] = useState("");
  const [filtroEquipos, setFiltroEquipos] = useState("");

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
        normalizar(NOMBRE_ROL[usuario.rol]).includes(qParticipantes),
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

  return (
    <div className="space-y-7">
      {/* Encabezado de la clínica */}
      <Tarjeta className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-tinta sm:text-3xl">
                {clinica.nombre}
              </h1>
              {clinicaEsActiva(clinica) && (
                <Insignia tono="exito">Clínica activa</Insignia>
              )}
            </div>
            <p className="text-sm leading-relaxed text-neutral-600">
              {clinica.sede} · Plantilla: {nombrePlantilla}
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-neutral-600">
              <IconoCalendario className="h-4 w-4 text-neutral-500" />
              {clinica.dias.length > 0
                ? `Días: ${clinica.dias.map(formatearFecha).join(" · ")}`
                : "Sin días definidos"}
            </p>
          </div>
          <Boton as={Link} to="/clinicas" variante="secundario">
            <IconoFlechaIzquierda className="h-4 w-4" />
            Volver a clínicas
          </Boton>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 rounded-control border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-4">
          {resumen.map(({ etiqueta, valor, uno, varios }) => (
            <div key={etiqueta}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {etiqueta}
              </dt>
              <dd className="mt-0.5 text-xl font-bold text-tinta">
                {valor}
                <span className="ml-1 text-xs font-medium text-neutral-500">
                  {valor === 1 ? uno : varios}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        {puede(usuario, PERMISOS.CREAR_CLINICAS) && (
          <div className="mt-4">
            <AjustesClinica clinica={clinica} />
          </div>
        )}
      </Tarjeta>

      {/* Participantes */}
      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tinta">Participantes</h2>
            <p className="text-sm text-neutral-600">
              Recepcionistas y técnicos que trabajaron en esta clínica.
            </p>
          </div>
          <Insignia tono="neutral">
            {participantesVisibles.length} de {participantes.length}
          </Insignia>
        </div>
        <Filtro
          valor={filtroParticipantes}
          onChange={setFiltroParticipantes}
          placeholder="Filtrar por nombre, correo o rol"
          ariaLabel="Filtrar participantes"
        />
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
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600"
                    >
                      <IconoUsuarios className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-tinta">
                        {usuario.nombre}
                      </p>
                      <p className="break-all text-sm text-neutral-600">
                        {NOMBRE_ROL[usuario.rol]} · {usuario.correo}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Insignia tono="neutral">
                          {totalFichas} {totalFichas === 1 ? "ficha" : "fichas"}
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

      {/* Propietarios */}
      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tinta">Propietarios</h2>
            <p className="text-sm text-neutral-600">
              Personas que trajeron equipos a esta clínica.
            </p>
          </div>
          <Insignia tono="neutral">
            {propietariosVisibles.length} de {propietarios.length}
          </Insignia>
        </div>
        <Filtro
          valor={filtroPropietarios}
          onChange={setFiltroPropietarios}
          placeholder="Filtrar por nombre, RUT, correo, teléfono o comuna"
          ariaLabel="Filtrar propietarios"
        />
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
                  <div className="space-y-1">
                    <p className="font-semibold text-tinta">
                      {nombreCompleto(p)}
                    </p>
                    <p className="text-sm text-neutral-600">
                      RUT {enmascararRut(p.rut)} · {p.comuna}
                    </p>
                    <p className="break-all text-sm text-neutral-600">
                      {p.correo} · {p.telefono}
                    </p>
                    <p className="pt-1 text-xs text-neutral-500">
                      {susEquipos.length}{" "}
                      {susEquipos.length === 1 ? "equipo" : "equipos"} en esta
                      clínica
                    </p>
                  </div>
                </Tarjeta>
              );
            })}
          </ul>
        )}
      </section>

      {/* Equipos */}
      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tinta">Equipos</h2>
            <p className="text-sm text-neutral-600">
              Equipos recibidos, con el estado de su ficha.
            </p>
          </div>
          <Insignia tono="neutral">
            {equiposVisibles.length} de {equiposClinica.length}
          </Insignia>
        </div>
        <Filtro
          valor={filtroEquipos}
          onChange={setFiltroEquipos}
          placeholder="Filtrar por N° de equipo, tipo, marca, serie o propietario"
          ariaLabel="Filtrar equipos"
        />
        {equiposVisibles.length === 0 ? (
          <EstadoVacio
            icono={<IconoClinicas className="h-6 w-6" />}
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
          <ul className="space-y-3">
            {equiposVisibles.map(({ equipo, propietario, fichasEquipo }) => (
              <Tarjeta as="li" key={equipo.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-tinta">
                      {equipo.numeroEquipo} · {equipo.tipo}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {propietario
                        ? nombreCompleto(propietario)
                        : "Sin propietario registrado"}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {[
                        equipo.marca,
                        equipo.modelo,
                        equipo.numeroSerie && `Serie ${equipo.numeroSerie}`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Datos técnicos pendientes"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:items-end">
                    {fichasEquipo.map((f) => (
                      <div
                        key={f.id}
                        className="flex flex-wrap items-center gap-2 sm:justify-end"
                      >
                        <span className="text-xs font-semibold text-neutral-500">
                          {f.numero}
                        </span>
                        <Insignia estado={f.estado} />
                      </div>
                    ))}
                  </div>
                </div>
              </Tarjeta>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
