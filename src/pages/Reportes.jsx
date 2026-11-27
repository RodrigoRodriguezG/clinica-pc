import { useState } from "react";
import { useApp } from "../store.jsx";
import {
  alcanceTodas,
  clinicasPermitidas,
  motivoSinClinicas,
} from "../lib/sedes.js";
import {
  DIMENSIONES,
  contarPor,
  exportarReporte,
  filasReporte,
  resumen,
} from "../lib/reportes.js";
import Alerta from "../components/ui/Alerta.jsx";
import BarraFiltros from "../components/ui/BarraFiltros.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import { IconoDescargar, IconoGrafico } from "../components/ui/iconos.jsx";

const nombreClinica = (c) => `${c.nombre} · ${c.sede}`;

// Indicador: número grande con su etiqueta (y un detalle opcional)
function Indicador({ etiqueta, valor, detalle }) {
  return (
    <Tarjeta className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {etiqueta}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-tinta">{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-slate-600">{detalle}</p>}
    </Tarjeta>
  );
}

// Tabla de conteo con una barra horizontal proporcional (un solo color: es una
// sola medida). El número siempre está escrito, la barra solo lo acompaña.
function TablaConteo({ titulo, conteo, total }) {
  const maximo = Math.max(...conteo.map((c) => c.cantidad), 1);
  return (
    <Tarjeta className="p-4 sm:p-5">
      <h2 className="mb-3 text-base font-semibold text-slate-900">{titulo}</h2>
      <table className="w-full text-sm">
        <caption className="sr-only">{titulo}</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Valor</th>
            <th scope="col">Proporción</th>
            <th scope="col">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {conteo.map(({ valor, cantidad }) => (
            <tr key={valor} title={`${valor}: ${cantidad} de ${total}`}>
              <th
                scope="row"
                className="w-2/5 py-1.5 pr-3 text-left font-medium text-slate-700"
              >
                <span className="line-clamp-2 break-words">{valor}</span>
              </th>
              <td className="py-1.5" aria-hidden="true">
                <div className="h-2.5 w-full rounded-r bg-slate-100">
                  <div
                    className="h-full rounded-r bg-tinta-suave"
                    style={{ width: `${(cantidad / maximo) * 100}%` }}
                  />
                </div>
              </td>
              <td className="w-16 py-1.5 pl-3 text-right tabular-nums text-slate-800">
                {cantidad}
                <span className="ml-1 text-xs text-slate-500">
                  {Math.round((cantidad / total) * 100)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tarjeta>
  );
}

export default function Reportes() {
  const { datos, usuario } = useApp();
  // Con el permiso de su sede solo aparecen las clínicas de esa sede
  const clinicas = clinicasPermitidas(datos, usuario, "reportes");
  const todas = alcanceTodas(usuario, "reportes");
  const [clinicaId, setClinicaId] = useState("");
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState(false);

  const clinica = clinicas.find((c) => c.id === clinicaId);
  const filas = filasReporte(
    datos,
    clinica ? [clinica.id] : clinicas.map((c) => c.id),
  );
  const r = resumen(filas);
  const textoTodas = todas
    ? "Todas las clínicas"
    : `Todas las clínicas de ${usuario.sede || "mi sede"}`;

  const exportar = async () => {
    setError("");
    setExportando(true);
    try {
      await exportarReporte(
        filas,
        clinica ? nombreClinica(clinica) : textoTodas,
      );
    } catch {
      setError("No se pudo generar el archivo Excel. Inténtalo de nuevo.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Reportes"
        descripcion="Resumen de los equipos atendidos, exportable a Excel."
        acciones={
          <Boton
            onClick={exportar}
            disabled={filas.length === 0 || exportando}
          >
            <IconoDescargar className="h-4 w-4" />
            {exportando ? "Generando…" : "Exportar Excel"}
          </Boton>
        }
      />

      <BarraFiltros hayFiltros={Boolean(clinicaId)} onLimpiar={() => setClinicaId("")}>
        <Campo
          as="select"
          etiqueta="Clínica"
          value={clinicaId}
          onChange={(e) => setClinicaId(e.target.value)}
        >
          <option value="">{textoTodas}</option>
          {clinicas.map((c) => (
            <option key={c.id} value={c.id}>
              {nombreClinica(c)}
            </option>
          ))}
        </Campo>
      </BarraFiltros>

      {error && (
        <Alerta variante="error" role="alert">
          {error}
        </Alerta>
      )}

      {filas.length === 0 ? (
        <EstadoVacio
          icono={<IconoGrafico className="h-6 w-6" />}
          titulo="Sin fichas para reportar"
          descripcion={
            clinicas.length === 0
              ? motivoSinClinicas(usuario, "reportes")
              : "Esta selección todavía no tiene equipos recepcionados."
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador etiqueta="Fichas" valor={r.total} />
            <Indicador
              etiqueta="Entregadas"
              valor={r.entregadas}
              detalle={
                r.cierreAnticipado
                  ? `${r.cierreAnticipado} con cierre anticipado`
                  : undefined
              }
            />
            <Indicador
              etiqueta="Encuestas"
              valor={r.respuestas}
              detalle={
                r.tasaRespuesta !== null
                  ? `${r.tasaRespuesta}% de las entregadas`
                  : "Sin entregas aún"
              }
            />
            <Indicador
              etiqueta="Nota promedio"
              valor={r.notaPromedio !== null ? `${r.notaPromedio} / 5` : "—"}
              detalle={
                r.conformes !== null ? `${r.conformes}% conformes` : undefined
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {DIMENSIONES.map(({ campo, titulo }) => (
              <TablaConteo
                key={campo}
                titulo={titulo}
                conteo={contarPor(filas, campo)}
                total={filas.length}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
