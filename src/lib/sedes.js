import { PERMISOS, SIGLA_SEDE } from "../constantes.js";
import { puede } from "./permisos.js";

// Permisos con alcance por sede: [todas las sedes, solo la sede del usuario]
export const ALCANCES = {
  clinicas: [PERMISOS.CREAR_CLINICAS, PERMISOS.CREAR_CLINICAS_SEDE],
  checklists: [PERMISOS.EDITAR_CHECKLISTS, PERMISOS.EDITAR_CHECKLISTS_SEDE],
  reportes: [PERMISOS.VER_REPORTES, PERMISOS.VER_REPORTES_SEDE],
  retro: [
    PERMISOS.VER_RETROALIMENTACION,
    PERMISOS.VER_RETROALIMENTACION_SEDE,
  ],
  fichas: [PERMISOS.VER_TODAS_FICHAS, PERMISOS.VER_TODAS_FICHAS_SEDE],
};

// "LA" -> "Sede Los Ángeles" (null si la sigla no existe)
export const siglaASede = (sigla) =>
  Object.keys(SIGLA_SEDE).find(
    (s) => SIGLA_SEDE[s] === String(sigla ?? "").toUpperCase(),
  ) ?? null;

export const sedeDeClinica = (datos, clinicaId) =>
  datos.clinicas.find((c) => c.id === clinicaId)?.sede ?? null;

export const clinicaDeFicha = (datos, ficha) =>
  datos.clinicas.find((c) => c.id === ficha.clinicaId) ?? null;

// ¿Las dos clínicas son de la misma sede?
export const mismaSede = (datos, clinicaIdA, clinicaIdB) =>
  sedeDeClinica(datos, clinicaIdA) === sedeDeClinica(datos, clinicaIdB);

// ¿Tiene el usuario alguno de los dos alcances?
export const tieneAlcance = (usuario, alcance) =>
  ALCANCES[alcance].some((p) => puede(usuario, p));

export const alcanceTodas = (usuario, alcance) =>
  puede(usuario, ALCANCES[alcance][0]);

// ¿Puede el usuario trabajar con esta clínica en este alcance?
export function puedeClinica(usuario, clinica, alcance) {
  if (!clinica) return false;
  const [todas, sede] = ALCANCES[alcance];
  if (puede(usuario, todas)) return true;
  return (
    puede(usuario, sede) && Boolean(usuario.sede) && clinica.sede === usuario.sede
  );
}

export const clinicasPermitidas = (datos, usuario, alcance) =>
  datos.clinicas.filter((c) => puedeClinica(usuario, c, alcance));

// Explica por qué un usuario con permiso de su sede no ve clínicas
export const motivoSinClinicas = (usuario, alcance) =>
  !alcanceTodas(usuario, alcance) && !usuario?.sede
    ? "Tu cuenta no tiene una sede asignada. Pídele al administrador que te asigne una."
    : "Aún no hay clínicas en tu sede.";
