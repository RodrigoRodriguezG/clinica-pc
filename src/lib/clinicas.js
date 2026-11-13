// Año de una clínica: el año de su primer día (null si no tiene días)
export const anioDeClinica = (clinica) => {
  const primero = [...(clinica.dias ?? [])].sort()[0];
  return primero ? Number(primero.slice(0, 4)) : null;
};

// Una clínica está activa si es la del año actual. No se guarda: se calcula
export const clinicaEsActiva = (clinica, hoy = new Date()) =>
  anioDeClinica(clinica) === hoy.getFullYear();

// Clínica en la que el usuario trabaja ahora: del año actual y con él asignado
export const clinicaActivaDe = (datos, usuario) =>
  datos.clinicas.find(
    (c) => clinicaEsActiva(c) && (c.personalIds ?? []).includes(usuario?.id),
  ) ?? null;

// Otra clínica del mismo año donde la persona ya está asignada (null si no hay)
export const asignacionEnOtraClinica = (datos, clinica, usuarioId) =>
  datos.clinicas.find(
    (c) =>
      c.id !== clinica.id &&
      anioDeClinica(c) === anioDeClinica(clinica) &&
      (c.personalIds ?? []).includes(usuarioId),
  ) ?? null;
