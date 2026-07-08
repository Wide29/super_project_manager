from fastapi import APIRouter

from app.schemas.common import (
    HEALTH_FEATURE_VERSION,
    HEALTH_RULE_VERSION,
    HealthResult,
    ServiceEnvelope,
)

router = APIRouter()


@router.get("/health", response_model=ServiceEnvelope[HealthResult])
def health() -> ServiceEnvelope[HealthResult]:
    return ServiceEnvelope(
        service="health",
        rule_version=HEALTH_RULE_VERSION,
        feature_version=HEALTH_FEATURE_VERSION,
        result=HealthResult(status="ok"),
    )
