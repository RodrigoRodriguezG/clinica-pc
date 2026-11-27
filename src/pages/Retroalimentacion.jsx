import { useState } from "react";
import { useApp } from "../store.jsx";
import { nombreClinica } from "../lib/clinicas.js";
import {
  alcanceTodas,
  clinicasPermitidas,
  motivoSinClinicas,
} from "../lib/sedes.js";
import { ESTADO_ENTREGADO } from "../constantes.js";
import { notaPromedio, porcentaje } from "../lib/encuestas.js";
import BarraFiltros from "../components/ui/BarraFiltros.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import Seccion from "../components/ui/Seccion.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import { IconoEstrella } from "../components/ui/iconos.jsx";

const fechaHora = (iso) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });

function Dato({ etiqueta, valor }) {
  return (
    <Tarjeta className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {etiqueta}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-tinta">{valor}</p>
    </Tarjeta>
  );
}

// Respuestas de la encuesta de satisfacción (RF-10)
export default function Retroalimentacion() {
  const { datos, usuario } = useApp();
  // Con el permiso de su sede solo aparecen las clínicas de esa sede
  const clinicas = clinicasPermitidas(datos, usuario, "retro");
  const todas = alcanceTodas(usuario, "retro");
  const [clinicaId, setClinicaId] = useState("");
  const ids = clinicas
    .filter((c) => !clinicaId || c.id === clinicaId)
    .map((c) => c.id);

  const fichas = datos.fichas.filter((f) => ids.includes(f.clinicaId));
  const idsFichas = new Set(fichas.map((f) => f.id));
  const respuestas = (datos.retros ?? [])
    .filter((r) => idsFichas.has(r.fichaId))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const entregadas = fichas.filter((f) => f.estado === ESTADO_ENTREGADO).length;
  const promedio = notaPromedio(respuestas);
  const conformes = porcentaje(
    respuestas.filter((r) => r.conforme).length,
    respuestas.length,
  );
  const tasa = porcentaje(respuestas.length, entregadas);

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Retroalimentación"
        descripcion="Respuestas de la encuesta de satisfacción."
      />

      <BarraFiltros
        hayFiltros={Boolean(clinicaId)}
        onLimpiar={() => setClinicaId("")}
      >
        <Campo
          as="select"
          etiqueta="Clínica"
          value={clinicaId}
          onChange={(e) => setClinicaId(e.target.value)}
        >
          <option value="">
            {todas
              ? "Todas las clínicas"
              : `Todas las clínicas de ${usuario.sede || "mi sede"}`}
          </option>
          {clinicas.map((c) => (
            <option key={c.id} value={c.id}>
              {nombreClinica(c)}
            </option>
          ))}
        </Campo>
      </BarraFiltros>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Dato etiqueta="Respuestas" valor={respuestas.length} />
        <Dato
          etiqueta="Nota promedio"
          valor={promedio !== null ? `${promedio} / 5` : "—"}
        />
        <Dato
          etiqueta="Conformes"
          valor={conformes !== null ? `${conformes}%` : "—"}
        />
        <Dato
          etiqueta="Tasa de respuesta"
          valor={tasa !== null ? `${tasa}%` : "—"}
        />
      </div>

      <Seccion titulo="Respuestas" contador={respuestas.length}>
        {respuestas.length === 0 ? (
          <EstadoVacio
            icono={<IconoEstrella className="h-6 w-6" />}
            titulo="Aún no hay respuestas"
            descripcion={
              clinicas.length === 0
                ? motivoSinClinicas(usuario, "retro")
                : "Las respuestas aparecen cuando los propietarios escanean el QR de la encuesta al retirar su equipo."
            }
          />
        ) : (
          <ul className="space-y-3">
            {respuestas.map((r) => {
              const ficha = datos.fichas.find((f) => f.id === r.fichaId);
              const equipo = datos.equipos.find(
                (e) => e.id === ficha?.equipoId,
              );
              const clinica = datos.clinicas.find(
                (c) => c.id === ficha?.clinicaId,
              );
              return (
                <li key={r.id}>
                  <Tarjeta className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {ficha?.numero} · {equipo?.numeroEquipo} ·{" "}
                        {equipo?.tipo}
                      </p>
                      <div className="flex items-center gap-2">
                        <Insignia tono="blanco" punto={false}>
                          Nota {r.nota}/5
                        </Insignia>
                        <Insignia tono={r.conforme ? "exito" : "aviso"}>
                          {r.conforme ? "Conforme" : "Con reparos"}
                        </Insignia>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      {clinica && `${nombreClinica(clinica)} · `}
                      {fechaHora(r.fecha)}
                    </p>
                    {r.comentario && (
                      <p className="text-sm leading-relaxed text-slate-700">
                        “{r.comentario}”
                      </p>
                    )}
                  </Tarjeta>
                </li>
              );
            })}
          </ul>
        )}
      </Seccion>
    </div>
  );
}
