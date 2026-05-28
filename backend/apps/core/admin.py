from django.contrib import admin

from .models import AuditLog, Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name",)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("entity_type", "entity_id", "action_type", "changed_at")
    list_filter = ("entity_type", "action_type")
    search_fields = ("entity_type", "entity_id")

