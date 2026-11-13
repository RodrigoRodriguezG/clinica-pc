import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../store.jsx";
import { NOMBRE_ROL } from "../constantes.js";
import { normalizar, nombreCompleto } from "../lib/texto.js";
import { formatearFecha } from "../lib/fechas.js";
import { limpiarRut, enmascararRut } from "../lib/rut.js";

// Input de filtro reutilizable para las tres listas
function Filtro({ valor, onChange, placeholder, ariaLabel }) {
  return (
    <input
      type="search"
      className="border rounded-lg px-3 py-2 w-full sm:max-w-sm"
      placeholder={placeholder}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    />
  );
}

export default function ClinicaDetalle() {
  const { clinicaId } = useParams();
  const { datos } = useApp();

  const [filtroParticipantes, setFiltroParticipantes] = useState("");
  const [filtroPropietarios, setFiltroPropietarios] = useState("");
  const [filtroEquipos, setFiltroEquipos] = useState("");

  const clinica = datos.clinicas.find((c) => c.id === clinicaId);

  if (!clinica) {
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Clínica no encontrada</h1>
        <p className="text-neutral-600">
          Puede que el enlace sea incorrecto o que la clínica ya no exista.
        </p>
        <Link
          to="/clinicas"
          className="inline-block bg-[#EE0000] text-white rounded-lg py-2 px-4"
        >
          Volver a clínicas
        </Link>
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
    .sort((a, b) =>
      a.equipo.numeroEquipo.localeCompare(b.equipo.numeroEquipo),
    );

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Encabezado de la clínica */}
      <header className="border rounded-xl bg-neutral-50 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{clinica.nombre}</h1>
            <p className="text-sm text-neutral-600">
              {clinica.sede} · Plantilla: {nombrePlantilla}
            </p>
            <p className="text-sm text-neutral-600">
              {clinica.dias.length > 0
                ? `Días: ${clinica.dias.map(formatearFecha).join(" · ")}`
                : "Sin días definidos"}
            </p>
          </div>
          <Link
            to="/clinicas"
            className="border rounded-lg py-2 px-4 text-sm bg-white hover:border-[#EE0000]"
          >
            ← Volver a clínicas
          </Link>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span>
            <strong>{fichas.length}</strong>{" "}
            {fichas.length === 1 ? "ficha" : "fichas"}
          </span>
          <span>
            <strong>{participantes.length}</strong> participantes
          </span>
          <span>
            <strong>{propietarios.length}</strong>{" "}
            {propietarios.length === 1 ? "propietario" : "propietarios"}
          </span>
          <span>
            <strong>{equiposClinica.length}</strong>{" "}
            {equiposClinica.length === 1 ? "equipo" : "equipos"}
          </span>
        </div>
      </header>

      {/* Participantes */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Participantes</h2>
            <p className="text-sm text-neutral-600">
              Recepcionistas y técnicos que trabajaron en esta clínica.
            </p>
          </div>
          <span className="text-sm text-neutral-500">
            {participantesVisibles.length} de {participantes.length}
          </span>
        </div>
        <Filtro
          valor={filtroParticipantes}
          onChange={setFiltroParticipantes}
          placeholder="Filtrar por nombre, correo o rol"
          ariaLabel="Filtrar participantes"
        />
        <ul className="grid sm:grid-cols-2 gap-2">
          {participantesVisibles.map(
            ({ usuario, fichas: totalFichas, recepciones, revisiones }) => (
              <li key={usuario.id} className="border rounded-lg p-3">
                <p className="font-semibold">{usuario.nombre}</p>
                <p className="text-sm text-neutral-600">
                  {NOMBRE_ROL[usuario.rol]} · {usuario.correo}
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  {totalFichas}{" "}
                  {totalFichas === 1 ? "ficha" : "fichas"}
                  {recepciones > 0 && ` · ${recepciones} recepción(es)`}
                  {revisiones > 0 && ` · ${revisiones} revisión(es)`}
                </p>
              </li>
            ),
          )}
        </ul>
        {participantesVisibles.length === 0 && (
          <p className="text-sm text-neutral-600">
            {participantes.length === 0
              ? "Esta clínica aún no tiene fichas registradas."
              : "No hay participantes que coincidan con el filtro."}
          </p>
        )}
      </section>

      {/* Propietarios */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Propietarios</h2>
            <p className="text-sm text-neutral-600">
              Personas que trajeron equipos a esta clínica.
            </p>
          </div>
          <span className="text-sm text-neutral-500">
            {propietariosVisibles.length} de {propietarios.length}
          </span>
        </div>
        <Filtro
          valor={filtroPropietarios}
          onChange={setFiltroPropietarios}
          placeholder="Filtrar por nombre, RUT, correo, teléfono o comuna"
          ariaLabel="Filtrar propietarios"
        />
        <ul className="grid sm:grid-cols-2 gap-2">
          {propietariosVisibles.map((p) => {
            const susEquipos = equiposClinica.filter(
              (e) => e.propietarioId === p.id,
            );
            return (
              <li key={p.id} className="border rounded-lg p-3">
                <p className="font-semibold">{nombreCompleto(p)}</p>
                <p className="text-sm text-neutral-600">
                  RUT {enmascararRut(p.rut)} · {p.comuna}
                </p>
                <p className="text-sm text-neutral-600">
                  {p.correo} · {p.telefono}
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  {susEquipos.length}{" "}
                  {susEquipos.length === 1 ? "equipo" : "equipos"} en esta
                  clínica
                </p>
              </li>
            );
          })}
        </ul>
        {propietariosVisibles.length === 0 && (
          <p className="text-sm text-neutral-600">
            {propietarios.length === 0
              ? "Esta clínica aún no tiene propietarios registrados."
              : "No hay propietarios que coincidan con el filtro."}
          </p>
        )}
      </section>

      {/* Equipos */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Equipos</h2>
            <p className="text-sm text-neutral-600">
              Equipos recibidos, con el estado de su ficha.
            </p>
          </div>
          <span className="text-sm text-neutral-500">
            {equiposVisibles.length} de {equiposClinica.length}
          </span>
        </div>
        <Filtro
          valor={filtroEquipos}
          onChange={setFiltroEquipos}
          placeholder="Filtrar por N° de equipo, tipo, marca, serie o propietario"
          ariaLabel="Filtrar equipos"
        />
        <ul className="space-y-2">
          {equiposVisibles.map(({ equipo, propietario, fichasEquipo }) => (
            <li
              key={equipo.id}
              className="border rounded-lg p-3 flex flex-wrap justify-between items-start gap-3"
            >
              <div>
                <p className="font-semibold">
                  {equipo.numeroEquipo} · {equipo.tipo}
                </p>
                <p className="text-sm text-neutral-600">
                  {propietario
                    ? nombreCompleto(propietario)
                    : "Sin propietario registrado"}
                </p>
                <p className="text-sm text-neutral-600">
                  {[equipo.marca, equipo.modelo, equipo.numeroSerie && `Serie ${equipo.numeroSerie}`]
                    .filter(Boolean)
                    .join(" · ") || "Datos técnicos pendientes"}
                </p>
              </div>
              <div className="text-sm text-right space-y-1">
                {fichasEquipo.map((f) => (
                  <p key={f.id}>
                    <span className="font-semibold">{f.numero}</span> ·{" "}
                    {f.estado}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>
        {equiposVisibles.length === 0 && (
          <p className="text-sm text-neutral-600">
            {equiposClinica.length === 0
              ? "Esta clínica aún no tiene equipos recibidos."
              : "No hay equipos que coincidan con el filtro."}
          </p>
        )}
      </section>
    </div>
  );
}