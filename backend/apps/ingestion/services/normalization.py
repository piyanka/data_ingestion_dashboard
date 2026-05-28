"""Normalization turns messy source rows into the canonical activity model."""

from datetime import datetime
from decimal import Decimal, InvalidOperation

from django.utils import timezone

from apps.core.models import AuditLog

from ..models import NormalizedActivity, RawRecord, SourceFile


def normalize_raw_record(raw_record: RawRecord) -> NormalizedActivity:
    payload = raw_record.raw_payload
    activity = NormalizedActivity.objects.create(
        organization=raw_record.source_file.organization,
        raw_record=raw_record,
        source_type=raw_record.source_file.source_type,
        activity_type=_infer_activity_type(raw_record.source_file.source_type, payload),
        activity_date=_parse_date(payload),
        quantity=_parse_quantity(payload),
        unit=_parse_unit(payload),
        original_quantity=_parse_original_quantity(payload),
        original_unit=_parse_original_unit(payload),
        scope=_infer_scope(raw_record.source_file.source_type, payload),
        status=NormalizedActivity.Status.PENDING_REVIEW,
    )
    AuditLog.objects.create(
        entity_type="NormalizedActivity",
        entity_id=str(activity.id),
        action_type="create",
        new_values={
            "source_type": activity.source_type,
            "activity_type": activity.activity_type,
            "scope": activity.scope,
        },
    )
    return activity


def _infer_activity_type(source_type: str, payload: dict) -> str:
    if source_type == SourceFile.SourceType.SAP:
        return payload.get("activity_type") or payload.get("belegart") or "fuel_or_procurement"
    if source_type == SourceFile.SourceType.UTILITY:
        return payload.get("activity_type") or "electricity"
    return payload.get("category") or payload.get("travel_type") or "travel"


def _parse_date(payload: dict):
    for key in ("activity_date", "date", "posting_date", "billing_start", "billing_date", "travel_date"):
        if payload.get(key):
            value = payload[key]
            if hasattr(value, "year"):
                return value
            text = str(value).strip()
            for fmt in (
                "%Y-%m-%d",
                "%d/%m/%Y",
                "%m/%d/%Y",
                "%d.%m.%Y",
                "%Y/%m/%d",
                "%d-%m-%Y",
                "%Y-%m-%d %H:%M:%S",
                "%d/%m/%Y %H:%M",
            ):
                try:
                    return datetime.strptime(text, fmt).date()
                except ValueError:
                    continue
            return None
    return None


def _parse_quantity(payload: dict) -> Decimal:
    value = _first_present(payload, ("quantity", "qty", "amount", "distance", "mwh", "kwh"))
    if value in (None, ""):
        return Decimal("0")
    try:
        return Decimal(str(value).replace(",", "").strip())
    except InvalidOperation:
        return Decimal("0")


def _parse_unit(payload: dict) -> str:
    return str(_first_present(payload, ("unit", "uom", "measurement_unit", "currency_unit")) or "")


def _parse_original_quantity(payload: dict):
    value = _first_present(payload, ("original_quantity", "raw_quantity"))
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value).replace(",", "").strip())
    except InvalidOperation:
        return None


def _parse_original_unit(payload: dict) -> str:
    return str(_first_present(payload, ("original_unit", "raw_unit")) or "")


def _infer_scope(source_type: str, payload: dict) -> str:
    explicit = payload.get("scope")
    if explicit in {NormalizedActivity.Scope.SCOPE_1, NormalizedActivity.Scope.SCOPE_2, NormalizedActivity.Scope.SCOPE_3}:
        return explicit
    if source_type == SourceFile.SourceType.UTILITY:
        return NormalizedActivity.Scope.SCOPE_2
    return NormalizedActivity.Scope.SCOPE_3


def _first_present(payload: dict, keys: tuple):
    for key in keys:
        if key in payload and payload[key] not in (None, ""):
            return payload[key]
    return None
