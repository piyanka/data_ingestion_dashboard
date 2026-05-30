from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.utils import timezone
from django.db import transaction

from apps.core.models import AuditLog

from .models import EmissionRecord, NormalizedActivity, RawRecord, SourceFile, ValidationIssue
from .serializers import (
    EmissionRecordSerializer,
    NormalizedActivitySerializer,
    RawRecordSerializer,
    SourceFileSerializer,
    SourceFileUploadSerializer,
    SourceFileUpdateSerializer,
    ValidationIssueSerializer,
)
from .services.file_ingestion import ingest_source_file
from .services.validation import resolve_validation_issues


class SourceFileViewSet(viewsets.ModelViewSet):
    queryset = SourceFile.objects.select_related("organization").all()
    serializer_class = SourceFileSerializer
    http_method_names = ["get", "put", "patch", "delete", "head", "options"]

    def get_queryset(self):
        queryset = super().get_queryset()
        organization_id = self.request.query_params.get("organization_id")
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
        return queryset

    def get_serializer_class(self):
        if self.action in {"update", "partial_update"}:
            return SourceFileUpdateSerializer
        return SourceFileSerializer

    def perform_update(self, serializer):
        instance = serializer.instance
        old_values = {
            "organization_id": instance.organization_id,
            "organization_name": instance.organization.name,
            "source_type": instance.source_type,
            "filename": instance.filename,
            "processing_status": instance.processing_status,
        }
        with transaction.atomic():
            updated = serializer.save()
            AuditLog.objects.create(
                entity_type="SourceFile",
                entity_id=str(updated.id),
                action_type="update",
                changed_by=self.request.user if self.request.user.is_authenticated else None,
                old_values=old_values,
                new_values={
                    "organization_id": updated.organization_id,
                    "organization_name": updated.organization.name,
                    "source_type": updated.source_type,
                    "filename": updated.filename,
                    "processing_status": updated.processing_status,
                },
            )

    def perform_destroy(self, instance):
        old_values = {
            "organization_id": instance.organization_id,
            "organization_name": instance.organization.name,
            "source_type": instance.source_type,
            "filename": instance.filename,
            "processing_status": instance.processing_status,
            "total_rows": instance.total_rows,
            "successful_rows": instance.successful_rows,
            "failed_rows": instance.failed_rows,
            "checksum_sha256": instance.checksum_sha256,
        }
        with transaction.atomic():
            AuditLog.objects.create(
                entity_type="SourceFile",
                entity_id=str(instance.id),
                action_type="delete",
                changed_by=self.request.user if self.request.user.is_authenticated else None,
                old_values=old_values,
                new_values={},
            )
            instance.delete()


class SourceFileUploadAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = SourceFileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        source_file = serializer.save()
        ingest_source_file(source_file)
        source_file.refresh_from_db()
        output = SourceFileSerializer(source_file).data
        return Response(output, status=status.HTTP_201_CREATED)


class RawRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RawRecord.objects.select_related("source_file").all()
    serializer_class = RawRecordSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        organization_id = self.request.query_params.get("organization_id")
        if organization_id:
            queryset = queryset.filter(source_file__organization_id=organization_id)
        return queryset


class NormalizedActivityViewSet(viewsets.ModelViewSet):
    queryset = NormalizedActivity.objects.select_related("organization", "raw_record").all()
    serializer_class = NormalizedActivitySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        organization_id = self.request.query_params.get("organization_id")
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
        return queryset

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        activity = self.get_object()
        old_values = {
            "status": activity.status,
            "review_notes": activity.review_notes,
            "reviewed_by_id": activity.reviewed_by_id,
            "reviewed_at": activity.reviewed_at.isoformat() if activity.reviewed_at else None,
        }
        activity.status = request.data.get("status", NormalizedActivity.Status.APPROVED)
        activity.review_notes = request.data.get("review_notes", "")
        activity.reviewed_by = request.user if request.user.is_authenticated else None
        activity.reviewed_at = timezone.now()
        activity.save(update_fields=["status", "review_notes", "reviewed_by", "reviewed_at", "updated_at"])
        resolve_validation_issues(
            activity,
            resolved_by=request.user if request.user.is_authenticated else None,
            resolution_status=activity.status,
        )
        AuditLog.objects.create(
            entity_type="NormalizedActivity",
            entity_id=str(activity.id),
            action_type="review",
            changed_by=request.user if request.user.is_authenticated else None,
            old_values=old_values,
            new_values={
                "status": activity.status,
                "review_notes": activity.review_notes,
                "reviewed_by_id": activity.reviewed_by_id,
                "reviewed_at": activity.reviewed_at.isoformat() if activity.reviewed_at else None,
            },
        )
        return Response(self.get_serializer(activity).data)


class EmissionRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmissionRecord.objects.select_related("activity").all()
    serializer_class = EmissionRecordSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        organization_id = self.request.query_params.get("organization_id")
        if organization_id:
            queryset = queryset.filter(activity__organization_id=organization_id)
        return queryset


class ValidationIssueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ValidationIssue.objects.select_related("activity", "raw_record").all()
    serializer_class = ValidationIssueSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        organization_id = self.request.query_params.get("organization_id")
        if organization_id:
            queryset = queryset.filter(
                Q(activity__organization_id=organization_id)
                | Q(raw_record__source_file__organization_id=organization_id)
            )
        include_resolved = self.request.query_params.get("include_resolved", "").lower() in {"1", "true", "yes"}
        if not include_resolved:
            queryset = queryset.filter(resolved_at__isnull=True)
        return queryset
