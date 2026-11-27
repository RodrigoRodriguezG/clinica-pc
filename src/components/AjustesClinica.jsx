import { useApp } from "../store.jsx";
import { PERMISOS } from "../constantes.js";
import { nombreRol } from "../lib/roles.js";
import { puede } from "../lib/permisos.js";
import {
  anioDeClinica,
  clinicaEsActiva,
  asignacionEnOtraClinica,
  nombreClinica,
} from "../lib/clinicas.js";
import Alerta from "./ui/Alerta.jsx";
import { cx } from "./ui/cx.js";

export default function AjustesClinica({ clinica }) {
  const { datos, actualizar } = useApp();
  const ids = clinica.personalIds ?? [];
  const activa = clinicaEsActiva(clinica);
  const anio = anioDeClinica(clinica);
  const anioActual = new Date().getFullYear();

  // Personas que pueden trabajar en una clínica: recepcionan o revisan
  // equipos y son de la sede de la clínica. Quien ya estaba asignado desde
  // otra sede se sigue mostrando para poder quitarlo
  const personal = datos.usuarios.filter(
    (u) =>
      (puede(u, PERMISOS.RECEPCIONAR) || puede(u, PERMISOS.REVISAR_EQUIPOS)) &&
      (u.sede === clinica.sede || ids.includes(u.id)),
  );

  const alternarPersona = (id) => {
    // Una persona trabaja en una sola clínica por año: no se puede asignar a dos
    if (!ids.includes(id) && asignacionEnOtraClinica(datos, clinica, id))
      return;

    actualizar((d) => ({
      ...d,
      clinicas: d.clinicas.map((c) =>
        c.id !== clinica.id
          ? c
          : {
              ...c,
              personalIds: ids.includes(id)
                ? ids.filter((x) => x !== id)
                : [...ids, id],
            },
      ),
    }));
  };

  return (
    <div className="space-y-5">
      <Alerta
        variante={activa ? "exito" : "info"}
        titulo={activa ? "Clínica activa" : "Clínica inactiva"}
      >
        {anio === null
          ? "Esta clínica no tiene días definidos, por lo que no puede estar activa."
          : activa
            ? `Está activa porque es la clínica de ${anio}, el año en curso.`
            : `Está inactiva: corresponde a ${anio} y el año en curso es ${anioActual}.`}
      </Alerta>

      <fieldset className="space-y-3">
        <legend className="text-base font-semibold text-slate-900">
          Personal asignado
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
            {ids.length}
          </span>
        </legend>
        <p className="text-sm leading-relaxed text-slate-600">
          Marca a las personas que podrán recepcionar o revisar equipos en esta
          clínica. Cada persona trabaja en una sola sede por año.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {personal.map((u) => {
            const marcado = ids.includes(u.id);
            const otra = !marcado
              ? asignacionEnOtraClinica(datos, clinica, u.id)
              : null;
            return (
              <label
                key={u.id}
                className={cx(
                  "flex min-h-14 items-center gap-3 rounded-control border px-3 py-2.5 text-sm transition-colors duration-150",
                  marcado
                    ? "border-slate-400 bg-white shadow-sm"
                    : otra
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500"
                      : "cursor-pointer border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  marcado && "cursor-pointer",
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0"
                  checked={marcado}
                  disabled={Boolean(otra)}
                  onChange={() => alternarPersona(u.id)}
                  aria-label={`Asignar a ${u.nombre}`}
                />
                <span className="min-w-0">
                  <span className="block font-medium text-slate-800">
                    {u.nombre}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {nombreRol(datos, u.rol)}
                    {otra && ` · Ya asignado a ${nombreClinica(otra)}`}
                    {u.sede !== clinica.sede && " · De otra sede"}
                  </span>
                </span>
              </label>
            );
          })}
          {personal.length === 0 && (
            <p className="text-sm text-slate-600">
              No hay personas de {clinica.sede} con permisos de recepción o
              revisión. Asigna la sede a cada persona en Usuarios.
            </p>
          )}
        </div>
      </fieldset>
    </div>
  );
}
