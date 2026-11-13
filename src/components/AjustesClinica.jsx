import { useApp } from "../store.jsx";
import { PERMISOS, NOMBRE_ROL } from "../constantes.js";
import { puede } from "../lib/permisos.js";
import Insignia from "./ui/Insignia.jsx";

export default function AjustesClinica({ clinica }) {
  const { datos, actualizar } = useApp();
  const ids = clinica.personalIds ?? [];

  // Personas que pueden trabajar en una clínica: recepcionan o revisan equipos
  const personal = datos.usuarios.filter(
    (u) => puede(u, PERMISOS.RECEPCIONAR) || puede(u, PERMISOS.REVISAR_EQUIPOS),
  );

  // Al activar una clínica, las demás se desactivan (solo una activa a la vez)
  const alternarActiva = () =>
    actualizar((d) => ({
      ...d,
      clinicas: d.clinicas.map((c) => {
        if (c.id === clinica.id) return { ...c, activa: !clinica.activa };
        return clinica.activa ? c : { ...c, activa: false };
      }),
    }));

  const alternarPersona = (id) =>
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

  return (
    <section className="space-y-4 rounded-control border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-tinta">
            Configuración de la clínica
          </h2>
          <p className="text-sm text-neutral-600">
            Activa la clínica y define quién puede trabajar en ella.
          </p>
        </div>
        {clinica.activa && <Insignia tono="exito">Activa</Insignia>}
      </div>

      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-control border border-neutral-200 bg-neutral-50 p-3.5 text-sm transition-colors duration-150 hover:border-neutral-300">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0"
          checked={Boolean(clinica.activa)}
          onChange={alternarActiva}
        />
        <span>
          <span className="font-semibold text-tinta">
            Clínica activa (solo una a la vez)
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">
            Al activarla, las demás clínicas se desactivan automáticamente.
          </span>
        </span>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-tinta">
          Personal asignado
        </legend>
        <p className="text-xs leading-relaxed text-neutral-600">
          Selecciona a las personas que podrán recepcionar o revisar equipos en
          esta clínica.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {personal.map((u) => (
            <label
              key={u.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-neutral-200 bg-white px-3 py-2 text-sm transition-colors duration-150 hover:border-neutral-300 hover:bg-neutral-50"
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0"
                checked={ids.includes(u.id)}
                onChange={() => alternarPersona(u.id)}
                aria-label={`Asignar a ${u.nombre}`}
              />
              <span className="min-w-0">
                <span className="font-medium text-neutral-800">{u.nombre}</span>{" "}
                <span className="text-neutral-500">
                  ({NOMBRE_ROL[u.rol]})
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
