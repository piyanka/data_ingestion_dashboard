from rest_framework import viewsets

from .models import AuditLog, Organization
from .serializers import AuditLogSerializer, OrganizationSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("changed_by").all()
    serializer_class = AuditLogSerializer

