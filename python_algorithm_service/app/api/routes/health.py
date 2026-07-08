from fastapi import APIRouter, Request

from app.api.error_handling import attach_request_context
from app.schemas.common import (
    HEALTH_FEATURE_VERSION,
    HEALTH_RULE_VERSION,
    HealthResult,
    ServiceEnvelope,
)

router = APIRouter()


@router.get("/health", response_model=ServiceEnvelope[HealthResult])
def health(request: Request) -> ServiceEnvelope[HealthResult]:
    return attach_request_context(
        request,
        ServiceEnvelope(
            service="health",
            rule_version=HEALTH_RULE_VERSION,
            feature_version=HEALTH_FEATURE_VERSION,
            result=HealthResult(status="ok"),
        ),
    )
