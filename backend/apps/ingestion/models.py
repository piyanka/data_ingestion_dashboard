from django.conf import settings
from django.db import models

from apps.core.models import Organization, TimeStampedModel


class SourceFile(models.Model):
    class SourceType(models.TextChoices):
        SAP = "sap", "SAP"
        UTILITY = "utility", "Utility"
        TRAVEL = "travel", "Travel"

    class ProcessingStatus(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        PROCESSING = "processing", "Processing"
        PROCESSED = "processed", "Processed"
        PROCESSED_WITH_ERRORS = "processed_with_errors", "Processed with errors"
        FAILED = "failed", "Failed"

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="source_files")
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    filename = models.CharField(max_length=255)
    uploaded_file = models.FileField(upload_to="source-files/%Y/%m/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processing_status = models.CharField(
        max_length=40, choices=ProcessingStatus.choices, default=ProcessingStatus.UPLOADED
    )
    total_rows = models.PositiveIntegerField(default=0)
    successful_rows = models.PositiveIntegerField(default=0)
    failed_rows = models.PositiveIntegerField(default=0)
    checksum_sha256 = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["organization", "source_type"]),
            models.Index(fields=["processing_status"]),
        ]

    def __str__(self) -> str:
        return f"{self.filename} ({self.source_type})"


class RawRecord(models.Model):
    class ParseStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PARSED = "parsed", "Parsed"
        FAILED = "failed", "Failed"

    source_file = models.ForeignKey(SourceFile, on_delete=models.CASCADE, related_name="raw_records")
    row_number = models.PositiveIntegerField()
    raw_payload = models.JSONField(default=dict)
    parse_status = models.CharField(max_length=20, choices=ParseStatus.choices, default=ParseStatus.PENDING)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["row_number"]
        constraints = [
            models.UniqueConstraint(fields=["source_file", "row_number"], name="unique_raw_row_per_file")
        ]
        indexes = [
            models.Index(fields=["source_file", "row_number"]),
            models.Index(fields=["parse_status"]),
        ]

    def __str__(self) -> str:
        return f"{self.source_file_id}:{self.row_number}"


class NormalizedActivity(TimeStampedModel):
    class Scope(models.TextChoices):
        SCOPE_1 = "scope_1", "Scope 1"
        SCOPE_2 = "scope_2", "Scope 2"
        SCOPE_3 = "scope_3", "Scope 3"

    class Status(models.TextChoices):
        PENDING_REVIEW = "pending_review", "Pending review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        LOCKED = "locked", "Locked"

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="activities")
    raw_record = models.OneToOneField(RawRecord, on_delete=models.CASCADE, related_name="normalized_activity")
    source_type = models.CharField(max_length=20, choices=SourceFile.SourceType.choices)
    activity_type = models.CharField(max_length=100)
    activity_date = models.DateField(null=True, blank=True)
    quantity = models.DecimalField(max_digits=18, decimal_places=6)
    unit = models.CharField(max_length=50)
    original_quantity = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    original_unit = models.CharField(max_length=50, blank=True, default="")
    scope = models.CharField(max_length=20, choices=Scope.choices)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING_REVIEW)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_activities",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "source_type"]),
            models.Index(fields=["scope"]),
            models.Index(fields=["status"]),
            models.Index(fields=["activity_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.source_type}:{self.activity_type}:{self.activity_date}"


class EmissionRecord(models.Model):
    activity = models.ForeignKey(NormalizedActivity, on_delete=models.CASCADE, related_name="emission_records")
    emission_factor = models.DecimalField(max_digits=18, decimal_places=8)
    emission_factor_source = models.CharField(max_length=255)
    co2e_amount = models.DecimalField(max_digits=18, decimal_places=6)
    methodology_version = models.CharField(max_length=50)
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-calculated_at"]
        indexes = [
            models.Index(fields=["activity", "methodology_version"]),
        ]

    def __str__(self) -> str:
        return f"{self.activity_id} @ {self.methodology_version}"


class ValidationIssue(models.Model):
    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    activity = models.ForeignKey(
        NormalizedActivity,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="validation_issues",
    )
    raw_record = models.ForeignKey(
        RawRecord,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="validation_issues",
    )
    issue_type = models.CharField(max_length=100)
    severity = models.CharField(max_length=20, choices=Severity.choices)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["severity"]),
            models.Index(fields=["issue_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.issue_type} ({self.severity})"
