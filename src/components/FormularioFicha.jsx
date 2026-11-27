import { useState } from "react";
import { useApp } from "../store.jsx";
import { nombreClinica } from "../lib/clinicas.js";
import { siguienteCodigo } from "../lib/codigos.js";
import { aplicarPlantilla, plantillaPorServicio } from "../lib/checklists.js";
import Alerta from "./ui/Alerta.jsx";
import Boton from "./ui/Boton.jsx";
import Campo from "./ui/Campo.jsx";
import SelectorTecnicos from "./SelectorTecnicos.jsx";
import { IconoMonitor } from "./ui/iconos.jsx";

export default function FormularioFicha({
  equipo,
  clinica,
  onCancelar,
  onCreada,
}) {
  const { datos, actualizar, usuario } = useApp();

  // El problema que escribió el propietario al inscribirse se usa en una sola
  // ficha. Si no hay (por ejemplo, un reingreso), se le pide uno nuevo
  const problemaInscrito = (equipo.problema ?? "").trim();
  const pedirProblema = !problemaInscrito;
  const esReingreso = datos.fichas.some((f) => f.equipoId === equipo.id);
  // Servicio que eligió el propietario al inscribirse ("" = Otro)
  const servicioInscrito = equipo.servicio ?? "";
  const plantilla = plantillaPorServicio(
    datos,
    servicioInscrito,
    clinica.id,
  );

  const [problema, setProblema] = useState("");
  const [tecnicosIds, setTecnicosIds] = useState([]);
  const [error, setError] = useState("");

  const alternarTecnico = (id) =>
    setTecnicosIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const crear = (e) => {
    e.preventDefault();
    const problemaFicha = pedirProblema ? problema.trim() : problemaInscrito;
    if (!problemaFicha)
      return setError("Anota el problema que indica el propietario.");
    if (tecnicosIds.length < 1 || tecnicosIds.length > 2)
      return setError("Asigna uno o dos técnicos al equipo.");
    setError("");

    // Si el propietario eligió un servicio, la ficha parte con su checklist
    // (copia de los ítems). Si eligió "Otro", el técnico lo elige después.
    const base = {
      id: crypto.randomUUID(),
      numero: siguienteCodigo("FT", datos.fichas, "numero"),
      clinicaId: clinica.id,
      equipoId: equipo.id,
      recepcionistaId: usuario.id,
      tecnicosIds,
      diagnostico: problemaFicha, // el problema lo indica el propietario
      trabajo: "", // lo registra el técnico
      estado: "Recibido",
      plantillaId: null,
      servicio: "",
      checklist: [],
      observaciones: [],
      creada: new Date().toISOString(),
      cerrada: null,
    };
    const ficha = plantilla ? aplicarPlantilla(base, plantilla) : base;

    // El problema y el servicio quedan en la ficha; el equipo los libera
    // para la próxima visita
    actualizar((d) => ({
      ...d,
      equipos: d.equipos.map((x) =>
        x.id === equipo.id ? { ...x, problema: "", servicio: "" } : x,
      ),
      fichas: [...d.fichas, ficha],
    }));
    onCreada(ficha);
  };

  return (
    <form
      onSubmit={crear}
      className="mt-4 space-y-4 rounded-control border border-slate-200 bg-slate-50 p-4 sm:p-5"
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-white text-inacap shadow-sm ring-1 ring-slate-200"
        >
          <IconoMonitor className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">
            Recepción de {equipo.numeroEquipo} · {equipo.tipo}
          </h3>
          <p className="text-sm text-slate-600">Clínica: {nombreClinica(clinica)}</p>
        </div>
      </header>

      {pedirProblema ? (
        <Campo
          as="textarea"
          etiqueta="Problema que indica el propietario"
          ayuda={
            esReingreso
              ? "Este equipo ya vino antes. Pregúntale al propietario qué problema tiene ahora y anótalo tal como lo cuenta."
              : "El propietario no indicó el problema al inscribirse. Pregúntale y anótalo tal como lo cuenta."
          }
          rows={2}
          maxLength={500}
          placeholder="Ej. Está muy lento y se apaga solo."
          value={problema}
          onChange={(e) => setProblema(e.target.value)}
          autoComplete="off"
        />
      ) : (
        <div className="rounded-control border border-slate-200 bg-white p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Problema (según el propietario)
          </p>
          <p className="mt-0.5 text-slate-800">{problemaInscrito}</p>
        </div>
      )}

      <div className="rounded-control border border-slate-200 bg-white p-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Servicio solicitado
        </p>
        <p className="mt-0.5 text-slate-800">
          {plantilla
            ? plantilla.nombre
            : "Otro: el técnico elegirá el checklist al revisar el equipo."}
        </p>
      </div>

      <SelectorTecnicos
        clinica={clinica}
        seleccion={tecnicosIds}
        onAlternar={alternarTecnico}
      />

      {error && (
        <Alerta variante="error" role="alert">
          {error}
        </Alerta>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Boton type="submit" bloque className="sm:w-auto">
          Crear ficha
        </Boton>
        <Boton variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
