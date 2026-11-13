import { useState } from "react";
import { useApp } from "../store.jsx";
import { ESTADOS_FICHA, PERMISOS } from "../constantes.js";
import { puede } from "../lib/permisos.js";
import { normalizar } from "../lib/texto.js";
import { formatearFecha, fechaLocal } from "../lib/fechas.js";
import { fichasVisibles } from "../lib/fichas.js";
import DetalleFicha from "../components/DetalleFicha.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import { IconoFichas } from "../components/ui/iconos.jsx";

const FILTROS_VACIOS = {
  texto: "",
  estado: "",
  clinicaId: "",
  fecha: "",
  asignacion: "todas",
};

export default function Fichas() {
  const { datos, usuario } = useApp();
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [abierta, setAbierta] = useState(null);

  const cambiar = (campo) => (e) =>
    setFiltros({ ...filtros, [campo]: e.target.value });
  const esTecnico = puede(usuario, PERMISOS.REVISAR_EQUIPOS);
  const verTodas = puede(usuario, PERMISOS.VER_TODAS_FICHAS);

  const q = normalizar(filtros.texto.trim());
  const lista = fichasVisibles(datos, usuario)
    .filter((f) => {
      const eq = datos.equipos.find((e) => e.id === f.equipoId);
      if (filtros.asignacion === "mias" && !f.tecnicosIds.includes(usuario.id))
        return false;
      if (filtros.estado && f.estado !== filtros.estado) return false;
      if (filtros.clinicaId && f.clinicaId !== filtros.clinicaId) return false;
      if (filtros.fecha && fechaLocal(f.creada) !== filtros.fecha) return false;
      if (q) {
        const haystack = normalizar(
          [
            f.numero,
            eq?.numeroEquipo,
            eq?.marca,
            eq?.modelo,
            eq?.numeroSerie,
          ].join(" "),
        );
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b.creada.localeCompare(a.creada));

  const hayFiltros =
    filtros.texto ||
    filtros.estado ||
    filtros.clinicaId ||
    filtros.fecha ||
    filtros.asignacion !== "todas";

  return (
    <div className="space-y-6">
      <Encabezado
        titulo={verTodas ? "Fichas" : "Mis fichas"}
        descripcion={
          verTodas
            ? "Consulta el estado de todos los equipos y abre el detalle de cada atención."
            : "Revisa las fichas asignadas a ti y el historial de tus equipos."
        }
      />

      <Tarjeta className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Campo
            etiqueta="Buscar"
            type="search"
            placeholder="Ficha, equipo, marca o serie"
            value={filtros.texto}
            onChange={cambiar("texto")}
            aria-label="Buscar ficha"
            autoComplete="off"
          />
          <Campo
            as="select"
            etiqueta="Estado"
            value={filtros.estado}
            onChange={cambiar("estado")}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_FICHA.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Campo>
          <Campo
            as="select"
            etiqueta="Clínica"
            value={filtros.clinicaId}
            onChange={cambiar("clinicaId")}
            aria-label="Filtrar por clínica"
          >
            <option value="">Todas las clínicas</option>
            {datos.clinicas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Campo>
          <Campo
            etiqueta="Fecha"
            type="date"
            value={filtros.fecha}
            onChange={cambiar("fecha")}
            aria-label="Filtrar por fecha de recepción"
          />
          {esTecnico && (
            <Campo
              as="select"
              etiqueta="Asignación"
              value={filtros.asignacion}
              onChange={cambiar("asignacion")}
              aria-label="Alcance"
            >
              <option value="todas">Todas las visibles</option>
              <option value="mias">Solo asignadas a mí</option>
            </Campo>
          )}
        </div>

        {hayFiltros && (
          <div className="mt-3 flex justify-end border-t border-neutral-200 pt-3">
            <Boton
              variante="enlace"
              onClick={() => setFiltros(FILTROS_VACIOS)}
            >
              Limpiar filtros
            </Boton>
          </div>
        )}
      </Tarjeta>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-700">
          Resultados
        </h2>
        <p className="text-sm text-neutral-600" aria-live="polite">
          {lista.length} {lista.length === 1 ? "ficha" : "fichas"}
        </p>
      </div>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={<IconoFichas className="h-6 w-6" />}
          titulo="No hay fichas que mostrar"
          descripcion={
            hayFiltros
              ? "Ninguna ficha coincide con los filtros seleccionados."
              : "Cuando se reciba un equipo aparecerá aquí con su estado y detalle."
          }
          accion={
            hayFiltros ? (
              <Boton
                variante="secundario"
                onClick={() => setFiltros(FILTROS_VACIOS)}
              >
                Limpiar filtros
              </Boton>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-3">
          {lista.map((f) => {
            const eq = datos.equipos.find((e) => e.id === f.equipoId);
            const clinica = datos.clinicas.find((c) => c.id === f.clinicaId);
            const asignada = f.tecnicosIds.includes(usuario.id);
            return (
              <Tarjeta as="li" key={f.id} className="overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-tinta">{f.numero}</p>
                        <Insignia estado={f.estado} />
                        {esTecnico &&
                          (asignada ? (
                            <Insignia tono="inacap">Asignada a ti</Insignia>
                          ) : (
                            <Insignia tono="neutral">
                              Historial del equipo
                            </Insignia>
                          ))}
                      </div>
                      <p className="text-sm font-medium text-neutral-700">
                        {[eq?.tipo, eq?.marca, eq?.modelo]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="text-xs leading-relaxed text-neutral-500">
                        {clinica?.nombre ?? "Clínica no disponible"} ·{" "}
                        {formatearFecha(fechaLocal(f.creada))}
                      </p>
                    </div>
                    <Boton
                      variante={
                        abierta === f.id ? "secundario" : "primario"
                      }
                      onClick={() =>
                        setAbierta(abierta === f.id ? null : f.id)
                      }
                      aria-expanded={abierta === f.id}
                    >
                      {abierta === f.id ? "Cerrar" : "Abrir"}
                    </Boton>
                  </div>

                  {abierta === f.id && (
                    <div className="mt-4 border-t border-neutral-200 pt-4">
                      <DetalleFicha ficha={f} />
                    </div>
                  )}
                </div>
              </Tarjeta>
            );
          })}
        </ul>
      )}
    </div>
  );
}
