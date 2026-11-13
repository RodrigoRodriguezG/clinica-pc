import { useState } from "react";
import { useApp } from "../store.jsx";
import { ESTADOS_FICHA, PERMISOS } from "../constantes.js";
import { puede } from "../lib/permisos.js";
import { normalizar } from "../lib/texto.js";
import { formatearFecha, fechaLocal } from "../lib/fechas.js";
import { fichasVisibles } from "../lib/fichas.js";
import DetalleFicha from "../components/DetalleFicha.jsx";

export default function Fichas() {
  const { datos, usuario } = useApp();
  const [filtros, setFiltros] = useState({
    texto: "",
    estado: "",
    clinicaId: "",
    fecha: "",
    asignacion: "todas",
  });
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
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold">
        {verTodas ? "Fichas" : "Mis fichas"}
      </h1>

      <div className="flex flex-wrap gap-3 items-end">
        <input
          type="search"
          className="border rounded-lg px-3 py-2"
          placeholder="Ficha, equipo, marca o serie"
          value={filtros.texto}
          onChange={cambiar("texto")}
          aria-label="Buscar ficha"
        />
        <select
          className="border rounded-lg px-3 py-2"
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
        </select>
        <select
          className="border rounded-lg px-3 py-2"
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
        </select>
        <input
          type="date"
          className="border rounded-lg px-3 py-2"
          value={filtros.fecha}
          onChange={cambiar("fecha")}
          aria-label="Filtrar por fecha de recepción"
        />
        {esTecnico && (
          <select
            className="border rounded-lg px-3 py-2"
            value={filtros.asignacion}
            onChange={cambiar("asignacion")}
            aria-label="Alcance"
          >
            <option value="todas">Todas las visibles</option>
            <option value="mias">Solo asignadas a mí</option>
          </select>
        )}
        {hayFiltros && (
          <button
            onClick={() =>
              setFiltros({
                texto: "",
                estado: "",
                clinicaId: "",
                fecha: "",
                asignacion: "todas",
              })
            }
            className="text-sm underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <p className="text-sm text-neutral-600">
        {lista.length} {lista.length === 1 ? "ficha" : "fichas"}
      </p>

      <ul className="space-y-3">
        {lista.map((f) => {
          const eq = datos.equipos.find((e) => e.id === f.equipoId);
          const clinica = datos.clinicas.find((c) => c.id === f.clinicaId);
          const asignada = f.tecnicosIds.includes(usuario.id);
          return (
            <li key={f.id} className="border rounded-lg p-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <p className="font-semibold">
                    {f.numero} · {eq?.tipo} {eq?.marca} {eq?.modelo}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {f.estado} · {clinica?.nombre ?? "Clínica no disponible"} ·{" "}
                    {formatearFecha(fechaLocal(f.creada))}
                    {esTecnico &&
                      (asignada
                        ? " · Asignada a ti"
                        : " · Historial del equipo")}
                  </p>
                </div>
                <button
                  onClick={() => setAbierta(abierta === f.id ? null : f.id)}
                  className="underline text-sm"
                >
                  {abierta === f.id ? "Cerrar" : "Abrir"}
                </button>
              </div>
              {abierta === f.id && <DetalleFicha ficha={f} />}
            </li>
          );
        })}
        {lista.length === 0 && (
          <li className="text-neutral-600">No hay fichas que mostrar.</li>
        )}
      </ul>
    </div>
  );
}
