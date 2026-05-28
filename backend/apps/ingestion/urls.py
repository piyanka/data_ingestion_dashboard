from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EmissionRecordViewSet,
    NormalizedActivityViewSet,
    RawRecordViewSet,
    SourceFileUploadAPIView,
    SourceFileViewSet,
    ValidationIssueViewSet,
)

router = DefaultRouter()
router.register(r"source-files", SourceFileViewSet, basename="source-file")
router.register(r"raw-records", RawRecordViewSet, basename="raw-record")
router.register(r"activities", NormalizedActivityViewSet, basename="activity")
router.register(r"emission-records", EmissionRecordViewSet, basename="emission-record")
router.register(r"validation-issues", ValidationIssueViewSet, basename="validation-issue")

urlpatterns = [
    path("source-files/upload/", SourceFileUploadAPIView.as_view(), name="source-file-upload"),
    path("", include(router.urls)),
]

