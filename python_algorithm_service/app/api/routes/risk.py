from fastapi import APIRouter

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
def score_task(payload: TaskRiskRequest) -> ServiceEnvelope[TaskRiskResult]:
    return service.score_task(payload)


@router.post("/worker-score", response_model=ServiceEnvelope[WorkerRiskResult])
def score_worker(payload: WorkerRiskRequest) -> ServiceEnvelope[WorkerRiskResult]:
    return service.score_worker(payload)
