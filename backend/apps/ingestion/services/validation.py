"""Validation rules should explain *why* a row looks suspicious."""

from ..models import NormalizedActivity, ValidationIssue
from .emissions import calculate_emissions_for_activity


def validate_normalized_activity(activity: NormalizedActivity) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    if activity.quantity <= 0:
        issues.append(
            ValidationIssue.objects.create(
                activity=activity,
                raw_record=activity.raw_record,
                issue_type="non_positive_quantity",
                severity=ValidationIssue.Severity.HIGH,
                message="Normalized quantity is zero or negative.",
            )
        )
    if not activity.activity_date:
        issues.append(
            ValidationIssue.objects.create(
                activity=activity,
                raw_record=activity.raw_record,
                issue_type="missing_activity_date",
                severity=ValidationIssue.Severity.MEDIUM,
                message="Activity date could not be derived from the source row.",
            )
        )
    calculate_emissions_for_activity(activity)
    return issues

