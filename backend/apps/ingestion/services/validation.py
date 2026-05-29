"""Validation rules should explain *why* a row looks suspicious."""

from statistics import median

from ..models import NormalizedActivity, ValidationIssue
from .emissions import calculate_emissions_for_activity


def validate_normalized_activity(activity: NormalizedActivity) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    if activity.quantity == 0:
        issues.append(
            ValidationIssue.objects.create(
                activity=activity,
                raw_record=activity.raw_record,
                issue_type="quantity_is_zero",
                severity=ValidationIssue.Severity.HIGH,
                message="Normalized quantity is 0.",
            )
        )
    if activity.quantity < 0:
        issues.append(
            ValidationIssue.objects.create(
                activity=activity,
                raw_record=activity.raw_record,
                issue_type="quantity_below_zero",
                severity=ValidationIssue.Severity.HIGH,
                message="Normalized quantity is less than 0.",
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
    issues.extend(_flag_quantity_outlier(activity))
    calculate_emissions_for_activity(activity)
    return issues


def _flag_quantity_outlier(activity: NormalizedActivity) -> list[ValidationIssue]:
    peer_quantities = list(
        NormalizedActivity.objects.filter(
            organization=activity.organization,
            source_type=activity.source_type,
            activity_type=activity.activity_type,
            unit=activity.unit,
        )
        .exclude(id=activity.id)
        .values_list("quantity", flat=True)
    )
    peer_quantities = [quantity for quantity in peer_quantities if quantity is not None and quantity > 0]
    if len(peer_quantities) < 4:
        return []

    peer_median = median(peer_quantities)
    if peer_median <= 0:
        return []

    ratio = activity.quantity / peer_median
    if ratio >= 3 or ratio <= 1 / 3:
        direction = "higher" if ratio >= 3 else "lower"
        return [
            ValidationIssue.objects.create(
                activity=activity,
                raw_record=activity.raw_record,
                issue_type="quantity_outlier",
                severity=ValidationIssue.Severity.MEDIUM,
                message=(
                    f"Normalized quantity is {direction} than peer rows "
                    f"(current={activity.quantity}, peer_median={peer_median})."
                ),
            )
        ]

    return []
