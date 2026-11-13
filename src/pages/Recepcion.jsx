import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store.jsx";
import { limpiarRut, enmascararRut } from "../lib/rut.js";
import { normalizar, nombreCompleto } from "../lib/texto.js";
import { estaAbierta, fichasDeEquipo } from "../lib/fichas.js";
import { clinicaActivaDe } from "../lib/clinicas.js";
import AtencionAnterior from "../components/AtencionAnterior.jsx";
import FormularioFicha from "../components/FormularioFicha.jsx";

export default function Recepcion() {
  const { datos, actualizar, usuario } = useApp();
  const clinica = clinicaActivaDe(datos, usuario);

  const [busqueda, setBusqueda] = useState("");
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [propietarioId, setPropietarioId] = useState(null);
  const [equipoElegido, setEquipoElegido] = useState(null);
  const [verAnterior, setVerAnterior] = useState(null);
  const [creada, setCreada] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null); // 'p:<id>' o 'e:<id>'

  const propietario = datos.propietarios.find((p) => p.id === propietarioId);
  const equiposDe = (id) => datos.equipos.filter((e) => e.propietarioId === id);
  const tieneFichas = (equipoId) =>
    datos.fichas.some((f) => f.equipoId === equipoId);
  const propietarioConFichas = (id) =>
    equiposDe(id).some((e) => tieneFichas(e.id));
  const pendientesDe = (id) =>
    equiposDe(id).filter((e) => !tieneFichas(e.id)).length;

  const reiniciar = () => {
    setPropietarioId(null);
    setEquipoElegido(null);
    setVerAnterior(null);
    setCreada(null);
    setPorEliminar(null);
  };

  // Elimina una inscripción completa (propietario y sus equipos)
  const eliminarPropietario = (id) => {
    actualizar((d) => ({
      ...d,
      propietarios: d.propietarios.filter((p) => p.id !== id),
      equipos: d.equipos.filter((e) => e.propietarioId !== id),
    }));
    if (propietarioId === id) reiniciar();
    setPorEliminar(null);
  };

  const eliminarEquipo = (id) => {
    actualizar((d) => ({
      ...d,
      equipos: d.equipos.filter((e) => e.id !== id),
    }));
    setPorEliminar(null);
  };

  const q = normalizar(busqueda.trim());
  const qRut = limpiarRut(busqueda);
  const lista = datos.propietarios
    .filter((p) => {
      if (soloPendientes && pendientesDe(p.id) === 0) return false;
      if (!q) return true;
      const porNombre = normalizar(nombreCompleto(p)).includes(q);
      const porRut = qRut.length >= 3 && limpiarRut(p.rut).includes(qRut);
      const porEquipo = equiposDe(p.id).some((e) =>
        normalizar(e.numeroEquipo).includes(q),
      );
      return porNombre || porRut || porEquipo;
    })
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));

  // Confirmación tras crear la ficha
  if (creada) {
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Ficha {creada.numero} creada</h1>
        <p>
          El equipo quedó en estado <strong>{creada.estado}</strong> y asignado
          a{" "}
          {creada.tecnicosIds.length === 1
            ? "un técnico"
            : "una pareja de técnicos"}
          , que registrará sus datos técnicos.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCreada(null);
              setEquipoElegido(null);
            }}
            className="bg-[#EE0000] text-white rounded-lg py-2 px-4"
          >
            Recibir otro equipo de este propietario
          </button>
          <button onClick={reiniciar} className="border rounded-lg py-2 px-4">
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Recepción de equipos</h1>

      {clinica ? (
        <p className="text-sm text-neutral-600">
          Clínica activa: <strong>{clinica.nombre}</strong>
        </p>
      ) : (
        <p
          role="alert"
          className="border border-amber-300 bg-amber-50 rounded-lg p-3 text-sm"
        >
          No tienes una clínica activa. Pídele al encargado que active una
          clínica y te asigne a ella.
        </p>
      )}

      {!propietario && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="search"
              className="border rounded-lg px-3 py-2 w-full sm:max-w-sm"
              placeholder="Buscar por nombre, RUT o N° de equipo"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar propietario"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={soloPendientes}
                onChange={(e) => setSoloPendientes(e.target.checked)}
              />
              Solo con equipos pendientes de recibir
            </label>
          </div>

          <p className="text-sm text-neutral-600">
            {lista.length} {lista.length === 1 ? "propietario" : "propietarios"}
          </p>

          <ul className="space-y-2">
            {lista.map((p) => {
              const pendientes = pendientesDe(p.id);
              const bloqueado = propietarioConFichas(p.id);
              return (
                <li key={p.id} className="border rounded-lg p-3">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <p className="font-semibold">{nombreCompleto(p)}</p>
                      <p className="text-sm text-neutral-600">
                        RUT {enmascararRut(p.rut)} · {p.comuna} ·{" "}
                        {equiposDe(p.id).length}{" "}
                        {equiposDe(p.id).length === 1 ? "equipo" : "equipos"}
                        {pendientes > 0 && ` · ${pendientes} por recibir`}
                      </p>
                    </div>
                    <div className="flex gap-3 items-center text-sm">
                      <button
                        onClick={() => setPorEliminar(`p:${p.id}`)}
                        disabled={bloqueado}
                        title={
                          bloqueado
                            ? "No se puede eliminar: tiene equipos con fichas"
                            : ""
                        }
                        className="underline text-red-700 disabled:opacity-40 disabled:no-underline"
                      >
                        Eliminar inscripción
                      </button>
                      <button
                        onClick={() => setPropietarioId(p.id)}
                        className="bg-[#EE0000] text-white rounded-lg py-1 px-3"
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>

                  {porEliminar === `p:${p.id}` && (
                    <div
                      role="alert"
                      className="mt-3 border border-red-300 bg-red-50 rounded p-3 text-sm space-y-2"
                    >
                      <p>
                        ¿Eliminar la inscripción de {nombreCompleto(p)} y sus{" "}
                        {equiposDe(p.id).length}{" "}
                        {equiposDe(p.id).length === 1 ? "equipo" : "equipos"}?
                        Esta acción no se puede deshacer.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => eliminarPropietario(p.id)}
                          className="bg-red-700 text-white rounded px-3 py-1"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          onClick={() => setPorEliminar(null)}
                          className="border rounded px-3 py-1"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
            {lista.length === 0 && (
              <li className="text-neutral-600">
                No hay propietarios que coincidan.{" "}
                <Link to="/inscripcion" className="underline">
                  Inscribir a una persona presencialmente
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      {propietario && (
        <section className="space-y-4">
          <header className="border rounded-lg p-4 bg-neutral-50 flex justify-between items-start gap-3">
            <div>
              <h2 className="font-semibold">{nombreCompleto(propietario)}</h2>
              <p className="text-sm text-neutral-600">
                RUT {enmascararRut(propietario.rut)} · {propietario.comuna}
              </p>
            </div>
            <button onClick={reiniciar} className="text-sm underline">
              Volver a la lista
            </button>
          </header>

          <h2 className="font-semibold">
            {equiposDe(propietario.id).length > 1
              ? "Selecciona el equipo que trae"
              : "Equipo inscrito"}
          </h2>

          <ul className="space-y-3">
            {equiposDe(propietario.id).map((e) => {
              const fichas = fichasDeEquipo(datos, e.id);
              const abierta = fichas.find(estaAbierta);
              const anterior = fichas.find((f) => !estaAbierta(f));
              return (
                <li key={e.id} className="border rounded-lg p-4">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <p className="font-semibold">
                        {e.numeroEquipo} · {e.tipo}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {e.marca
                          ? `${e.marca} ${e.modelo}`
                          : "Datos técnicos pendientes"}
                        {fichas.length > 0 &&
                          ` · Reingreso (${fichas.length} ${fichas.length === 1 ? "atención" : "atenciones"})`}
                      </p>
                    </div>
                    <div className="flex gap-3 items-center text-sm">
                      {anterior && (
                        <button
                          onClick={() =>
                            setVerAnterior(verAnterior === e.id ? null : e.id)
                          }
                          className="underline"
                        >
                          {verAnterior === e.id
                            ? "Ocultar atención anterior"
                            : "Ver atención anterior"}
                        </button>
                      )}
                      {fichas.length === 0 && (
                        <button
                          onClick={() => setPorEliminar(`e:${e.id}`)}
                          className="underline text-red-700"
                        >
                          Quitar equipo
                        </button>
                      )}
                      {!abierta && (
                        <button
                          onClick={() => setEquipoElegido(e.id)}
                          disabled={!clinica}
                          title={!clinica ? "Necesitas una clínica activa" : ""}
                          className="bg-[#EE0000] text-white rounded-lg py-1 px-3 disabled:opacity-40"
                        >
                          Recibir
                        </button>
                      )}
                    </div>
                  </div>

                  {porEliminar === `e:${e.id}` && (
                    <div
                      role="alert"
                      className="mt-3 border border-red-300 bg-red-50 rounded p-3 text-sm space-y-2"
                    >
                      <p>
                        ¿Quitar {e.numeroEquipo} ({e.tipo}) de la inscripción?
                        El propietario no lo trajo.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => eliminarEquipo(e.id)}
                          className="bg-red-700 text-white rounded px-3 py-1"
                        >
                          Sí, quitar
                        </button>
                        <button
                          onClick={() => setPorEliminar(null)}
                          className="border rounded px-3 py-1"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {abierta && (
                    <p className="mt-2 text-sm text-amber-800">
                      Ya tiene una ficha abierta: {abierta.numero} (
                      {abierta.estado}).
                    </p>
                  )}

                  {verAnterior === e.id && anterior && (
                    <AtencionAnterior
                      ficha={anterior}
                      onCerrar={() => setVerAnterior(null)}
                    />
                  )}

                  {equipoElegido === e.id && clinica && (
                    <FormularioFicha
                      equipo={e}
                      clinica={clinica}
                      onCancelar={() => setEquipoElegido(null)}
                      onCreada={setCreada}
                    />
                  )}
                </li>
              );
            })}
            {equiposDe(propietario.id).length === 0 && (
              <li className="text-neutral-600">
                Este propietario no tiene equipos inscritos.
              </li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
