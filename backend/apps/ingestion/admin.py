from django.contrib import admin

from .models import EmissionRecord, NormalizedActivity, RawRecord, SourceFile, ValidationIssue


@admin.register(SourceFile)
class SourceFileAdmin(admin.ModelAdmin):
    list_display = ("id", "organization", "source_type", "filename", "processing_status", "uploaded_at")
    list_filter = ("source_type", "processing_status")
    search_fields = ("filename",)


@admin.register(RawRecord)
class RawRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "source_file", "row_number", "parse_status", "created_at")
    list_filter = ("parse_status",)


@admin.register(NormalizedActivity)
class NormalizedActivityAdmin(admin.ModelAdmin):
    list_display = ("id", "organization", "source_type", "activity_type", "activity_date", "scope", "status")
    list_filter = ("source_type", "scope", "status")
    search_fields = ("activity_type",)


@admin.register(EmissionRecord)
class EmissionRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "activity", "methodology_version", "co2e_amount", "calculated_at")
    search_fields = ("methodology_version",)


@admin.register(ValidationIssue)
class ValidationIssueAdmin(admin.ModelAdmin):
    list_display = ("id", "issue_type", "severity", "created_at")
    list_filter = ("severity", "issue_type")

