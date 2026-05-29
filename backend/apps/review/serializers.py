from rest_framework import serializers

from apps.ingestion.models import NormalizedActivity, ValidationIssue


class AnalystReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = NormalizedActivity
        fields = ["id", "raw_record", "status", "review_notes", "reviewed_by", "reviewed_at"]
        read_only_fields = ["reviewed_by", "reviewed_at"]


class ReviewQueueItemSerializer(serializers.ModelSerializer):
    issue_count = serializers.SerializerMethodField()

    class Meta:
        model = NormalizedActivity
        fields = [
            "id",
            "raw_record",
            "source_type",
            "activity_type",
            "activity_date",
            "quantity",
            "unit",
            "scope",
            "status",
            "issue_count",
        ]

    def get_issue_count(self, obj):
        return ValidationIssue.objects.filter(activity=obj).count()
