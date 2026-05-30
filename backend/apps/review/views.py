from django.utils import timezone
from rest_framework import viewsets

from apps.core.models import AuditLog
from apps.ingestion.models import NormalizedActivity

from .serializers import AnalystReviewSerializer, ReviewQueueItemSerializer


class ReviewQueueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NormalizedActivity.objects.select_related("organization", "raw_record").filter(
        status=NormalizedActivity.Status.PENDING_REVIEW
    )
    serializer_class = ReviewQueueItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        organization_id = self.request.query_params.get("organization_id")
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
        return queryset


class AnalystReviewViewSet(viewsets.ModelViewSet):
    queryset = NormalizedActivity.objects.all()
    serializer_class = AnalystReviewSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        organization_id = self.request.query_params.get("organization_id")
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
        return queryset

    def perform_update(self, serializer):
        instance = serializer.instance
        old_values = {
            "status": instance.status,
            "review_notes": instance.review_notes,
            "reviewed_by_id": instance.reviewed_by_id,
            "reviewed_at": instance.reviewed_at.isoformat() if instance.reviewed_at else None,
        }
        updated = serializer.save(
            reviewed_by=self.request.user if self.request.user.is_authenticated else None,
            reviewed_at=timezone.now(),
        )
        AuditLog.objects.create(
            entity_type="NormalizedActivity",
            entity_id=str(updated.id),
            action_type="review",
            changed_by=self.request.user if self.request.user.is_authenticated else None,
            old_values=old_values,
            new_values={
                "status": updated.status,
                "review_notes": updated.review_notes,
                "reviewed_by_id": updated.reviewed_by_id,
                "reviewed_at": updated.reviewed_at.isoformat() if updated.reviewed_at else None,
            },
        )
