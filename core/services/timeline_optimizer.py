from datetime import timedelta
from heapq import heappop, heappush
from math import ceil


class TimelineError(ValueError):
    pass


def calculate_timeline(project_start, project_end, tasks):
    if project_end < project_start:
        raise TimelineError('El proyecto tiene un rango de fechas invertido.')
    if len(tasks) > 1000:
        raise TimelineError('Este análisis admite hasta 1000 tareas por proyecto.')
    nodes = {task['id']: task for task in tasks}
    if len(nodes) != len(tasks):
        raise TimelineError('Hay identificadores de tareas duplicados.')
    original_days = (project_end - project_start).days + 1
    assumptions = [
        'Simulación del plan completo: no calcula trabajo restante según el progreso.',
        'Duración en días calendario de esfuerzo al 100%; se ajusta a la disponibilidad actual.',
        'Una persona atiende una tarea a la vez dentro de este proyecto.',
        'Las fechas de inicio de las tareas son límites mínimos: no se adelantan.',
        'No incluye compromisos de otros proyectos, feriados ni licencias futuras.',
        'La propuesta respeta restricciones, pero no garantiza el mínimo global.',
    ]
    base = {
        'status': 'empty' if not tasks else 'ok',
        'original_duration_days': original_days,
        'scheduled_duration_days': None,
        'dependency_duration_days': None,
        'days_saved': 0, 'delay_days': 0,
        'proposed_end_date': None, 'critical_task_ids': [],
        'tasks': [], 'warnings': [], 'assumptions': assumptions,
        'applied': False,
    }
    if not tasks:
        return {**base, 'message': 'El proyecto no tiene tareas guardadas. Registra tareas antes de analizarlo.'}
    successors = {key: [] for key in nodes}
    indegree = {}
    durations = {}
    release = {}
    warnings = []
    for key, task in nodes.items():
        duration = task['duration_days']
        if not isinstance(duration, int) or isinstance(duration, bool) or duration < 1:
            raise TimelineError(f'La tarea {key} debe tener duración mayor que cero.')
        predecessors = set(task.get('predecessors', []))
        if key in predecessors or not predecessors.issubset(nodes):
            raise TimelineError(f'Las predecesoras de la tarea {key} deben ser otras tareas del mismo proyecto.')
        indegree[key] = len(predecessors)
        for predecessor in predecessors:
            successors[predecessor].append(key)
        availability = task.get('availability', 100) if task.get('assigned_to') is not None else 100
        if not task.get('is_active', True) or not isinstance(availability, int) or not 1 <= availability <= 100:
            raise TimelineError(f'El responsable de la tarea {key} está inactivo o no tiene disponibilidad válida.')
        durations[key] = ceil(duration * 100 / availability)
        release[key] = max(0, (task['start_date'] - project_start).days)
        if release[key] + durations[key] > 36600:
            raise TimelineError('El horizonte de cálculo supera 100 años. Revisa fechas y duraciones.')
        if task.get('assigned_to') is None:
            warnings.append(f'Tarea {key}: sin responsable; se supone un recurso independiente.')
    pending = dict(indegree)
    queue = sorted(key for key in nodes if pending[key] == 0)
    order = []
    while queue:
        key = heappop(queue)
        order.append(key)
        for child in successors[key]:
            pending[child] -= 1
            if pending[child] == 0:
                heappush(queue, child)
    if len(order) != len(nodes):
        raise TimelineError('Las dependencias forman un ciclo. Corrige las tareas predecesoras.')
    earliest = {}
    finish = {}
    for key in order:
        earliest[key] = max([release[key], *(finish[p] for p in nodes[key].get('predecessors', []))])
        finish[key] = earliest[key] + durations[key]
    lower_bound = max(finish.values())
    latest = {}
    rank = {}
    for key in reversed(order):
        latest[key] = min([latest[c] for c in successors[key]], default=lower_bound) - durations[key]
        rank[key] = durations[key] + max([rank[c] for c in successors[key]], default=0)
    ready = [(-rank[key], key) for key in nodes if indegree[key] == 0]
    ready.sort()
    reservations = {}
    scheduled_start = {}
    scheduled_end = {}
    pending = dict(indegree)
    while ready:
        _, key = heappop(ready)
        task = nodes[key]
        start = max([release[key], *(scheduled_end[p] for p in task.get('predecessors', []))])
        resource = task.get('assigned_to')
        if resource is not None:
            intervals = reservations.setdefault(resource, [])
            for left, right in sorted(intervals):
                if start + durations[key] <= left:
                    break
                if start < right:
                    start = right
            intervals.append((start, start + durations[key]))
        scheduled_start[key] = start
        scheduled_end[key] = start + durations[key]
        if scheduled_end[key] > 36600:
            raise TimelineError('El calendario resultante supera 100 años. Revisa las duraciones.')
        for child in successors[key]:
            pending[child] -= 1
            if pending[child] == 0:
                heappush(ready, (-rank[child], child))
    span = max(scheduled_end.values())
    try:
        proposed_end = (project_start + timedelta(days=span - 1)).isoformat()
        result_tasks = [{
            'task_id': key, 'title': nodes[key]['title'],
            'assigned_to': nodes[key].get('assigned_to'),
            'assigned_to_name': nodes[key].get('assigned_to_name') or 'Sin responsable',
            'duration_days': nodes[key]['duration_days'],
            'scheduled_duration_days': durations[key],
            'start_date': (project_start + timedelta(days=scheduled_start[key])).isoformat(),
            'end_date': (project_start + timedelta(days=scheduled_end[key] - 1)).isoformat(),
            'slack_days': latest[key] - earliest[key],
            'is_critical_path': latest[key] == earliest[key],
            'resource_delay_days': scheduled_start[key] - earliest[key],
            'predecessors': sorted(set(nodes[key].get('predecessors', []))),
        } for key in sorted(nodes, key=lambda item: (scheduled_start[item], item))]
    except OverflowError as error:
        raise TimelineError('Las fechas resultantes exceden el rango permitido.') from error
    return {
        **base, 'scheduled_duration_days': span,
        'dependency_duration_days': lower_bound,
        'days_saved': max(0, original_days - span),
        'delay_days': max(0, span - original_days),
        'proposed_end_date': proposed_end,
        'critical_task_ids': [key for key in order if latest[key] == earliest[key]],
        'tasks': result_tasks, 'warnings': warnings,
        'message': 'Propuesta calculada. Las fechas guardadas permanecen sin cambios.',
    }


def analyze_project_timeline(project):
    rows = list(project.tasks.select_related('assigned_to').prefetch_related('predecessors'))
    tasks = [{
        'id': task.id, 'title': task.title,
        'start_date': task.start_date, 'duration_days': task.duration_days,
        'assigned_to': task.assigned_to_id,
        'assigned_to_name': str(task.assigned_to) if task.assigned_to_id else None,
        'availability': task.assigned_to.availability if task.assigned_to_id else 100,
        'is_active': task.assigned_to.is_active if task.assigned_to_id else True,
        'predecessors': [predecessor.id for predecessor in task.predecessors.all()],
    } for task in rows]
    result = calculate_timeline(project.start_date, project.end_date, tasks)
    return {**result, 'project_id': project.id, 'project_name': project.name, 'project_code': project.code}
