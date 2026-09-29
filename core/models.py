from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings


class TechnicalArea(models.Model):
    """
    Ãreas tÃ©cnicas especializadas (Arquitectura, Estructuras, Sistemas, etc.)
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Ãrea")
    description = models.TextField(blank=True, null=True, verbose_name="DescripciÃ³n")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Ãrea TÃ©cnica"
        verbose_name_plural = "Ãreas TÃ©cnicas"
        ordering = ['name']

    def __str__(self):
        return self.name


class Role(models.Model):
    """
    Roles y cargos tÃ©cnicos especializados asignados a un Ã¡rea tÃ©cnica especÃ­fica,
    con definiciÃ³n de funciones y capacidades en el sistema.
    """
    technical_area = models.ForeignKey(
        TechnicalArea,
        on_delete=models.CASCADE,
        related_name='roles',
        verbose_name="Ãrea TÃ©cnica"
    )
    name = models.CharField(max_length=100, verbose_name="Nombre del Rol / Cargo")
    description = models.TextField(blank=True, null=True, verbose_name="DescripciÃ³n / Funciones del Puesto")
    can_manage_projects = models.BooleanField(default=False, verbose_name="Â¿Puede gestionar proyectos?")
    can_manage_tasks = models.BooleanField(default=True, verbose_name="Â¿Puede gestionar tareas?")
    can_view_metrics = models.BooleanField(default=True, verbose_name="Â¿Puede ver mÃ©tricas?")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Rol / Cargo TÃ©cnico"
        verbose_name_plural = "Roles / Cargos TÃ©cnicos"
        ordering = ['technical_area', 'name']
        unique_together = ('technical_area', 'name')

    def __str__(self):
        return f"{self.name} ({self.technical_area.name})"


class TeamStatus(models.Model):
    """
    Estados de disponibilidad para los equipos (Active, Stand-by, Support, etc.)
    """
    name = models.CharField(max_length=50, unique=True, verbose_name="Estado")
    description = models.CharField(max_length=255, blank=True, null=True, verbose_name="DescripciÃ³n")
    color_code = models.CharField(max_length=20, default="#3B82F6", verbose_name="CÃ³digo de Color (HEX)")

    class Meta:
        verbose_name = "Estado del Equipo"
        verbose_name_plural = "Estados de Equipos"

    def __str__(self):
        return self.name


class TeamMember(models.Model):
    """
    Personal tÃ©cnico y recursos humanos asignables a proyectos
    """
    first_name = models.CharField(max_length=100, verbose_name="Nombres")
    last_name = models.CharField(max_length=100, verbose_name="Apellidos")
    email = models.EmailField(unique=True, verbose_name="Correo ElectrÃ³nico")
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members',
        verbose_name="Rol / Cargo Asignado"
    )
    technical_area = models.ForeignKey(TechnicalArea, on_delete=models.PROTECT, related_name='members', verbose_name="Ãrea TÃ©cnica")
    status = models.ForeignKey(TeamStatus, on_delete=models.SET_NULL, null=True, related_name='members', verbose_name="Estado Actual")
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='team_members', verbose_name="Proyecto Asignado")
    is_active = models.BooleanField(default=True, verbose_name="Â¿EstÃ¡ activo en la empresa?")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Miembro del Equipo"
        verbose_name_plural = "Miembros del Equipo"
        ordering = ['last_name', 'first_name']

    def __str__(self):
        project_str = f" - {self.project.code}" if self.project else " (Sin Proyecto)"
        role_str = self.role.name if self.role else "Sin Rol"
        return f"{self.first_name} {self.last_name} ({role_str}){project_str}"


class Project(models.Model):
    """
    Entidad principal de proyectos y portafolio
    """
    STATUS_CHOICES = [
        ('PLANNING', 'En PlanificaciÃ³n'),
        ('IN_PROGRESS', 'En EjecuciÃ³n'),
        ('STAND_BY', 'En Espera (Stand-by)'),
        ('COMPLETED', 'Completado'),
        ('RISK', 'En Riesgo'),
        ('CANCELLED', 'Cancelado'),
    ]

    code = models.CharField(max_length=50, unique=True, verbose_name="CÃ³digo del Proyecto", help_text="Ej. PRJ-2026-001")
    name = models.CharField(max_length=200, verbose_name="Nombre del Proyecto")
    description = models.TextField(blank=True, null=True, verbose_name="DescripciÃ³n / Alcance")
    start_date = models.DateField(verbose_name="Fecha de Inicio")
    end_date = models.DateField(verbose_name="Fecha de FinalizaciÃ³n Estimada")
    duration_months = models.PositiveIntegerField(default=1, verbose_name="DuraciÃ³n (Meses)")
    budget = models.DecimalField(max_digits=14, decimal_places=2, default=0.00, verbose_name="Presupuesto Estimado")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNING', verbose_name="Estado")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Proyecto"
        verbose_name_plural = "Proyectos"
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.code}] {self.name}"


class Milestone(models.Model):
    """
    Hitos globales y puntos clave del proyecto (MÃ³dulo EstratÃ©gico)
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('IN_PROGRESS', 'En Proceso'),
        ('COMPLETED', 'Cumplido'),
        ('DELAYED', 'Atrasado'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones', verbose_name="Proyecto")
    name = models.CharField(max_length=200, verbose_name="Nombre del Hito")
    description = models.TextField(blank=True, null=True, verbose_name="DescripciÃ³n")
    target_date = models.DateField(verbose_name="Fecha Objetivo")
    completed_date = models.DateField(blank=True, null=True, verbose_name="Fecha Real de Cumplimiento")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="Estado")

    class Meta:
        verbose_name = "Hito"
        verbose_name_plural = "Hitos"
        ordering = ['target_date']

    def __str__(self):
        return f"{self.project.code} - {self.name} ({self.target_date})"


