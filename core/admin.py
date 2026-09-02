from django.contrib import admin
from .models import (
    TechnicalArea,
    TeamStatus,
    TeamMember,
    Project,
    Milestone,
    Task,
    PerformanceMetric,
    DriveLink,
)


class MilestoneInline(admin.TabularInline):
    model = Milestone
    extra = 1


class TaskInline(admin.TabularInline):
    model = Task
    extra = 1
    fields = ('title', 'category', 'assigned_to', 'start_date', 'end_date', 'status', 'is_critical_path')


class DriveLinkInline(admin.TabularInline):
    model = DriveLink
    extra = 1


class PerformanceMetricInline(admin.TabularInline):
    model = PerformanceMetric
    extra = 1


@admin.register(TechnicalArea)
class TechnicalAreaAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name',)


@admin.register(TeamStatus)
class TeamStatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'color_code', 'description')
    search_fields = ('name',)


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'role', 'technical_area', 'status', 'is_active')
    list_filter = ('technical_area', 'status', 'is_active')
    search_fields = ('first_name', 'last_name', 'email', 'role')


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'status', 'start_date', 'end_date', 'duration_months', 'budget')
    list_filter = ('status', 'start_date')
    search_fields = ('code', 'name', 'description')
    inlines = [MilestoneInline, TaskInline, DriveLinkInline, PerformanceMetricInline]


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'target_date', 'completed_date', 'status')
    list_filter = ('status', 'project')
    search_fields = ('name', 'project__name', 'project__code')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'category', 'assigned_to', 'start_date', 'end_date', 'status', 'is_critical_path')
    list_filter = ('status', 'is_critical_path', 'category', 'project')
    search_fields = ('title', 'description', 'project__name', 'project__code')
    filter_horizontal = ('predecessors',)


@admin.register(PerformanceMetric)
class PerformanceMetricAdmin(admin.ModelAdmin):
    list_display = ('project', 'unit', 'quantity', 'rate_per_day', 'divisor')
    list_filter = ('unit', 'project')
    search_fields = ('project__name', 'unit')


@admin.register(DriveLink)
class DriveLinkAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'file_type', 'drive_url', 'created_at')
    list_filter = ('file_type', 'project')
    search_fields = ('title', 'project__name', 'project__code')
