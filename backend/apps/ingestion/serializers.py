from rest_framework import serializers

from apps.core.models import Organization

from .models import EmissionRecord, NormalizedActivity, RawRecord, SourceFile, ValidationIssue


class SourceFileUploadSerializer(serializers.ModelSerializer):
    organization_id = serializers.PrimaryKeyRelatedField(
        source="organization", queryset=Organization.objects.all(), write_only=True
    )
    file = serializers.FileField(source="uploaded_file", write_only=True)
    filename = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = SourceFile
        fields = [
            "id",
            "organization_id",
            "source_type",
            "filename",
            "file",
            "processing_status",
            "total_rows",
            "successful_rows",
            "failed_rows",
            "uploaded_at",
        ]
        read_only_fields = ["processing_status", "total_rows", "successful_rows", "failed_rows", "uploaded_at"]

    def create(self, validated_data):
        uploaded_file = validated_data.pop("uploaded_file")
        if not validated_data.get("filename"):
            validated_data["filename"] = uploaded_file.name
        source_file = SourceFile.objects.create(uploaded_file=uploaded_file, **validated_data)
        return source_file


class SourceFileSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    class Meta:
        model = SourceFile
        fields = "__all__"


class RawRecordSerializer(serializers.ModelSerializer):
    source_file_filename = serializers.CharField(source="source_file.filename", read_only=True)
    source_file_type = serializers.CharField(source="source_file.source_type", read_only=True)

    class Meta:
        model = RawRecord
        fields = "__all__"


class NormalizedActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = NormalizedActivity
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class EmissionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmissionRecord
        fields = "__all__"


class ValidationIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValidationIssue
        fields = "__all__"
