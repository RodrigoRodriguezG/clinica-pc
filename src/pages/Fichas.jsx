import { useState } from "react";
import { useApp } from "../store.jsx";
import {
  ESTADOS_FICHA,
  ESTADO_POR_REASIGNAR,
  PERMISOS,
} from "../constantes.js";
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
import Seccion from "../components/ui/Seccion.jsx";
import BarraFiltros from "../components/ui/BarraFiltros.jsx";
import Chips from "../components/ui/Chips.jsx";
import { cx } from "../components/ui/cx.js";
import {
  IconoChevronAbajo,
  IconoFichas,
  IconoMonitor,
} from "../components/ui/iconos.jsx";

// Estados en los que el técnico tiene el equipo en su poder
const ESTADOS_EN_PODER = ["Recibido", "En reparación", "Listo"];
const EN_PODER = "en-poder";

const filtrosIniciales = (estado) => ({
  texto: "",
  estado,
  clinicaId: "",
  fecha: "",
});

const posicionEstado = (estado) => {
  const i = ESTADOS_FICHA.indexOf(estado);
  return i === -1 ? ESTADOS_FICHA.length : i;
};

export default function Fichas() {
  const { datos, usuario } = useApp();
  const esTecnico = puede(usuario, PERMISOS.REVISAR_EQUIPOS);
  const verTodas = puede(usuario, PERMISOS.VER_TODAS_FICHAS);
  const soloTecnico = esTecnico && !verTodas;
  const estadoPorDefecto = soloTecnico ? EN_PODER : "";

  const [filtros, setFiltros] = useState(() =>
    filtrosIniciales(estadoPorDefecto),
  );
  const [abierta, setAbierta] = useState(null);
  const limpiar = () => setFiltros(filtrosIniciales(estadoPorDefecto));

  const cambiar = (campo) => (e) =>
    setFiltros({ ...filtros, [campo]: e.target.value });

  const opcionesEstado = soloTecnico
    ? [
        { valor: EN_PODER, texto: "En mi poder" },
        ...ESTADOS_FICHA.filter((s) => s !== ESTADO_POR_REASIGNAR).map(
          (s) => ({ valor: s, texto: s }),
        ),
        { valor: "", texto: "Todas" },
      ]
    : [
        { valor: "", texto: "Todas" },
        ...ESTADOS_FICHA.map((s) => ({ valor: s, texto: s })),
      ];

  const q = normalizar(filtros.texto.trim());
  const lista = fichasVisibles(datos, usuario)
    .filter((f) => {
      const eq = datos.equipos.find((e) => e.id === f.equipoId);
      if (filtros.estado === EN_PODER) {
        if (
          !ESTADOS_EN_PODER.includes(f.estado) ||
          !f.tecnicosIds.includes(usuario.id)
        )
          return false;
      } else if (filtros.estado && f.estado !== filtros.estado) return false;
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
    .sort(
      (a, b) =>
        posicionEstado(a.estado) - posicionEstado(b.estado) ||
        b.creada.localeCompare(a.creada),
    );

  const hayFiltros =
    filtros.texto ||
    filtros.estado !== estadoPorDefecto ||
    filtros.clinicaId ||
    filtros.fecha;

  return (
    <div className="space-y-8">
      <Encabezado
        titulo={verTodas ? "Fichas" : "Mis fichas"}
        descripcion={
          verTodas
            ? "Consulta el estado de todos los equipos y abre el detalle de cada atención."
            : "Revisa las fichas asignadas a ti y el historial de tus equipos."
        }
      />

      <Seccion titulo="Resultados" contador={lista.length}>
        <BarraFiltros
          hayFiltros={Boolean(hayFiltros)}
          onLimpiar={limpiar}
          chips={
            <Chips
              etiqueta="Filtrar por estado"
              valor={filtros.estado}
              onChange={(v) => setFiltros({ ...filtros, estado: v })}
              opciones={opcionesEstado}
            />
          }
        >
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
        </BarraFiltros>

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
                  onClick={limpiar}
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
              const expandida = abierta === f.id;
              return (
                <Tarjeta
                  as="li"
                  key={f.id}
                  interactiva
                  className={cx(
                    "overflow-hidden",
                    expandida && "shadow-tarjeta-hover",
                  )}
                >
                  {/* Toda la cabecera abre y cierra el detalle */}
                  <button
                    type="button"
                    onClick={() => setAbierta(expandida ? null : f.id)}
                    aria-expanded={expandida}
                    aria-controls={`detalle-${f.id}`}
                    className={cx(
                      "group flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left [-webkit-tap-highlight-color:transparent] transition-colors duration-150 hover:bg-slate-50 sm:p-5",
                      expandida ? "rounded-t-tarjeta" : "rounded-tarjeta",
                    )}
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-inacap-tenue text-inacap-oscuro sm:flex"
                      >
                        <IconoMonitor className="h-5 w-5" />
                      </span>
                      <span className="block min-w-0">
                        <span className="block truncate text-xs font-semibold uppercase tracking-wide text-inacap">
                          {clinica?.nombre ?? "Clínica no disponible"}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="font-semibold leading-snug text-slate-900">
                            {[eq?.tipo, eq?.marca, eq?.modelo]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          <Insignia estado={f.estado} />
                          {esTecnico && !asignada && (
                            <Insignia tono="blanco" punto={false}>
                              Historial del equipo
                            </Insignia>
                          )}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-600">
                          <span className="font-medium tabular-nums text-slate-700">
                            {f.numero}
                          </span>{" "}
                          · {formatearFecha(fechaLocal(f.creada))}
                        </span>
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cx(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors duration-150 group-hover:bg-white group-hover:text-slate-900",
                        expandida && "bg-slate-100 text-slate-900",
                      )}
                    >
                      <IconoChevronAbajo
                        className={cx(
                          "h-5 w-5 transition-transform duration-150",
                          expandida && "rotate-180",
                        )}
                      />
                    </span>
                  </button>

                  {expandida && (
                    <div
                      id={`detalle-${f.id}`}
                      className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5"
                    >
                      <DetalleFicha ficha={f} />
                    </div>
                  )}
                </Tarjeta>
              );
            })}
          </ul>
        )}
      </Seccion>
    </div>
  );
}