class Task(models.Model):
    """
    Tareas operativas y elementos que conforman la Ruta CrÃ­tica
    """
    STATUS_CHOICES = [
        ('TODO', 'Por Hacer'),
        ('IN_PROGRESS', 'En Curso'),
        ('REVIEW', 'En RevisiÃ³n'),
        ('DONE', 'Finalizada'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks', verbose_name="Proyecto")
    milestone = models.ForeignKey(Milestone, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks', verbose_name="Hito Asociado")
    category = models.ForeignKey(TechnicalArea, on_delete=models.PROTECT, related_name='tasks', verbose_name="Ãrea TÃ©cnica")
    assigned_to = models.ForeignKey(TeamMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks', verbose_name="Responsable Asignado")
    
    title = models.CharField(max_length=200, verbose_name="TÃ­tulo de la Tarea")
    description = models.TextField(blank=True, null=True, verbose_name="DescripciÃ³n Detallada")
    start_date = models.DateField(verbose_name="Fecha de Inicio")
    end_date = models.DateField(verbose_name="Fecha de Fin")
    duration_days = models.PositiveIntegerField(default=1, verbose_name="DuraciÃ³n (DÃ­as)")
    progress = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name="Progreso (%)")
    
    # Campos para el Motor de OptimizaciÃ³n y Ruta CrÃ­tica
    is_critical_path = models.BooleanField(default=False, verbose_name="Â¿Es Ruta CrÃ­tica?", help_text="Calculado por el motor de optimizaciÃ³n")
    tolerance_days = models.PositiveIntegerField(default=7, verbose_name="Tolerancia / Holgura (DÃ­as)", help_text="Margen de seguridad por defecto: 7 dÃ­as")
    predecessors = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='successors', verbose_name="Tareas Predecesoras")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO', verbose_name="Estado")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Tarea"
        verbose_name_plural = "Tareas"
        ordering = ['start_date']

    def __str__(self):
        return f"{self.project.code} - {self.title}"


class PerformanceMetric(models.Model):
    """
    MÃ©tricas y rendimientos de trabajo diario utilizados por el Motor de OptimizaciÃ³n
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='performance_metrics', verbose_name="Proyecto")
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='metrics', verbose_name="Tarea EspecÃ­fica")
    unit = models.CharField(max_length=50, verbose_name="Unidad de Medida", help_text="Ej. M2 de encofrado, M3 de concreto, Renders")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Cantidad Total")
    rate_per_day = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Rendimiento Diario Estimado", help_text="Ej. M2 por dÃ­a")
    divisor = models.PositiveIntegerField(default=5, verbose_name="Factor Divisor / Reductor", help_text="Factor de aceleraciÃ³n para cÃ¡lculo de reducciÃ³n")

    class Meta:
        verbose_name = "MÃ©trica de Rendimiento"
        verbose_name_plural = "MÃ©tricas de Rendimiento"

    def __str__(self):
        return f"{self.project.code} - {self.unit} ({self.rate_per_day}/dÃ­a)"


class DriveLink(models.Model):
    """
    Enlaces a documentaciÃ³n y entregables alojados en Google Drive vinculados a tareas
    """
    FILE_TYPES = [
        ('FOLDER', 'Carpeta de Tarea / Entregable'),
        ('DOCUMENT', 'Documento / EspecificaciÃ³n TÃ©cnica'),
        ('BIM_MODEL', 'Modelo BIM / Revit'),
        ('RENDER_360', 'Render / Recorrido Virtual 360Â°'),
        ('SPREADSHEET', 'Hoja de CÃ¡lculo / Presupuesto'),
        ('OTHER', 'Otro'),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='drive_links', verbose_name="Tarea")
    title = models.CharField(max_length=200, verbose_name="TÃ­tulo del Enlace")
    drive_url = models.URLField(max_length=500, verbose_name="URL de Google Drive")
    file_id = models.CharField(max_length=150, blank=True, null=True, verbose_name="Google Drive File/Folder ID")
    file_type = models.CharField(max_length=20, choices=FILE_TYPES, default='DOCUMENT', verbose_name="Tipo de Archivo")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Enlace de Drive"
        verbose_name_plural = "Enlaces de Drive"

    def __str__(self):
        return f"{self.task.title} - {self.title} ({self.get_file_type_display()})"
class BIMModel(models.Model):
    name = models.CharField(max_length=255, verbose_name="Nombre del Modelo")
    urn = models.CharField(max_length=500, verbose_name="URN de Autodesk")
    object_id = models.CharField(max_length=500, verbose_name="Object ID (OSS)")
    size_bytes = models.BigIntegerField(default=0, verbose_name="Tamaño en bytes")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='bim_models', null=True, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Subido por")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Modelo BIM"
        verbose_name_plural = "Modelos BIM"
        ordering = ['-created_at']

    def __str__(self):
        return self.name
