"""
Servicio de Auditoría Periódica de Proyectos y Portafolio.

Analiza el estado de avance, inactividad (STALE), ruta crítica (CPM) y motivos de cambio
de estado de los proyectos en ventanas temporales configurables (mensual, trimestral, semestral).
"""

import datetime
from typing import Any, Dict, List, Optional, Union

from core.models import Project, ProjectChangeLog, Task, Milestone


PERIOD_DAYS_MAP: Dict[str, int] = {
    'monthly': 30,
    'quarterly': 90,
    'semiannual': 180,
}


def _parse_reference_date(reference_date: Optional[Union[datetime.date, datetime.datetime, str]]) -> datetime.date:
    """Parsea y valida la fecha de referencia para la auditoría periódica."""
    if reference_date is None:
        return datetime.date.today()
    if isinstance(reference_date, datetime.datetime):
        return reference_date.date()
    if isinstance(reference_date, datetime.date):
        return reference_date
    if isinstance(reference_date, str):
        try:
            return datetime.datetime.strptime(reference_date.strip(), '%Y-%m-%d').date()
        except ValueError:
            return datetime.date.today()
    return datetime.date.today()


def _is_log_in_cutoff(log: ProjectChangeLog, cutoff_date: datetime.date) -> bool:
    """Verifica si el registro de auditoría/cambio cae dentro de la ventana de tiempo."""
    log_date = getattr(log, 'date', None)
    if log_date is None and getattr(log, 'created_at', None):
        log_date = log.created_at.date()
    if log_date:
        return log_date >= cutoff_date
    return False


