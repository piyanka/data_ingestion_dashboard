from rest_framework import serializers

from .models import AuditLog, Organization


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "created_at"]


class AuditLogSerializer(serializers.ModelSerializer):
    changed_by_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "entity_type",
            "entity_id",
            "action_type",
            "changed_by",
            "changed_by_display",
            "old_values",
            "new_values",
            "changed_at",
        ]

    def get_changed_by_display(self, obj):
        if obj.changed_by:
            return obj.changed_by.get_username() or obj.changed_by.get_full_name() or str(obj.changed_by)
        return "System"

