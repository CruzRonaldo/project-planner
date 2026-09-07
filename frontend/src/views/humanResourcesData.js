// Datos de demostración del frontend, independientes de las cuentas y permisos.
export const personnelStatuses = [
  { id: 'active', label: 'Activo', summaryLabel: 'Activos', className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400', dotClass: 'bg-emerald-400' },
  { id: 'standby', label: 'Stand-by', summaryLabel: 'Stand-by', className: 'border-amber-500/25 bg-amber-500/10 text-amber-400', dotClass: 'bg-amber-400' },
  { id: 'support', label: 'Apoyo', summaryLabel: 'En apoyo', className: 'border-blue-500/25 bg-blue-500/10 text-blue-400', dotClass: 'bg-blue-400' },
];

const initialPersonnel = [
  { id: 'hr-sofia', name: 'Sofía Torres', area: 'Arquitectura', project: 'Edificio Terminal B', status: 'active', availability: 100 },
  { id: 'hr-alejandro', name: 'Alejandro Ruiz', area: 'Estructuras', project: 'Viaducto Elevado', status: 'active', availability: 80 },
  { id: 'hr-mateo', name: 'Mateo Fernández', area: 'Arquitectura', project: 'En espera', status: 'standby', availability: 20 },
  { id: 'hr-elena', name: 'Elena Gómez', area: 'Arquitectura', project: 'Edificio Terminal B', status: 'support', availability: 50 },
  { id: 'hr-carlos', name: 'Carlos Mendoza', area: 'Sistemas', project: 'Planta Tratamiento II', status: 'active', availability: 100 },
  { id: 'hr-laura', name: 'Laura Castro', area: 'Sistemas', project: 'Ninguno', status: 'standby', availability: 10 },
  { id: 'hr-andres', name: 'Andrés Silva', area: 'Estructuras', project: 'Viaducto Elevado', status: 'support', availability: 40 },
  { id: 'hr-patricia', name: 'Patricia Luna', area: 'Sistemas', project: 'Integración N8N Backend', status: 'active', availability: 90 },
  { id: 'hr-valeria', name: 'Valeria López', area: 'Arquitectura', project: 'Torre Reforma', status: 'active', availability: 85 },
  { id: 'hr-daniel', name: 'Daniel Vargas', area: 'Estructuras', project: 'Puente Industrial', status: 'active', availability: 100 },
  { id: 'hr-camila', name: 'Camila Ríos', area: 'Sistemas', project: 'Project Planner', status: 'active', availability: 75 },
  { id: 'hr-jorge', name: 'Jorge Salas', area: 'Instalaciones', project: 'Hospital Regional', status: 'active', availability: 80 },
  { id: 'hr-adriana', name: 'Adriana Vega', area: 'Arquitectura', project: 'Residencial Las Palmas', status: 'active', availability: 100 },
  { id: 'hr-miguel', name: 'Miguel Paredes', area: 'Estructuras', project: 'Nave Industrial', status: 'active', availability: 90 },
  { id: 'hr-lucia', name: 'Lucía Navarro', area: 'Instalaciones', project: 'Subestación Eléctrica', status: 'active', availability: 85 },
  { id: 'hr-ricardo', name: 'Ricardo Peña', area: 'Sistemas', project: 'Project Planner', status: 'active', availability: 95 },
  { id: 'hr-fernanda', name: 'Fernanda Ortiz', area: 'Arquitectura', project: 'En espera', status: 'standby', availability: 30 },
  { id: 'hr-oscar', name: 'Óscar Molina', area: 'Estructuras', project: 'Ninguno', status: 'standby', availability: 25 },
];

const initialHistory = [
  { id: 'history-1', date: '2026-01-16', name: 'Mateo Fernández', previousStatus: 'active', nextStatus: 'standby', comment: 'Fase de diseño completada.' },
  { id: 'history-2', date: '2026-01-15', name: 'Elena Gómez', previousStatus: 'standby', nextStatus: 'support', comment: 'Refuerzo en modelado arquitectónico.' },
  { id: 'history-3', date: '2026-01-14', name: 'Andrés Silva', previousStatus: 'active', nextStatus: 'support', comment: 'Asignación temporal al Viaducto Elevado.' },
  { id: 'history-4', date: '2026-01-11', name: 'Patricia Luna', previousStatus: 'standby', nextStatus: 'active', comment: 'Inicio de sprint de integración.' },
  { id: 'history-5', date: '2026-01-09', name: 'Laura Castro', previousStatus: 'active', nextStatus: 'standby', comment: 'A la espera de aprobación del proyecto.' },
];

export function createHumanResourcesData() {
  return {
    members: initialPersonnel.map((member) => ({ ...member })),
    history: initialHistory.map((change) => ({ ...change })),
  };
}

export function summarizePersonnel(members) {
  return members.reduce((summary, member) => ({ ...summary, total: summary.total + 1, [member.status]: summary[member.status] + 1 }), { total: 0, active: 0, standby: 0, support: 0 });
}

function normalizeText(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function filterPersonnel(members, query = '', status = 'all') {
  const normalizedQuery = normalizeText(query);
  return members.filter((member) => {
    const statusLabel = personnelStatuses.find((item) => item.id === member.status)?.label ?? '';
    const matchesQuery = normalizeText(`${member.name} ${member.area} ${member.project} ${statusLabel} ${member.availability}%`).includes(normalizedQuery);
    return matchesQuery && (status === 'all' || member.status === status);
  });
}

export function updatePersonnel(data, memberId, draft, date = new Date()) {
  const member = data.members.find((item) => item.id === memberId);
  const availability = Number(draft.availability);
  if (!member) throw new Error('No se encontró el integrante.');
  if (!personnelStatuses.some((status) => status.id === draft.status)) throw new Error('Selecciona un estado válido.');
  if (String(draft.availability).trim() === '' || !Number.isInteger(availability) || availability < 0 || availability > 100) {
    throw new Error('La disponibilidad debe ser un número entero entre 0 y 100.');
  }
  const project = draft.project.trim();
  if (!project) throw new Error('Indica un proyecto o escribe Ninguno.');
  if (member.status === draft.status && member.project === project && member.availability === availability) return data;

  const updatedMember = { ...member, project, status: draft.status, availability };
  const details = [
    member.project !== project && `Proyecto: ${member.project} → ${project}.`,
    member.availability !== availability && `Disponibilidad: ${member.availability}% → ${availability}%.`,
    member.status !== draft.status && 'Cambio de estado.',
  ].filter(Boolean).join(' ');
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const change = {
    id: `change-${date.getTime()}-${data.history.length}`,
    date: localDate,
    name: member.name,
    previousStatus: member.status,
    nextStatus: draft.status,
    comment: [draft.comment?.trim(), details].filter(Boolean).join(' '),
  };
  return {
    members: data.members.map((item) => item.id === memberId ? updatedMember : item),
    history: [change, ...data.history],
  };
}
