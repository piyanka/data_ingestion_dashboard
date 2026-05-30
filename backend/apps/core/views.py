from rest_framework import viewsets
from django.db.models import Q

from .models import AuditLog, Organization
from .serializers import AuditLogSerializer, OrganizationSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("changed_by").all()
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        organization_id = self.request.query_params.get("organization_id")
        if not organization_id:
            return queryset

        return queryset.filter(
            Q(entity_type="Organization", entity_id=str(organization_id))
            | Q(
                entity_type="SourceFile",
                entity_id__in=self._source_file_ids(organization_id),
            )
            | Q(
                entity_type="NormalizedActivity",
                entity_id__in=self._activity_ids(organization_id),
            )
        )

    @staticmethod
    def _source_file_ids(organization_id):
        from apps.ingestion.models import SourceFile

        return [str(source_file_id) for source_file_id in SourceFile.objects.filter(organization_id=organization_id).values_list("id", flat=True)]

    @staticmethod
    def _activity_ids(organization_id):
        from apps.ingestion.models import NormalizedActivity

        return [str(activity_id) for activity_id in NormalizedActivity.objects.filter(organization_id=organization_id).values_list("id", flat=True)]
