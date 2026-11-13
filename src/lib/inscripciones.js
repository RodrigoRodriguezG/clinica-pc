// "No se presentó" se guarda en el propietario, por clínica. No se borra nada
export const estaAusente = (propietario, clinicaId) =>
  (propietario.ausenteEn ?? []).includes(clinicaId);

export const marcarAusente = (propietario, clinicaId) => ({
  ...propietario,
  ausenteEn: [...new Set([...(propietario.ausenteEn ?? []), clinicaId])],
});

export const restaurarInscripcion = (propietario, clinicaId) => ({
  ...propietario,
  ausenteEn: (propietario.ausenteEn ?? []).filter((id) => id !== clinicaId),
});
