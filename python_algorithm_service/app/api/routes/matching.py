from fastapi import APIRouter, Request

from app.api.error_handling import attach_request_context
from app.schemas.common import ServiceEnvelope
from app.schemas.matching import (
    RecommendTaskWorkersRequest,
    RecommendTaskWorkersResult,
)
from app.services.matching_service import MatchingService

router = APIRouter(prefix="/api/v1/matching", tags=["matching"])
service = MatchingService()


@router.post(
    "/recommend-task-workers",
    response_model=ServiceEnvelope[RecommendTaskWorkersResult],
)
def recommend_task_workers(
    request: Request,
    payload: RecommendTaskWorkersRequest,
) -> ServiceEnvelope[RecommendTaskWorkersResult]:
    return attach_request_context(request, service.recommend(payload))
