import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store.jsx";
import { normalizar } from "../lib/texto.js";
import { formatearFecha } from "../lib/fechas.js";


const FORMULARIO_VACIO = { nombre: "", sede: "", plantillaId: "" };

export default function Clinicas() {
  const { datos, actualizar } = useApp();

  // Se parte con la primera plantilla seleccionada
  const [form, setForm] = useState(() => ({
    ...FORMULARIO_VACIO,
    plantillaId: datos.plantillas[0]?.id ?? "",
  }));
  const [dias, setDias] = useState([]);
  const [dia, setDia] = useState("");
  const [filtro, setFiltro] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [error, setError] = useState("");

  // Actualiza un solo campo del formulario sin perder los demás
  const cambiar = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  const nombrePlantilla = (id) =>
    datos.plantillas.find((p) => p.id === id)?.nombre ?? "Sin plantilla";

  // Agrega una fecha a la lista, sin duplicados y ordenada
  const agregarDia = () => {
    if (!dia) return;
    setDias((prev) => (prev.includes(dia) ? prev : [...prev, dia].sort()));
    setDia("");
  };

  const quitarDia = (fecha) =>
    setDias((prev) => prev.filter((d) => d !== fecha));

  const crear = (e) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const sede = form.sede.trim();

    if (dias.length === 0)
      return setError("Agrega al menos un día para la clínica.");
    if (!form.plantillaId)
      return setError("Selecciona una plantilla de checklist.");
    if (
      datos.clinicas.some(
        (c) => c.nombre.trim().toLowerCase() === nombre.toLowerCase(),
      )
    )
      return setError("Ya existe una clínica con ese nombre.");

    setError("");
    const nueva = {
      id: crypto.randomUUID(),
      nombre,
      sede,
      dias, // ya viene ordenado
      plantillaId: form.plantillaId,
    };
    actualizar((d) => ({ ...d, clinicas: [...d.clinicas, nueva] }));

    // Limpiar el formulario
    setForm({
      ...FORMULARIO_VACIO,
      plantillaId: datos.plantillas[0]?.id ?? "",
    });
    setDias([]);
    setDia("");
  };

  // Filtro en vivo por nombre o sede, y por fecha
  const busqueda = normalizar(filtro.trim());
  const busquedaFecha = normalizar(filtroFecha.trim());

  const coincideFecha = (c) => {
    if (!busquedaFecha) return true;
    return c.dias.some(
      (fecha) =>
        normalizar(formatearFecha(fecha)).includes(busquedaFecha) ||
        normalizar(fecha).includes(busquedaFecha),
    );
  };

  const clinicasVisibles = datos.clinicas.filter((c) => {
    const coincideTexto =
      !busqueda ||
      normalizar(c.nombre).includes(busqueda) ||
      normalizar(c.sede).includes(busqueda);
    return coincideTexto && coincideFecha(c);
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Clínicas</h1>

      <form onSubmit={crear} className="space-y-3">
        <div className="grid sm:grid-cols-4 gap-3 items-end">
          <input
            className="border rounded px-3 py-2"
            placeholder="Nombre"
            value={form.nombre}
            onChange={cambiar("nombre")}
            required
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Sede"
            value={form.sede}
            onChange={cambiar("sede")}
            required
          />
          <select
            className="border rounded px-3 py-2"
            value={form.plantillaId}
            onChange={cambiar("plantillaId")}
          >
            {datos.plantillas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <button className="bg-[#EE0000] text-white rounded py-2">
            Crear clínica
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            aria-label="Día de la clínica"
          />
          <button
            type="button"
            onClick={agregarDia}
            className="border rounded px-3 py-2"
          >
            Agregar día
          </button>

          {dias.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {dias.map((fecha) => (
                <li
                  key={fecha}
                  className="flex items-center gap-2 bg-neutral-100 rounded px-2 py-1 text-sm"
                >
                  {formatearFecha(fecha)}
                  <button
                    type="button"
                    onClick={() => quitarDia(fecha)}
                    aria-label={`Quitar ${fecha}`}
                    className="text-neutral-600"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </form>

      <div className="flex flex-wrap items-end gap-3">
        <input
          type="search"
          className="border rounded px-3 py-2 w-full sm:max-w-sm"
          placeholder="Filtrar por nombre o sede"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          aria-label="Filtrar clínicas por nombre o sede"
        />
        <input
          type="search"
          className="border rounded px-3 py-2"
          placeholder="Filtrar por día (ej. 09/10/2026)"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          aria-label="Filtrar clínicas por día"
        />
        {(filtro || filtroFecha) && (
          <button
            type="button"
            onClick={() => {
              setFiltro("");
              setFiltroFecha("");
            }}
            className="text-sm underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {clinicasVisibles.length === 0 && (
        <p className="text-sm text-neutral-600">
          No hay clínicas que coincidan con el filtro.
        </p>
      )}

      {clinicasVisibles.map((c) => (
        <Link
          key={c.id}
          to={`/clinicas/${c.id}`}
          className="block border rounded p-4 hover:border-[#EE0000] hover:shadow-sm transition"
        >
          <header className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">{c.nombre}</h2>
              <p className="text-sm text-neutral-600">
                {c.sede} · Plantilla: {nombrePlantilla(c.plantillaId)}
              </p>
            </div>
            <span className="text-sm text-[#EE0000]">Ver detalle →</span>
          </header>
          <p className="mt-3 text-sm">
            {c.dias.length > 0
              ? c.dias.map(formatearFecha).join(" · ")
              : "Sin días definidos"}
          </p>
        </Link>
      ))}
    </div>
  );
}
