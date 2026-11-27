import { useState } from "react";
import { useApp } from "../store.jsx";
import { nombreRol } from "../lib/roles.js";
import { validarCambioClave, validarDatosCuenta } from "../lib/usuarios.js";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import Seccion from "../components/ui/Seccion.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";

const CLAVES_VACIAS = { actual: "", nueva: "", confirmacion: "" };

// Cambia solo los campos indicados del usuario con sesión
const editarme = (actualizar, yo, cambios) =>
  actualizar((d) => ({
    ...d,
    usuarios: d.usuarios.map((u) => (u.id === yo.id ? { ...u, ...cambios } : u)),
  }));

function DatosPersonales() {
  const { datos, actualizar, usuario: yo } = useApp();
  const [form, setForm] = useState({
    nombre: yo.nombre,
    correo: yo.correo,
    clave: "",
  });
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const correoLimpio = form.correo.trim().toLowerCase();
  const cambiaCorreo = correoLimpio !== yo.correo;
  const hayCambios = form.nombre.trim() !== yo.nombre || cambiaCorreo;

  const cambiar = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value });
    setExito("");
  };

  const guardar = (e) => {
    e.preventDefault();
    const motivo = validarDatosCuenta(datos, yo, form);
    if (motivo) return setError(motivo);

    setError("");
    const nombre = form.nombre.trim();
    editarme(actualizar, yo, { nombre, correo: correoLimpio });
    setForm({ nombre, correo: correoLimpio, clave: "" });
    setExito(
      cambiaCorreo
        ? "Datos guardados. Desde ahora ingresa con tu nuevo correo."
        : "Datos guardados.",
    );
  };

  return (
    <Seccion
      titulo="Datos personales"
      descripcion="Tu nombre se muestra al equipo; el correo es con el que ingresas."
    >
      <Tarjeta className="p-5 sm:p-6">
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Nombre"
              value={form.nombre}
              onChange={cambiar("nombre")}
              required
              autoComplete="name"
            />
            <Campo
              etiqueta="Correo"
              type="email"
              value={form.correo}
              onChange={cambiar("correo")}
              required
              inputMode="email"
              autoComplete="email"
            />
          </div>

          {cambiaCorreo && (
            <Campo
              etiqueta="Contraseña actual"
              type="password"
              value={form.clave}
              onChange={cambiar("clave")}
              required
              autoComplete="current-password"
              ayuda="Necesaria para cambiar tu correo de ingreso."
              className="sm:max-w-[calc(50%-0.5rem)]"
            />
          )}

          <p className="text-sm text-slate-600">
            Rol: <strong>{nombreRol(datos, yo.rol)}</strong>
          </p>
          {/* La sede la asigna el administrador: aquí solo se muestra */}
          <p className="text-sm text-slate-600">
            Sede: <strong>{yo.sede || "Sin sede asignada"}</strong>{" "}
            <span className="text-xs text-slate-500">
              (la asigna el administrador)
            </span>
          </p>

          {error && (
            <Alerta variante="error" role="alert">
              {error}
            </Alerta>
          )}
          {exito && (
            <Alerta variante="exito" role="status">
              {exito}
            </Alerta>
          )}

          <div className="flex justify-end">
            <Boton type="submit" disabled={!hayCambios}>
              Guardar datos
            </Boton>
          </div>
        </form>
      </Tarjeta>
    </Seccion>
  );
}

function CambioClave() {
  const { actualizar, usuario: yo } = useApp();
  const [form, setForm] = useState(CLAVES_VACIAS);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const completo = form.actual && form.nueva && form.confirmacion;

  const cambiar = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value });
    setExito("");
  };

  const guardar = (e) => {
    e.preventDefault();
    const motivo = validarCambioClave(yo, form);
    if (motivo) return setError(motivo);

    setError("");
    editarme(actualizar, yo, { clave: form.nueva });
    setForm(CLAVES_VACIAS);
    setExito("Contraseña actualizada. Úsala la próxima vez que ingreses.");
  };

  return (
    <Seccion
      titulo="Contraseña"
      descripcion="Para cambiarla, confirma primero la contraseña actual."
    >
      <Tarjeta className="p-5 sm:p-6">
        <form onSubmit={guardar} className="space-y-4">
          <Campo
            etiqueta="Contraseña actual"
            type="password"
            value={form.actual}
            onChange={cambiar("actual")}
            required
            autoComplete="current-password"
            className="sm:max-w-[calc(50%-0.5rem)]"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Nueva contraseña"
              type="password"
              value={form.nueva}
              onChange={cambiar("nueva")}
              required
              autoComplete="new-password"
              ayuda="Mínimo 8 caracteres."
            />
            <Campo
              etiqueta="Repetir nueva contraseña"
              type="password"
              value={form.confirmacion}
              onChange={cambiar("confirmacion")}
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <Alerta variante="error" role="alert">
              {error}
            </Alerta>
          )}
          {exito && (
            <Alerta variante="exito" role="status">
              {exito}
            </Alerta>
          )}

          <div className="flex justify-end">
            <Boton type="submit" disabled={!completo}>
              Cambiar contraseña
            </Boton>
          </div>
        </form>
      </Tarjeta>
    </Seccion>
  );
}

export default function MiCuenta() {
  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Mi cuenta"
        descripcion="Tu nombre, correo de ingreso y contraseña."
      />
      <DatosPersonales />
      <CambioClave />
    </div>
  );
}
