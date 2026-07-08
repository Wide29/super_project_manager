from fastapi import APIRouter

from app.schemas.common import ServiceEnvelope
from app.schemas.sampling import BatchSamplingRequest, BatchSamplingResult
from app.services.sampling_service import SamplingService

router = APIRouter(prefix="/api/v1/sampling", tags=["sampling"])
service = SamplingService()


@router.post("/batch-plan", response_model=ServiceEnvelope[BatchSamplingResult])
def batch_plan(payload: BatchSamplingRequest) -> ServiceEnvelope[BatchSamplingResult]:
    return service.plan_batch(payload)
