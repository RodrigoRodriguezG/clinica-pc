import { useApp } from "../store.jsx";
import { PERMISOS, NOMBRE_ROL } from "../constantes.js";
import { puede } from "../lib/permisos.js";
import {
  anioDeClinica,
  clinicaEsActiva,
  asignacionEnOtraClinica,
} from "../lib/clinicas.js";
import Insignia from "./ui/Insignia.jsx";

export default function AjustesClinica({ clinica }) {
  const { datos, actualizar } = useApp();
  const ids = clinica.personalIds ?? [];
  const activa = clinicaEsActiva(clinica);
  const anio = anioDeClinica(clinica);
  const anioActual = new Date().getFullYear();

  // Personas que pueden trabajar en una clínica: recepcionan o revisan equipos
  const personal = datos.usuarios.filter(
    (u) => puede(u, PERMISOS.RECEPCIONAR) || puede(u, PERMISOS.REVISAR_EQUIPOS),
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
    <section className="space-y-4 rounded-control border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-tinta">
            Configuración de la clínica
          </h2>
          <p className="text-sm text-neutral-600">
            Define quién puede trabajar en esta clínica.
          </p>
        </div>
        <Insignia tono={activa ? "exito" : "neutral"}>
          {activa ? "Activa" : "Inactiva"}
        </Insignia>
      </div>

      <p className="rounded-control border border-neutral-200 bg-neutral-50 p-3.5 text-sm leading-relaxed text-neutral-700">
        {anio === null
          ? "Esta clínica no tiene días definidos, por lo que no puede estar activa."
          : activa
            ? `Está activa porque es la clínica de ${anio}, el año en curso.`
            : `Está inactiva: corresponde a ${anio} y el año en curso es ${anioActual}.`}
      </p>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-tinta">
          Personal asignado
        </legend>
        <p className="text-xs leading-relaxed text-neutral-600">
          Selecciona a las personas que podrán recepcionar o revisar equipos en
          esta clínica. Cada persona trabaja en una sola sede por año.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {personal.map((u) => {
            const marcado = ids.includes(u.id);
            const otra = !marcado
              ? asignacionEnOtraClinica(datos, clinica, u.id)
              : null;
            return (
              <label
                key={u.id}
                className={`flex min-h-11 items-center gap-3 rounded-control border border-neutral-200 px-3 py-2 text-sm transition-colors duration-150 ${
                  otra
                    ? "cursor-not-allowed bg-neutral-50 text-neutral-500"
                    : "cursor-pointer bg-white hover:border-neutral-300 hover:bg-neutral-50"
                }`}
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
                  <span className="font-medium text-neutral-800">
                    {u.nombre}
                  </span>{" "}
                  <span className="text-neutral-500">
                    ({NOMBRE_ROL[u.rol]})
                  </span>
                  {otra && (
                    <span className="block text-xs text-neutral-500">
                      Ya asignado a {otra.sede}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
          {personal.length === 0 && (
            <p className="text-sm text-neutral-600">
              No hay usuarios con permisos de recepción o revisión.
            </p>
          )}
        </div>
      </fieldset>
    </section>
  );
}
