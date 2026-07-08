from fastapi import APIRouter

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
    payload: RecommendTaskWorkersRequest,
) -> ServiceEnvelope[RecommendTaskWorkersResult]:
    return service.recommend(payload)
