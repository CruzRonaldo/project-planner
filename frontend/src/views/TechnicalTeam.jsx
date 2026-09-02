import React, { useState } from 'react';
import {
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';

const areas = [
  {
    id: 'architecture',
    label: 'Arquitectura',
  },
  {
    id: 'structures',
    label: 'Estructuras',
  },
  {
    id: 'systems',
    label: 'Sistemas',
  },
];

const membersByArea = {
  architecture: [
    {
      name: 'Arq. Sofía Torres',
      role: 'Arquitecta Principal / BIM',
      project: 'Edificio Terminal B',
      status: 'Activo',
      statusKey: 'active',
      progress: 85,
      avatar: 47,
    },
    {
      name: 'Ing. Alejandro Ruiz',
      role: 'Ingeniero Calculista Senior',
      project: 'Viaducto Elevado',
      status: 'Activo',
      statusKey: 'active',
      progress: 60,
      avatar: 12,
    },
    {
      name: 'Arq. Mateo Fernández',
      role: 'Diseñador Urbano',
      project: 'Parque Central Metropolitano',
      status: 'Stand-by',
      statusKey: 'standby',
      progress: 40,
      avatar: 68,
    },
    {
      name: 'Dra. Elena Gómez',
      role: 'Especialista BIM / Revit',
      project: 'Edificio Terminal B',
      status: 'Apoyo',
      statusKey: 'support',
      progress: 95,
      avatar: 32,
    },
    {
      name: 'Ing. Carlos Mendoza',
      role: 'Ingeniero Hidráulico',
      project: 'Planta Tratamiento II',
      status: 'Activo',
      statusKey: 'active',
      progress: 75,
      avatar: 15,
    },
    {
      name: 'Ing. Laura Castro',
      role: 'Coordinadora de Instalaciones',
      project: 'Subestación Eléctrica',
      status: 'Stand-by',
      statusKey: 'standby',
      progress: 20,
      avatar: 44,
    },
  ],

  structures: [
    {
      name: 'Ing. Valeria Campos',
      role: 'Jefa de Estructuras',
      project: 'Viaducto Elevado',
      status: 'Activo',
      statusKey: 'active',
      progress: 82,
      avatar: 5,
    },
    {
      name: 'Ing. Diego Salazar',
      role: 'Especialista en Concreto',
      project: 'Edificio Terminal B',
      status: 'Activo',
      statusKey: 'active',
      progress: 70,
      avatar: 14,
    },
    {
      name: 'Ing. Marco Paredes',
      role: 'Calculista Estructural',
      project: 'Puente Industrial',
      status: 'Stand-by',
      statusKey: 'standby',
      progress: 46,
      avatar: 11,
    },
    {
      name: 'Ing. Camila Rojas',
      role: 'Especialista en Acero',
      project: 'Parque Central Metropolitano',
      status: 'Apoyo',
      statusKey: 'support',
      progress: 90,
      avatar: 45,
    },
    {
      name: 'Ing. José Herrera',
      role: 'Supervisor de Obra',
      project: 'Planta Tratamiento II',
      status: 'Activo',
      statusKey: 'active',
      progress: 68,
      avatar: 53,
    },
    {
      name: 'Ing. Natalia Vega',
      role: 'Modeladora Estructural',
      project: 'Hospital Regional',
      status: 'Activo',
      statusKey: 'active',
      progress: 55,
      avatar: 49,
    },
  ],

  systems: [
    {
      name: 'Ing. Ricardo Luna',
      role: 'Líder de Sistemas',
      project: 'Subestación Eléctrica',
      status: 'Activo',
      statusKey: 'active',
      progress: 88,
      avatar: 13,
    },
    {
      name: 'Ing. Andrea Molina',
      role: 'Ingeniera Eléctrica',
      project: 'Edificio Terminal B',
      status: 'Activo',
      statusKey: 'active',
      progress: 76,
      avatar: 48,
    },
    {
      name: 'Ing. Bruno Díaz',
      role: 'Especialista en Automatización',
      project: 'Planta Tratamiento II',
      status: 'Apoyo',
      statusKey: 'support',
      progress: 64,
      avatar: 51,
    },
    {
      name: 'Ing. Paula León',
      role: 'Coordinadora MEP',
      project: 'Hospital Regional',
      status: 'Activo',
      statusKey: 'active',
      progress: 92,
      avatar: 25,
    },
    {
      name: 'Téc. Martín Soto',
      role: 'Técnico de Comunicaciones',
      project: 'Viaducto Elevado',
      status: 'Stand-by',
      statusKey: 'standby',
      progress: 35,
      avatar: 59,
    },
    {
      name: 'Ing. Lucía Navarro',
      role: 'Especialista HVAC',
      project: 'Centro Comercial Norte',
      status: 'Activo',
      statusKey: 'active',
      progress: 58,
      avatar: 29,
    },
  ],
};

const statusClasses = {
  active: 'bg-emerald-500/15 text-emerald-400',
  standby: 'bg-amber-500/15 text-amber-400',
  support: 'bg-blue-500/15 text-blue-400',
};

const areaSummary = [
  {
    name: 'Arquitectura',
    members: 8,
    description: 'Renders, modelado Revit y recorridos 360°',
    color: 'text-blue-400',
  },
  {
    name: 'Estructuras',
    members: 6,
    description: 'Modelado Revit, concreto y acero de refuerzo',
    color: 'text-emerald-400',
  },
  {
    name: 'Sistemas',
    members: 4,
    description: 'Backend APPs, N8N y automatizaciones Make',
    color: 'text-amber-400',
  },
];

const recentAssignments = [
  {
    date: '15 Ene',
    person: 'Ing. Alejandro Ruiz',
    project: 'Viaducto Elevado',
  },
  {
    date: '14 Ene',
    person: 'Arq. Sofía Torres',
    project: 'Edificio Terminal B',
  },
  {
    date: '12 Ene',
    person: 'Dra. Elena Gómez',
    project: 'Edificio Terminal B (Apoyo)',
  },
  {
    date: '10 Ene',
    person: 'Ing. Laura Castro',
    project: 'Subestación Eléctrica',
  },
];

function TeamMemberCard({ member }) {
  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-blue-400/25 bg-[#101f3a] p-4 shadow-[0_14px_32px_rgba(1,8,20,0.16)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-blue-400/45">
      {/* Datos del integrante */}
      <header className="flex min-w-0 items-center gap-3">
        <img
          src={`https://i.pravatar.cc/96?img=${member.avatar}`}
          alt={`Foto de ${member.name}`}
          className="h-11 w-11 shrink-0 rounded-full border border-blue-300/30 object-cover"
        />

        <div className="min-w-0">
          <h2
            className="truncate text-sm font-semibold text-white"
            title={member.name}
          >
            {member.name}
          </h2>

          <p
            className="mt-0.5 truncate text-xs text-slate-400"
            title={member.role}
          >
            {member.role}
          </p>
        </div>
      </header>

      {/* Proyecto asignado */}
      <div className="mt-5 min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Proyecto asignado
        </p>

        <div className="mt-2 flex min-w-0 items-center gap-2">
          <p
            className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100"
            title={member.project}
          >
            {member.project}
          </p>

          <span
            className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${
              statusClasses[member.statusKey]
            }`}
          >
            {member.status}
          </span>
        </div>
      </div>

      {/* Progreso */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>Progreso de tarea</span>

          <strong className="font-mono text-slate-200">
            {member.progress}%
          </strong>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[#071224]">
          <div
            className="h-full rounded-full bg-[#4f8bdc]"
            style={{
              width: `${member.progress}%`,
            }}
          />
        </div>
      </div>

      {/* Enlaces */}
      <footer className="mt-5 flex items-center justify-between border-t border-blue-300/15 pt-4">
        <span className="text-[11px] text-slate-500">
          Enlaces de trabajo
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Copiar enlace de trabajo de ${member.name}`}
            className="rounded-full border border-blue-400/25 p-1.5 text-blue-400 transition-colors hover:bg-blue-400/10 hover:text-blue-300"
          >
            <LinkIcon size={13} />
          </button>

          <button
            type="button"
            aria-label={`Abrir perfil de ${member.name}`}
            className="rounded-full border border-blue-400/25 p-1.5 text-blue-400 transition-colors hover:bg-blue-400/10 hover:text-blue-300"
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </footer>
    </article>
  );
}

