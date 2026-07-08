from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.domain.common.enums import RiskLevel


class SamplingTaskItem(BaseModel):
    task_id: str
    risk_level: RiskLevel


class BatchSamplingContext(BaseModel):
    model_config = ConfigDict(extra="allow")

    batch_risk_level: RiskLevel | None = None
    task_count: int | None = Field(default=None, ge=0)
    target_sample_count: int | None = Field(default=None, ge=1)
    sampling_seed: str | int | None = None

    def model_dump(self, *args: Any, **kwargs: Any) -> dict[str, Any]:
        kwargs.setdefault("exclude_none", True)
        return super().model_dump(*args, **kwargs)


class BatchSamplingRequest(BaseModel):
    batch_id: str
    project_id: str
    task_pool: list[SamplingTaskItem] = Field(default_factory=list)
    context: BatchSamplingContext = Field(default_factory=BatchSamplingContext)


class BatchSamplingResult(BaseModel):
    sampling_ratio: float
    sample_count: int
    selected_task_ids: list[str]
    recommendation_flags: list[str]
