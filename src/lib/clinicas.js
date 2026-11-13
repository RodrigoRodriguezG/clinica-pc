// Clínica en la que el usuario trabaja ahora: debe estar activa y tenerlo asignado
export const clinicaActivaDe = (datos, usuario) =>
  datos.clinicas.find(
    (c) => c.activa && (c.personalIds ?? []).includes(usuario?.id),
  ) ?? null;
