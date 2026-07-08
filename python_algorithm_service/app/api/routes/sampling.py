from fastapi import APIRouter, Request

from app.api.error_handling import attach_request_context
from app.schemas.common import ServiceEnvelope
from app.schemas.sampling import BatchSamplingRequest, BatchSamplingResult
from app.services.sampling_service import SamplingService

router = APIRouter(prefix="/api/v1/sampling", tags=["sampling"])
service = SamplingService()


@router.post("/batch-plan", response_model=ServiceEnvelope[BatchSamplingResult])
def batch_plan(
    request: Request,
    payload: BatchSamplingRequest,
) -> ServiceEnvelope[BatchSamplingResult]:
    return attach_request_context(request, service.plan_batch(payload))