def analyze_periodic_project_audit(
    period: str = 'monthly',
    reference_date: Optional[Union[datetime.date, datetime.datetime, str]] = None,
) -> Dict[str, Any]:
    """Realiza la auditoría periódica de proyectos y portafolio en una ventana de tiempo.

    Args:
        period: 'monthly' (30 días), 'quarterly' (90 días), 'semiannual' (180 días).
                Si no es válido, usa 'monthly' por defecto.
        reference_date: Instancia de datetime.date o str (YYYY-MM-DD). Si es None, usa today().

    Returns:
        Dict con la estructura consolidada del reporte de auditoría:
        - period: str
        - period_days: int
        - reference_date: str (YYYY-MM-DD)
        - cutoff_date: str (YYYY-MM-DD)
        - total_projects: int
        - summary: { 'healthy': int, 'warning': int, 'critical': int, 'stale': int }
        - projects: list de dicts con métricas por proyecto
    """
    normalized_period = str(period).lower().strip() if period else 'monthly'
    if normalized_period not in PERIOD_DAYS_MAP:
        normalized_period = 'monthly'

    days = PERIOD_DAYS_MAP[normalized_period]
    ref_date = _parse_reference_date(reference_date)
    cutoff_date = ref_date - datetime.timedelta(days=days)

    projects_qs = Project.objects.all().prefetch_related(
        'tasks',
        'milestones',
        'project_change_logs',
        'team_members__role',
    )

    summary = {
        'healthy': 0,
        'warning': 0,
        'critical': 0,
        'stale': 0,
    }

    projects_data: List[Dict[str, Any]] = []

    for project in projects_qs:
        tasks = list(project.tasks.all())
        milestones = list(project.milestones.all())
        change_logs = list(project.project_change_logs.all())

        # 1. Logs recientes dentro de la ventana de auditoría
        recent_logs = [log for log in change_logs if _is_log_in_cutoff(log, cutoff_date)]

        # 2. Tareas actualizadas dentro de la ventana
        has_recent_task_updates = any(
            t.updated_at and t.updated_at.date() >= cutoff_date
            for t in tasks
        )

        # 3. Detección de Inactividad (STALE)
        # Si el proyecto no está completado/cancelado y NO tiene ningún registro
        # en recent_logs ni tareas actualizadas desde cutoff_date, marcar como STALE.
        is_terminal = project.status in ('COMPLETED', 'CANCELLED')
        is_stale = (not is_terminal) and (not recent_logs) and (not has_recent_task_updates)

        # 4. Análisis de Ruta Crítica (CPM)
        # Tareas con is_critical_path=True, status != 'DONE' y end_date < ref_date
        overdue_critical_tasks = [
            t for t in tasks
            if t.is_critical_path and t.status != 'DONE' and t.end_date and t.end_date < ref_date
        ]
        overdue_critical_count = len(overdue_critical_tasks)

        # Hitos con status in ('DELAYED', 'PENDING') y target_date < ref_date
        overdue_milestones = [
            m for m in milestones
            if m.status in ('DELAYED', 'PENDING') and m.target_date and m.target_date < ref_date
        ]
        overdue_milestones_count = len(overdue_milestones)

        # Tareas críticas próximas a vencer sin avance suficiente (dentro de los próximos 7 días con avance < 50%)
        approaching_critical_tasks = [
            t for t in tasks
            if (
                t.is_critical_path
                and t.status != 'DONE'
                and t.end_date
                and ref_date <= t.end_date <= ref_date + datetime.timedelta(days=7)
                and t.progress < 50
            )
        ]

        # 5. Avance esperado vs real
        if project.start_date and project.end_date and project.end_date > project.start_date:
            total_duration = max(1, (project.end_date - project.start_date).days)
            elapsed_days = max(0, min(total_duration, (ref_date - project.start_date).days))
            expected_progress = int((elapsed_days / total_duration) * 100) if ref_date >= project.start_date else 0
        else:
            expected_progress = 100 if (project.end_date and ref_date >= project.end_date) else 0

        if tasks:
            avg_prog = sum(t.progress for t in tasks) / len(tasks)
            actual_progress = int(round(avg_prog)) if float(avg_prog).is_integer() else round(avg_prog, 1)
        else:
            actual_progress = 0

        progress_gap = expected_progress - actual_progress

        # 6. Determinación de Salud (health) y Hallazgos (findings)
        findings: List[str] = []

        if is_stale:
            health = 'STALE'
            findings.append("Sin actividad ni actualizaciones registradas en el período auditado.")
        elif overdue_critical_tasks or overdue_milestones or progress_gap > 25 or project.status == 'RISK':
            health = 'CRITICAL'
            if overdue_critical_tasks:
                findings.append(f"{overdue_critical_count} tarea(s) en ruta crítica vencida(s).")
            if overdue_milestones:
                findings.append(f"{overdue_milestones_count} hito(s) no alcanzado(s) o atrasado(s).")
            if progress_gap > 25:
                findings.append(f"Desfase severo de avance: {progress_gap}% de retraso frente al calendario previsto.")
            if project.status == 'RISK':
                findings.append("El proyecto se encuentra en estado de Riesgo.")
        elif progress_gap > 10 or approaching_critical_tasks:
            health = 'WARNING'
            if progress_gap > 10:
                findings.append(f"Retraso moderado: {progress_gap}% de desfase frente al calendario previsto.")
            if approaching_critical_tasks:
                findings.append(f"{len(approaching_critical_tasks)} tarea(s) crítica(s) próxima(s) a vencer sin avance suficiente.")
        else:
            health = 'HEALTHY'
            findings.append("Avance y plazos alineados con el cronograma previsto.")

        summary[health.lower()] += 1

        # 7. Historial de motivos de cambio de estado
        status_reasons: List[Dict[str, str]] = []
        for log in change_logs:
            desc = log.description or ''
            desc_lower = desc.lower()
            desc_upper = desc.upper()
            if (
                "motivo:" in desc_lower
                or "stand_by" in desc_upper
                or "risk" in desc_upper
                or "cancelled" in desc_upper
                or "espera" in desc_lower
                or "riesgo" in desc_lower
                or "cancelado" in desc_lower
                or "cambio de estado" in desc_lower
            ):
                status_reasons.append({
                    "date": str(log.date) if log.date else "",
                    "user": log.user_name or "Administrador",
                    "description": desc,
                })

        # 8. Líder técnico y equipo asignado al proyecto
        leader_member = None
        for member in project.team_members.all():
            if getattr(member, 'role', None) and getattr(member.role, 'can_manage_projects', False):
                leader_member = member
                break
        if not leader_member and project.team_members.exists():
            leader_member = project.team_members.first()

        leader_id = leader_member.id if leader_member else None
        leader_name = f"{leader_member.first_name} {leader_member.last_name}".strip() if leader_member else ""
        leader_email = leader_member.email if leader_member else ""

        projects_data.append({
            'id': project.id,
            'code': project.code,
            'name': project.name,
            'status': project.status,
            'status_display': project.get_status_display(),
            'health': health,
            'budget': float(project.budget) if project.budget is not None else 0.0,
            'actual_progress': actual_progress,
            'expected_progress': expected_progress,
            'progress': actual_progress,
            'overdue_critical_count': overdue_critical_count,
            'overdue_critical_tasks': overdue_critical_count,
            'total_tasks': len(tasks),
            'overdue_milestones_count': overdue_milestones_count,
            'recent_logs_count': len(recent_logs),
            'findings': findings,
            'status_reasons': status_reasons,
            'leader_id': leader_id,
            'leader_name': leader_name,
            'leader_email': leader_email,
            'leaderId': leader_id,
            'leaderName': leader_name,
            'leaderEmail': leader_email,
        })

    return {
        'period': normalized_period,
        'period_days': days,
        'reference_date': ref_date.isoformat(),
        'cutoff_date': cutoff_date.isoformat(),
        'total_projects': len(projects_data),
        'summary': summary,
        'projects': projects_data,
    }
