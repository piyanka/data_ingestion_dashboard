from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AnalystReviewViewSet, ReviewQueueViewSet

router = DefaultRouter()
router.register(r"review-queue", ReviewQueueViewSet, basename="review-queue")
router.register(r"analyst-reviews", AnalystReviewViewSet, basename="analyst-review")

urlpatterns = [
    path("", include(router.urls)),
]