export default function TechnicalTeam() {
  const [activeArea, setActiveArea] = useState('architecture');

  const members = membersByArea[activeArea];

  return (
    <main className="flex-1 overflow-y-auto bg-[#09172a] p-4 text-slate-100 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1500px] pb-8">
        {/* Encabezado */}
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">
            Gestión del Equipo Técnico
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Coordinación de equipos especializados por área técnica
          </p>

          {/* Pestañas */}
          <div
            className="mt-6 flex flex-wrap gap-2"
            role="tablist"
            aria-label="Áreas técnicas"
          >
            {areas.map((area) => {
              const isActive = activeArea === area.id;

              return (
                <button
                  key={area.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveArea(area.id)}
                  className={`rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'border-[#4f8bdc] bg-[#4f8bdc] text-white'
                      : 'border-blue-400/25 bg-[#101f3a] text-slate-400 hover:border-blue-400/45 hover:text-white'
                  }`}
                >
                  {area.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Contenido */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          {/* Tarjetas del equipo */}
          <section
            aria-live="polite"
            className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3"
          >
            {members.map((member) => (
              <TeamMemberCard
                key={member.name}
                member={member}
              />
            ))}
          </section>

          {/* Panel derecho */}
          <aside className="flex min-w-0 flex-col gap-5">
            {/* Resumen por área */}
            <section className="rounded-xl border border-blue-400/25 bg-[#101f3a] p-5 shadow-[0_14px_32px_rgba(1,8,20,0.16)]">
              <h2 className="text-base font-semibold text-white">
                Resumen por Área
              </h2>

              <div className="mt-5 space-y-3">
                {areaSummary.map((area) => (
                  <article
                    key={area.name}
                    className="rounded-lg border border-blue-400/25 bg-[#081629] p-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-100">
                        {area.name}
                      </h3>

                      <strong
                        className={`whitespace-nowrap font-mono text-xs ${area.color}`}
                      >
                        {area.members} miembros
                      </strong>
                    </div>

                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                      {area.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {/* Asignaciones recientes */}
            <section className="rounded-xl border border-blue-400/25 bg-[#101f3a] p-5 shadow-[0_14px_32px_rgba(1,8,20,0.16)]">
              <h2 className="text-base font-semibold text-white">
                Asignaciones Recientes
              </h2>

              <div className="mt-4">
                {recentAssignments.map((assignment) => (
                  <article
                    key={`${assignment.date}-${assignment.person}`}
                    className="grid grid-cols-[52px_1fr] gap-3 border-b border-blue-300/20 py-3 first:pt-1 last:border-0 last:pb-0"
                  >
                    <time className="font-mono text-[11px] text-slate-500">
                      {assignment.date}
                    </time>

                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-semibold text-slate-200">
                        {assignment.person}
                      </h3>

                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {assignment.project}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}