import { useState } from "react";
import { useApp } from "../store.jsx";
import { NOMBRE_ROL } from "../constantes.js";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import {
  IconoChevronAbajo,
  IconoEscudo,
  IconoMonitor,
} from "../components/ui/iconos.jsx";

const REGISTRO_VACIO = { nombre: "", correo: "", clave: "", confirmar: "" };

export default function Login() {
  const { ingresar, registrar, datos } = useApp();
  const [modo, setModo] = useState("ingresar"); // 'ingresar' | 'registro'
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [registro, setRegistro] = useState(REGISTRO_VACIO);
  const [error, setError] = useState("");

  const esRegistro = modo === "registro";

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setError("");
  };

  const cambiarRegistro = (campo) => (e) =>
    setRegistro({ ...registro, [campo]: e.target.value });

  const enviar = (e) => {
    e.preventDefault();
    setError(ingresar(correo, clave));
  };

  const enviarRegistro = (e) => {
    e.preventDefault();
    const nombre = registro.nombre.trim();

    if (nombre.length < 3) return setError("Escribe tu nombre completo.");
    if (registro.clave.length < 8)
      return setError("La contraseña debe tener al menos 8 caracteres.");
    if (registro.clave !== registro.confirmar)
      return setError("Las contraseñas no coinciden.");

    // El rol no se envía: el registro siempre crea una cuenta de técnico
    const resultado = registrar({
      nombre,
      correo: registro.correo,
      clave: registro.clave,
    });
    setError(resultado ?? "");
  };

  return (
    <main className="min-h-screen bg-neutral-100 lg:grid lg:grid-cols-2">
      {/* Marca institucional en escritorio */}
      <section className="relative hidden overflow-hidden bg-tinta px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-inacap/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full border border-white/10"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-inacap text-white">
            <IconoMonitor className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-bold leading-tight text-white">
              Clínica del PC
            </p>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              INACAP
            </p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">
            Sistema de gestión
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            Clínica del PC
          </h1>
          <div aria-hidden="true" className="mt-8 h-1 w-16 bg-inacap" />
        </div>

        <p className="relative flex items-center gap-2 text-xs text-neutral-500">
          <IconoEscudo className="h-4 w-4" />
          Acceso para el equipo que participa en la clínica
        </p>
      </section>

      {/* Formulario */}
      <section className="flex min-h-screen flex-col justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-inacap text-white">
              <IconoMonitor className="h-6 w-6" />
            </span>
            <div>
              <p className="text-base font-bold leading-tight text-tinta">
                Clínica del PC
              </p>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                INACAP
              </p>
            </div>
          </div>

          <Tarjeta className="p-6 sm:p-8">
            {!esRegistro ? (
              <>
                <header className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-tinta">
                    Ingresar
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Usa tu cuenta para acceder al sistema.
                  </p>
                </header>

                <form onSubmit={enviar} className="space-y-4">
                  <Campo
                    etiqueta="Correo"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    autoComplete="username"
                    inputMode="email"
                    placeholder="nombre@inacap.cl"
                  />

                  <Campo
                    etiqueta="Contraseña"
                    type="password"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                  />

                  {error && (
                    <Alerta variante="error" role="alert">
                      {error}
                    </Alerta>
                  )}

                  <Boton type="submit" bloque tamano="lg">
                    Entrar
                  </Boton>

                  <details className="group rounded-control border border-neutral-200 bg-neutral-50">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold text-neutral-600 transition-colors duration-150 hover:text-tinta [&::-webkit-details-marker]:hidden">
                      Cuentas de demostración (clave: Demo1234)
                      <IconoChevronAbajo className="h-4 w-4 shrink-0 transition-transform duration-150 group-open:rotate-180" />
                    </summary>
                    <ul className="space-y-1 border-t border-neutral-200 px-3 py-2.5">
                      {datos.usuarios.map((u) => (
                        <li
                          key={u.id}
                          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 py-1 text-xs"
                        >
                          <span className="break-all text-neutral-700">
                            {u.correo}
                          </span>
                          <span className="text-neutral-500">
                            {NOMBRE_ROL[u.rol]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </form>

                <div className="mt-6 border-t border-neutral-200 pt-5 text-center">
                  <p className="mb-2 text-sm text-neutral-600">
                    ¿Eres técnico y aún no tienes cuenta?
                  </p>
                  <Boton
                    type="button"
                    variante="secundario"
                    bloque
                    onClick={() => cambiarModo("registro")}
                  >
                    Crear cuenta
                  </Boton>
                </div>
              </>
            ) : (
              <>
                <header className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-tinta">
                    Crear cuenta
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Tu cuenta se crea como técnico. Si necesitas otro rol, el
                    administrador del sistema lo cambia después.
                  </p>
                </header>

                <form onSubmit={enviarRegistro} className="space-y-4">
                  <Campo
                    etiqueta="Nombre completo"
                    value={registro.nombre}
                    onChange={cambiarRegistro("nombre")}
                    required
                    autoComplete="name"
                    maxLength={80}
                    placeholder="Nombre y apellido"
                  />

                  <Campo
                    etiqueta="Correo"
                    type="email"
                    value={registro.correo}
                    onChange={cambiarRegistro("correo")}
                    required
                    autoComplete="email"
                    inputMode="email"
                    maxLength={100}
                    placeholder="nombre@inacap.cl"
                  />

                  <Campo
                    etiqueta="Contraseña"
                    type="password"
                    value={registro.clave}
                    onChange={cambiarRegistro("clave")}
                    required
                    autoComplete="new-password"
                    maxLength={100}
                    ayuda="Mínimo 8 caracteres. No uses una contraseña personal: este prototipo la guarda en el navegador."
                  />

                  <Campo
                    etiqueta="Repite la contraseña"
                    type="password"
                    value={registro.confirmar}
                    onChange={cambiarRegistro("confirmar")}
                    required
                    autoComplete="new-password"
                    maxLength={100}
                  />

                  {error && (
                    <Alerta variante="error" role="alert">
                      {error}
                    </Alerta>
                  )}

                  <Boton type="submit" bloque tamano="lg">
                    Crear cuenta
                  </Boton>
                </form>

                <div className="mt-6 border-t border-neutral-200 pt-5 text-center">
                  <p className="mb-2 text-sm text-neutral-600">
                    ¿Ya tienes una cuenta?
                  </p>
                  <Boton
                    type="button"
                    variante="secundario"
                    bloque
                    onClick={() => cambiarModo("ingresar")}
                  >
                    Volver a ingresar
                  </Boton>
                </div>
              </>
            )}
          </Tarjeta>
        </div>
      </section>
    </main>
  );
}
