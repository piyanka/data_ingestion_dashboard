import hashlib

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
        checksum = self._calculate_checksum(uploaded_file)
        duplicate = SourceFile.objects.filter(
            organization=validated_data["organization"],
            source_type=validated_data["source_type"],
            checksum_sha256=checksum,
        ).first()
        if duplicate:
            raise serializers.ValidationError(
                {
                    "file": (
                        f"An identical file already exists as source file {duplicate.id} "
                        f"({duplicate.filename}). Delete the duplicate or update the existing batch instead."
                    )
                }
            )
        source_file = SourceFile.objects.create(uploaded_file=uploaded_file, checksum_sha256=checksum, **validated_data)
        return source_file

    @staticmethod
    def _calculate_checksum(uploaded_file) -> str:
        digest = hashlib.sha256()
        for chunk in uploaded_file.chunks():
            digest.update(chunk)
        uploaded_file.seek(0)
        return digest.hexdigest()


class SourceFileSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    duplicate_count = serializers.SerializerMethodField()
    is_duplicate = serializers.SerializerMethodField()

    class Meta:
        model = SourceFile
        fields = "__all__"

    def get_duplicate_count(self, obj):
        if not obj.checksum_sha256:
            return 1
        return SourceFile.objects.filter(
            organization=obj.organization,
            source_type=obj.source_type,
            checksum_sha256=obj.checksum_sha256,
        ).count()

    def get_is_duplicate(self, obj):
        return self.get_duplicate_count(obj) > 1


class SourceFileUpdateSerializer(serializers.ModelSerializer):
    organization_id = serializers.PrimaryKeyRelatedField(
        source="organization", queryset=Organization.objects.all(), required=False
    )

    class Meta:
        model = SourceFile
        fields = ["organization_id", "source_type", "filename"]


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
    activity_type = serializers.CharField(source="activity.activity_type", read_only=True)
    activity_source_type = serializers.CharField(source="activity.source_type", read_only=True)
    raw_record_row_number = serializers.IntegerField(source="raw_record.row_number", read_only=True)
    source_file_filename = serializers.CharField(source="raw_record.source_file.filename", read_only=True)

    class Meta:
        model = ValidationIssue
        fields = "__all__"
