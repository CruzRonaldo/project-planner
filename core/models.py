from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class TechnicalArea(models.Model):
    """
    Áreas técnicas especializadas (Arquitectura, Estructuras, Sistemas, etc.)
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Área")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Área Técnica"
        verbose_name_plural = "Áreas Técnicas"
        ordering = ['name']

    def __str__(self):
        return self.name


class TeamStatus(models.Model):
    """
    Estados de disponibilidad para los equipos (Active, Stand-by, Support, etc.)
    """
    name = models.CharField(max_length=50, unique=True, verbose_name="Estado")
    description = models.CharField(max_length=255, blank=True, null=True, verbose_name="Descripción")
    color_code = models.CharField(max_length=20, default="#3B82F6", verbose_name="Código de Color (HEX)")

    class Meta:
        verbose_name = "Estado del Equipo"
        verbose_name_plural = "Estados de Equipos"

    def __str__(self):
        return self.name


class TeamMember(models.Model):
    """
    Personal técnico y recursos humanos asignables a proyectos
    """
    first_name = models.CharField(max_length=100, verbose_name="Nombres")
    last_name = models.CharField(max_length=100, verbose_name="Apellidos")
    email = models.EmailField(unique=True, verbose_name="Correo Electrónico")
    role = models.CharField(max_length=100, verbose_name="Rol / Especialidad", help_text="Ej. Modelador Revit, Renderista, Desarrollador")
    technical_area = models.ForeignKey(TechnicalArea, on_delete=models.PROTECT, related_name='members', verbose_name="Área Técnica")
    status = models.ForeignKey(TeamStatus, on_delete=models.SET_NULL, null=True, related_name='members', verbose_name="Estado Actual")
    is_active = models.BooleanField(default=True, verbose_name="¿Está activo en la empresa?")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Miembro del Equipo"
        verbose_name_plural = "Miembros del Equipo"
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"


class Project(models.Model):
    """
    Entidad principal de proyectos y portafolio
    """
    STATUS_CHOICES = [
        ('PLANNING', 'En Planificación'),
        ('IN_PROGRESS', 'En Ejecución'),
        ('STAND_BY', 'En Espera (Stand-by)'),
        ('COMPLETED', 'Completado'),
        ('CANCELLED', 'Cancelado'),
    ]

    code = models.CharField(max_length=50, unique=True, verbose_name="Código del Proyecto", help_text="Ej. PRJ-2026-001")
    name = models.CharField(max_length=200, verbose_name="Nombre del Proyecto")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción / Alcance")
    start_date = models.DateField(verbose_name="Fecha de Inicio")
    end_date = models.DateField(verbose_name="Fecha de Finalización Estimada")
    duration_months = models.PositiveIntegerField(default=1, verbose_name="Duración (Meses)")
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
    Hitos globales y puntos clave del proyecto (Módulo Estratégico)
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('IN_PROGRESS', 'En Proceso'),
        ('COMPLETED', 'Cumplido'),
        ('DELAYED', 'Atrasado'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones', verbose_name="Proyecto")
    name = models.CharField(max_length=200, verbose_name="Nombre del Hito")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción")
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
    Tareas operativas y elementos que conforman la Ruta Crítica
    """
    STATUS_CHOICES = [
        ('TODO', 'Por Hacer'),
        ('IN_PROGRESS', 'En Curso'),
        ('REVIEW', 'En Revisión'),
        ('DONE', 'Finalizada'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks', verbose_name="Proyecto")
    milestone = models.ForeignKey(Milestone, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks', verbose_name="Hito Asociado")
    category = models.ForeignKey(TechnicalArea, on_delete=models.PROTECT, related_name='tasks', verbose_name="Área Técnica")
    assigned_to = models.ForeignKey(TeamMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks', verbose_name="Responsable Asignado")
    
    title = models.CharField(max_length=200, verbose_name="Título de la Tarea")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción Detallada")
    start_date = models.DateField(verbose_name="Fecha de Inicio")
    end_date = models.DateField(verbose_name="Fecha de Fin")
    duration_days = models.PositiveIntegerField(default=1, verbose_name="Duración (Días)")
    progress = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name="Progreso (%)")
    
    # Campos para el Motor de Optimización y Ruta Crítica
    is_critical_path = models.BooleanField(default=False, verbose_name="¿Es Ruta Crítica?", help_text="Calculado por el motor de optimización")
    tolerance_days = models.PositiveIntegerField(default=7, verbose_name="Tolerancia / Holgura (Días)", help_text="Margen de seguridad por defecto: 7 días")
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
    Métricas y rendimientos de trabajo diario utilizados por el Motor de Optimización
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='performance_metrics', verbose_name="Proyecto")
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='metrics', verbose_name="Tarea Específica")
    unit = models.CharField(max_length=50, verbose_name="Unidad de Medida", help_text="Ej. M2 de encofrado, M3 de concreto, Renders")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Cantidad Total")
    rate_per_day = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Rendimiento Diario Estimado", help_text="Ej. M2 por día")
    divisor = models.PositiveIntegerField(default=5, verbose_name="Factor Divisor / Reductor", help_text="Factor de aceleración para cálculo de reducción")

    class Meta:
        verbose_name = "Métrica de Rendimiento"
        verbose_name_plural = "Métricas de Rendimiento"

    def __str__(self):
        return f"{self.project.code} - {self.unit} ({self.rate_per_day}/día)"


class DriveLink(models.Model):
    """
    Enlaces a documentación y entregables alojados en Google Drive
    """
    FILE_TYPES = [
        ('FOLDER', 'Carpeta Principal de Proyecto'),
        ('DOCUMENT', 'Documento / Especificación Técnica'),
        ('BIM_MODEL', 'Modelo BIM / Revit'),
        ('RENDER_360', 'Render / Recorrido Virtual 360°'),
        ('SPREADSHEET', 'Hoja de Cálculo / Presupuesto'),
        ('OTHER', 'Otro'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='drive_links', verbose_name="Proyecto")
    title = models.CharField(max_length=200, verbose_name="Título del Enlace")
    drive_url = models.URLField(max_length=500, verbose_name="URL de Google Drive")
    file_id = models.CharField(max_length=150, blank=True, null=True, verbose_name="Google Drive File/Folder ID")
    file_type = models.CharField(max_length=20, choices=FILE_TYPES, default='FOLDER', verbose_name="Tipo de Archivo")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Enlace de Drive"
        verbose_name_plural = "Enlaces de Drive"

    def __str__(self):
        return f"{self.project.code} - {self.title} ({self.get_file_type_display()})"