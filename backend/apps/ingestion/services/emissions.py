"""Emission calculations are derived and intentionally simple for the prototype."""

from decimal import Decimal

from ..models import EmissionRecord, NormalizedActivity


def calculate_emissions_for_activity(activity: NormalizedActivity) -> EmissionRecord:
    emission_factor = _default_emission_factor(activity)
    co2e_amount = Decimal(activity.quantity) * emission_factor
    return EmissionRecord.objects.create(
        activity=activity,
        emission_factor=emission_factor,
        emission_factor_source="prototype-default-factor-set",
        co2e_amount=co2e_amount,
        methodology_version="v1",
    )


def _default_emission_factor(activity: NormalizedActivity) -> Decimal:
    if activity.source_type == "utility":
        return Decimal("0.0004")
    if activity.source_type == "sap":
        return Decimal("0.0027")
    return Decimal("0.0009")

