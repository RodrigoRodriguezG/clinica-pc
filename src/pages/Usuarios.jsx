import { useState } from "react";
import { useApp } from "../store.jsx";
import {
  NOMBRE_ROL,
  ETIQUETA_PERMISO,
  PERMISOS_POR_ROL,
  PERMISOS,
} from "../constantes.js";

const FORMULARIO_VACIO = { nombre: "", correo: "", clave: "", rol: "tecnico" };

export default function Usuarios() {
  const { datos, actualizar, usuario: yo } = useApp();
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [error, setError] = useState("");

  // Actualiza un solo campo del formulario sin perder los demás
  const cambiar = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  const crear = (e) => {
    e.preventDefault();
    const correo = form.correo.trim().toLowerCase();

    if (form.clave.length < 8)
      return setError("La contraseña debe tener al menos 8 caracteres.");
    if (datos.usuarios.some((u) => u.correo === correo))
      return setError("Ese correo ya está registrado.");

    setError("");
    const nuevo = {
      id: crypto.randomUUID(),
      nombre: form.nombre.trim(),
      correo,
      clave: form.clave,
      rol: form.rol,
      permisos: PERMISOS_POR_ROL[form.rol], // permisos iniciales según el rol
      activo: true,
    };
    actualizar((d) => ({ ...d, usuarios: [...d.usuarios, nuevo] }));
    setForm(FORMULARIO_VACIO);
  };

  // Activa o desactiva un permiso de un usuario
  const alternarPermiso = (id, permiso) =>
    actualizar((d) => ({
      ...d,
      usuarios: d.usuarios.map((u) => {
        if (u.id !== id) return u;
        const tiene = u.permisos.includes(permiso);
        return {
          ...u,
          permisos: tiene
            ? u.permisos.filter((p) => p !== permiso)
            : [...u.permisos, permiso],
        };
      }),
    }));

  // Dar de baja o reactivar (no se borra: se conserva el historial)
  const alternarActivo = (id) =>
    actualizar((d) => ({
      ...d,
      usuarios: d.usuarios.map((u) =>
        u.id === id ? { ...u, activo: !u.activo } : u,
      ),
    }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Usuarios y permisos</h1>

      <form onSubmit={crear} className="grid sm:grid-cols-5 gap-3 items-end">
        <input
          className="border rounded px-3 py-2"
          placeholder="Nombre"
          value={form.nombre}
          onChange={cambiar("nombre")}
          required
        />
        <input
          className="border rounded px-3 py-2"
          type="email"
          placeholder="Correo"
          value={form.correo}
          onChange={cambiar("correo")}
          required
        />
        <input
          className="border rounded px-3 py-2"
          type="password"
          placeholder="Contraseña inicial"
          value={form.clave}
          onChange={cambiar("clave")}
          required
        />
        <select
          className="border rounded px-3 py-2"
          value={form.rol}
          onChange={cambiar("rol")}
        >
          {Object.keys(NOMBRE_ROL).map((r) => (
            <option key={r} value={r}>
              {NOMBRE_ROL[r]}
            </option>
          ))}
        </select>
        <button className="bg-[#EE0000] text-white rounded py-2">
          Crear usuario
        </button>
        {error && (
          <p role="alert" className="sm:col-span-5 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>

      <div className="space-y-4">
        {datos.usuarios.map((u) => {
          const esYo = u.id === yo.id;
          return (
            <article
              key={u.id}
              className={`border rounded p-4 ${u.activo ? "" : "opacity-60"}`}
            >
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold">
                    {u.nombre} {esYo && "(tú)"}
                  </h2>
                  <p className="text-sm text-neutral-600">
                    {u.correo} · {NOMBRE_ROL[u.rol]}
                  </p>
                </div>
                {!esYo && (
                  <button
                    onClick={() => alternarActivo(u.id)}
                    className="text-sm underline"
                  >
                    {u.activo ? "Dar de baja" : "Reactivar"}
                  </button>
                )}
              </header>

              <div className="mt-3 grid sm:grid-cols-2 gap-1 text-sm">
                {Object.entries(ETIQUETA_PERMISO).map(([permiso, etiqueta]) => (
                  <label key={permiso} className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={u.permisos.includes(permiso)}
                      onChange={() => alternarPermiso(u.id, permiso)}
                      disabled={esYo && permiso === PERMISOS.GESTIONAR_USUARIOS}
                    />
                    {etiqueta}
                  </label>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
