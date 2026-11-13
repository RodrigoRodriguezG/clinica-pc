import { useApp } from "../store.jsx";
import { PERMISOS, NOMBRE_ROL } from "../constantes.js";
import { puede } from "../lib/permisos.js";

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
    <div className="mt-3 border-t pt-3 space-y-3 text-sm">
      <label className="flex gap-2 font-semibold">
        <input
          type="checkbox"
          checked={Boolean(clinica.activa)}
          onChange={alternarActiva}
        />
        Clínica activa (solo una a la vez)
      </label>

      <fieldset>
        <legend className="font-semibold">Personal asignado</legend>
        <div className="mt-1 grid sm:grid-cols-2 gap-1">
          {personal.map((u) => (
            <label key={u.id} className="flex gap-2">
              <input
                type="checkbox"
                checked={ids.includes(u.id)}
                onChange={() => alternarPersona(u.id)}
              />
              {u.nombre}{" "}
              <span className="text-neutral-600">({NOMBRE_ROL[u.rol]})</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
