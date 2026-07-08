from fastapi import APIRouter, Request

from app.api.error_handling import attach_request_context
from app.schemas.common import ServiceEnvelope
from app.schemas.risk import (
    TaskRiskRequest,
    TaskRiskResult,
    WorkerRiskRequest,
    WorkerRiskResult,
)
from app.services.risk_service import RiskService

router = APIRouter(prefix="/api/v1/risk", tags=["risk"])
service = RiskService()


@router.post("/task-score", response_model=ServiceEnvelope[TaskRiskResult])
def score_task(request: Request, payload: TaskRiskRequest) -> ServiceEnvelope[TaskRiskResult]:
    return attach_request_context(request, service.score_task(payload))


@router.post("/worker-score", response_model=ServiceEnvelope[WorkerRiskResult])
def score_worker(
    request: Request,
    payload: WorkerRiskRequest,
) -> ServiceEnvelope[WorkerRiskResult]:
    return attach_request_context(request, service.score_worker(payload))
