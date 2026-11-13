import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store.jsx";
import { limpiarRut, enmascararRut } from "../lib/rut.js";
import { normalizar, nombreCompleto } from "../lib/texto.js";
import { estaAbierta, fichasDeEquipo } from "../lib/fichas.js";
import { clinicaActivaDe } from "../lib/clinicas.js";
import AtencionAnterior from "../components/AtencionAnterior.jsx";
import FormularioFicha from "../components/FormularioFicha.jsx";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import {
  IconoFlechaIzquierda,
  IconoInscripcion,
  IconoMonitor,
  IconoUsuarios,
} from "../components/ui/iconos.jsx";

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
      <div className="mx-auto max-w-2xl space-y-6">
        <Encabezado
          titulo={`Ficha ${creada.numero} creada`}
          descripcion="La recepción quedó registrada y el equipo ya tiene técnicos asignados."
        />

        <Tarjeta className="space-y-5 p-5 sm:p-6">
          <Alerta variante="exito" titulo="Recepción completada">
            El equipo quedó en estado <strong>{creada.estado}</strong> y
            asignado a{" "}
            {creada.tecnicosIds.length === 1
              ? "un técnico"
              : "una pareja de técnicos"}
            , que registrará sus datos técnicos.
          </Alerta>

          <dl className="grid gap-3 rounded-control bg-neutral-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">N° de ficha</dt>
              <dd className="font-semibold text-tinta">{creada.numero}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Estado inicial</dt>
              <dd className="mt-1">
                <Insignia estado={creada.estado} />
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Boton
              onClick={() => {
                setCreada(null);
                setEquipoElegido(null);
              }}
              bloque
              className="sm:w-auto"
            >
              Recibir otro equipo de este propietario
            </Boton>
            <Boton variante="secundario" onClick={reiniciar}>
              Volver a la lista
            </Boton>
          </div>
        </Tarjeta>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Recepción de equipos"
        descripcion="Busca al propietario, revisa sus equipos y crea la ficha de atención."
        acciones={
          <Boton as={Link} to="/inscripcion" variante="secundario">
            <IconoInscripcion className="h-4 w-4" />
            Inscribir propietario
          </Boton>
        }
      />

      {clinica ? (
        <Alerta variante="info">
          Clínica activa: <strong>{clinica.nombre}</strong>
        </Alerta>
      ) : (
        <Alerta variante="aviso" role="alert">
          “No estás asignado a la clínica de este año. Pídele al encargado que
          te asigne a una.”
        </Alerta>
      )}

      {!propietario && (
        <section className="space-y-4" aria-labelledby="lista-propietarios">
          <Tarjeta className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Campo
                etiqueta="Buscar propietario"
                type="search"
                className="flex-1"
                placeholder="Buscar por nombre, RUT o N° de equipo"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar propietario"
                ayuda="Puedes buscar por nombre, RUT o número de equipo."
                autoComplete="off"
              />
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:border-neutral-300 hover:bg-neutral-100 sm:mb-5">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0"
                  checked={soloPendientes}
                  onChange={(e) => setSoloPendientes(e.target.checked)}
                />
                Solo con equipos pendientes de recibir
              </label>
            </div>
          </Tarjeta>

          <div className="flex items-center justify-between gap-3">
            <h2
              id="lista-propietarios"
              className="text-sm font-semibold text-neutral-700"
            >
              Propietarios inscritos
            </h2>
            <p className="text-sm text-neutral-600" aria-live="polite">
              {lista.length}{" "}
              {lista.length === 1 ? "propietario" : "propietarios"}
            </p>
          </div>

          {lista.length === 0 ? (
            <EstadoVacio
              icono={<IconoUsuarios className="h-6 w-6" />}
              titulo="No hay propietarios que coincidan"
              descripcion="Prueba con otro nombre, RUT o número de equipo, o inscribe a la persona en el sistema."
              accion={
                <Boton as={Link} to="/inscripcion" variante="secundario">
                  Inscribir a una persona presencialmente
                </Boton>
              }
            />
          ) : (
            <ul className="space-y-3">
              {lista.map((p) => {
                const pendientes = pendientesDe(p.id);
                const bloqueado = propietarioConFichas(p.id);
                return (
                  <Tarjeta as="li" key={p.id} className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-tinta">
                            {nombreCompleto(p)}
                          </p>
                          {pendientes > 0 ? (
                            <Insignia tono="aviso">
                              {pendientes} por recibir
                            </Insignia>
                          ) : (
                            <Insignia tono="neutral">Sin pendientes</Insignia>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-neutral-600">
                          RUT {enmascararRut(p.rut)} · {p.comuna} ·{" "}
                          {equiposDe(p.id).length}{" "}
                          {equiposDe(p.id).length === 1 ? "equipo" : "equipos"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <Boton
                          variante="peligro-enlace"
                          onClick={() => setPorEliminar(`p:${p.id}`)}
                          disabled={bloqueado}
                          title={
                            bloqueado
                              ? "No se puede eliminar: tiene equipos con fichas"
                              : ""
                          }
                        >
                          Eliminar inscripción
                        </Boton>
                        <Boton onClick={() => setPropietarioId(p.id)}>
                          Seleccionar
                        </Boton>
                      </div>
                    </div>

                    {porEliminar === `p:${p.id}` && (
                      <Alerta
                        variante="error"
                        role="alert"
                        titulo="Eliminar inscripción"
                        className="mt-4"
                        acciones={
                          <>
                            <Boton
                              variante="peligro"
                              tamano="sm"
                              onClick={() => eliminarPropietario(p.id)}
                            >
                              Sí, eliminar
                            </Boton>
                            <Boton
                              variante="secundario"
                              tamano="sm"
                              onClick={() => setPorEliminar(null)}
                            >
                              Cancelar
                            </Boton>
                          </>
                        }
                      >
                        ¿Eliminar la inscripción de {nombreCompleto(p)} y sus{" "}
                        {equiposDe(p.id).length}{" "}
                        {equiposDe(p.id).length === 1 ? "equipo" : "equipos"}?
                        Esta acción no se puede deshacer.
                      </Alerta>
                    )}
                  </Tarjeta>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {propietario && (
        <section className="space-y-5">
          <Tarjeta className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-inacap-tenue text-inacap-oscuro"
                >
                  <IconoUsuarios className="h-5 w-5" />
                </span>
                <div className="min-w-0 space-y-1">
                  <h2 className="text-lg font-semibold text-tinta">
                    {nombreCompleto(propietario)}
                  </h2>
                  <p className="text-sm text-neutral-600">
                    RUT {enmascararRut(propietario.rut)} · {propietario.comuna}
                  </p>
                </div>
              </div>
              <Boton variante="secundario" onClick={reiniciar}>
                <IconoFlechaIzquierda className="h-4 w-4" />
                Volver a la lista
              </Boton>
            </div>
          </Tarjeta>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-tinta">
              {equiposDe(propietario.id).length > 1
                ? "Selecciona el equipo que trae"
                : "Equipo inscrito"}
            </h2>

            {equiposDe(propietario.id).length === 0 ? (
              <EstadoVacio
                icono={<IconoMonitor className="h-6 w-6" />}
                titulo="Este propietario no tiene equipos inscritos"
                descripcion="Puedes volver a la lista o inscribir un equipo nuevo para esta persona."
                accion={
                  <Boton as={Link} to="/inscripcion" variante="secundario">
                    Inscribir equipo
                  </Boton>
                }
              />
            ) : (
              <ul className="space-y-3">
                {equiposDe(propietario.id).map((e) => {
                  const fichas = fichasDeEquipo(datos, e.id);
                  const abierta = fichas.find(estaAbierta);
                  const anterior = fichas.find((f) => !estaAbierta(f));
                  return (
                    <Tarjeta as="li" key={e.id} className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-tinta">
                              {e.numeroEquipo} · {e.tipo}
                            </p>
                            {abierta && <Insignia estado={abierta.estado} />}
                            {fichas.length > 0 && (
                              <Insignia tono="neutral">
                                Reingreso · {fichas.length}{" "}
                                {fichas.length === 1
                                  ? "atención"
                                  : "atenciones"}
                              </Insignia>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-neutral-600">
                            {e.marca
                              ? `${e.marca} ${e.modelo}`
                              : "Datos técnicos pendientes"}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                          {anterior && (
                            <Boton
                              variante="enlace"
                              onClick={() =>
                                setVerAnterior(
                                  verAnterior === e.id ? null : e.id,
                                )
                              }
                            >
                              {verAnterior === e.id
                                ? "Ocultar atención anterior"
                                : "Ver atención anterior"}
                            </Boton>
                          )}
                          {fichas.length === 0 && (
                            <Boton
                              variante="peligro-enlace"
                              onClick={() => setPorEliminar(`e:${e.id}`)}
                            >
                              Quitar equipo
                            </Boton>
                          )}
                          {!abierta && (
                            <Boton
                              onClick={() => setEquipoElegido(e.id)}
                              disabled={!clinica}
                              title={
                                !clinica ? "Necesitas una clínica activa" : ""
                              }
                            >
                              Recibir
                            </Boton>
                          )}
                        </div>
                      </div>

                      {porEliminar === `e:${e.id}` && (
                        <Alerta
                          variante="error"
                          role="alert"
                          titulo="Quitar equipo de la inscripción"
                          className="mt-4"
                          acciones={
                            <>
                              <Boton
                                variante="peligro"
                                tamano="sm"
                                onClick={() => eliminarEquipo(e.id)}
                              >
                                Sí, quitar
                              </Boton>
                              <Boton
                                variante="secundario"
                                tamano="sm"
                                onClick={() => setPorEliminar(null)}
                              >
                                Cancelar
                              </Boton>
                            </>
                          }
                        >
                          ¿Quitar {e.numeroEquipo} ({e.tipo}) de la inscripción?
                          El propietario no lo trajo.
                        </Alerta>
                      )}

                      {abierta && (
                        <Alerta variante="aviso" className="mt-4">
                          Ya tiene una ficha abierta: {abierta.numero} (
                          {abierta.estado}).
                        </Alerta>
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
                    </Tarjeta>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
