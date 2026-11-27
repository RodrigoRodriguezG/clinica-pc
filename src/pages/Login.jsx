import { useState } from "react";
import { useApp } from "../store.jsx";
import { nombreRol } from "../lib/roles.js";
import { SIGLA_SEDE } from "../constantes.js";
import { crearDatosIniciales } from "../data/seed.js";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import { LogoInacap } from "../components/ui/LogoInacap.jsx";
import {
  IconoChevronAbajo,
  IconoEscudo,
} from "../components/ui/iconos.jsx";

// Claves originales de las cuentas demo. Se toman de los datos iniciales y no
// de los guardados, para no exponer contraseñas que alguien ya cambió.
const CLAVES_DEMO = new Map(
  crearDatosIniciales().usuarios.map((u) => [u.id, u.clave]),
);

export default function Login() {
  const { ingresar, datos } = useApp();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  const enviar = (e) => {
    e.preventDefault();
    setError(ingresar(correo, clave));
  };

  // Completa el formulario con una cuenta demo (la clave no se muestra)
  const usarCuentaDemo = (u) => {
    setCorreo(u.correo);
    setClave(CLAVES_DEMO.get(u.id) ?? "");
    setError("");
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

        <div className="relative flex items-center gap-3 text-white">
          <LogoInacap className="h-7 w-auto" iconoClassName="text-inacap" />
          <span aria-hidden="true" className="h-7 w-px bg-white/30" />
          <p className="text-lg font-bold leading-tight">Clínica del PC</p>
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
          <div className="mb-6 flex items-center gap-3 text-tinta lg:hidden">
            <LogoInacap className="h-6 w-auto" iconoClassName="text-inacap" />
            <span aria-hidden="true" className="h-6 w-px bg-neutral-300" />
            <p className="text-base font-bold leading-tight">Clínica del PC</p>
          </div>

          <Tarjeta className="p-6 sm:p-8">
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
                      Cuentas de demostración
                      <IconoChevronAbajo className="h-4 w-4 shrink-0 transition-transform duration-150 group-open:rotate-180" />
                    </summary>
                    <ul className="space-y-0.5 border-t border-neutral-200 p-1.5">
                      {datos.usuarios.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => usarCuentaDemo(u)}
                            aria-pressed={correo === u.correo}
                            title="Completar el formulario con esta cuenta"
                            className="flex min-h-9 w-full cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-md px-1.5 py-1.5 text-left text-xs transition-colors duration-150 hover:bg-white aria-pressed:bg-white aria-pressed:ring-1 aria-pressed:ring-neutral-200 focus-visible:outline-2 focus-visible:outline-inacap"
                          >
                            <span className="break-all text-neutral-700">
                              {u.correo}
                            </span>
                            <span className="text-neutral-500">
                              {nombreRol(datos, u.rol)}
                              {SIGLA_SEDE[u.sede] && ` · ${SIGLA_SEDE[u.sede]}`}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                </form>
              </>
          </Tarjeta>
        </div>
      </section>
    </main>
  );
}
