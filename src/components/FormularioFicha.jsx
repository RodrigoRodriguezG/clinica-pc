import { useState } from "react";
import { useApp } from "../store.jsx";
import { PERMISOS } from "../constantes.js";
import { puede } from "../lib/permisos.js";
import { normalizar } from "../lib/texto.js";
import { siguienteCodigo } from "../lib/codigos.js";

const ESTILO_INPUT = "border rounded-lg px-3 py-2 w-full bg-white";

export default function FormularioFicha({ equipo, onCancelar, onCreada }) {
  const { datos, actualizar, usuario } = useApp();

  // Si el equipo ya tenía datos (reingreso), el formulario parte con ellos
  const [form, setForm] = useState({
    marca: equipo.marca ?? "",
    modelo: equipo.modelo ?? "",
    numeroSerie: equipo.numeroSerie ?? "",
    accesorios: equipo.accesorios ?? "",
    diagnostico: "",
    trabajo: "",
    clinicaId: datos.clinicas[0]?.id ?? "",
    tecnicosIds: [],
  });
  const [error, setError] = useState("");

  const cambiar = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  // Técnicos activos que pueden revisar equipos
  const tecnicos = datos.usuarios.filter((u) =>
    puede(u, PERMISOS.REVISAR_EQUIPOS),
  );

  // Una pareja como máximo: 1 o 2 técnicos
  const alternarTecnico = (id) =>
    setForm((prev) => ({
      ...prev,
      tecnicosIds: prev.tecnicosIds.includes(id)
        ? prev.tecnicosIds.filter((t) => t !== id)
        : [...prev.tecnicosIds, id],
    }));

  const crear = (e) => {
    e.preventDefault();
    const marca = form.marca.trim();
    const modelo = form.modelo.trim();
    const numeroSerie = form.numeroSerie.trim();
    const diagnostico = form.diagnostico.trim();
    const trabajo = form.trabajo.trim();
    const clinica = datos.clinicas.find((c) => c.id === form.clinicaId);

    if (!marca || !modelo || !numeroSerie)
      return setError("Completa marca, modelo y número de serie.");
    if (
      datos.equipos.some(
        (x) =>
          x.id !== equipo.id &&
          normalizar(x.numeroSerie) === normalizar(numeroSerie),
      )
    )
      return setError("Ese número de serie ya está registrado en otro equipo.");
    if (!diagnostico || !trabajo)
      return setError("Completa el diagnóstico y el trabajo a realizar.");
    if (!clinica) return setError("Selecciona una clínica.");
    if (form.tecnicosIds.length < 1 || form.tecnicosIds.length > 2)
      return setError("Asigna uno o dos técnicos al equipo.");

    setError("");

    // El checklist se copia de la plantilla de la clínica, con el texto de cada ítem
    const plantilla = datos.plantillas.find(
      (p) => p.id === clinica.plantillaId,
    );
    const ficha = {
      id: crypto.randomUUID(),
      numero: siguienteCodigo("FT", datos.fichas, "numero"),
      clinicaId: clinica.id,
      equipoId: equipo.id,
      recepcionistaId: usuario.id,
      tecnicosIds: form.tecnicosIds,
      diagnostico,
      trabajo,
      estado: "Recibido",
      checklist: (plantilla?.items ?? []).map((i) => ({
        itemId: i.id,
        texto: i.texto,
        ok: null,
      })),
      observaciones: [],
      creada: new Date().toISOString(),
      cerrada: null,
    };

    actualizar((d) => ({
      ...d,
      equipos: d.equipos.map((x) =>
        x.id === equipo.id
          ? {
              ...x,
              marca,
              modelo,
              numeroSerie,
              accesorios: form.accesorios.trim(),
            }
          : x,
      ),
      fichas: [...d.fichas, ficha],
    }));
    onCreada(ficha);
  };

  return (
    <form onSubmit={crear} className="border rounded-lg p-4 space-y-4 mt-3">
      <h3 className="font-semibold">
        Recepción de {equipo.numeroEquipo} · {equipo.tipo}
      </h3>

      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-sm">
          Marca
          <input
            className={ESTILO_INPUT}
            value={form.marca}
            onChange={cambiar("marca")}
            maxLength={40}
            required
          />
        </label>
        <label className="text-sm">
          Modelo
          <input
            className={ESTILO_INPUT}
            value={form.modelo}
            onChange={cambiar("modelo")}
            maxLength={60}
            required
          />
        </label>
        <label className="text-sm">
          Número de serie
          <input
            className={ESTILO_INPUT}
            value={form.numeroSerie}
            onChange={cambiar("numeroSerie")}
            maxLength={40}
            required
          />
        </label>
      </div>

      <label className="block text-sm">
        Accesorios que deja el propietario
        <input
          className={ESTILO_INPUT}
          value={form.accesorios}
          onChange={cambiar("accesorios")}
          maxLength={120}
          placeholder="Ej. cargador, mouse"
        />
      </label>

      <label className="block text-sm">
        Diagnóstico
        <textarea
          className={ESTILO_INPUT}
          rows={2}
          value={form.diagnostico}
          onChange={cambiar("diagnostico")}
          maxLength={500}
          required
        />
      </label>

      <label className="block text-sm">
        Trabajo a realizar
        <textarea
          className={ESTILO_INPUT}
          rows={2}
          value={form.trabajo}
          onChange={cambiar("trabajo")}
          maxLength={500}
          required
        />
      </label>

      <label className="block text-sm">
        Clínica
        <select
          className={ESTILO_INPUT}
          value={form.clinicaId}
          onChange={cambiar("clinicaId")}
        >
          {datos.clinicas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="text-sm">
        <legend>Técnicos que revisarán el equipo (1 o 2)</legend>
        <div className="mt-1 grid sm:grid-cols-2 gap-1">
          {tecnicos.map((t) => {
            const marcado = form.tecnicosIds.includes(t.id);
            return (
              <label key={t.id} className="flex gap-2">
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternarTecnico(t.id)}
                  disabled={!marcado && form.tecnicosIds.length >= 2}
                />
                {t.nombre}
              </label>
            );
          })}
          {tecnicos.length === 0 && (
            <p className="text-neutral-600">No hay técnicos activos.</p>
          )}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button className="bg-[#EE0000] text-white rounded-lg py-2 px-4">
          Crear ficha
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="border rounded-lg py-2 px-4"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
