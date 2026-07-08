from pydantic import BaseModel, Field


class SamplingTaskItem(BaseModel):
    task_id: str
    risk_level: str


class BatchSamplingRequest(BaseModel):
    batch_id: str
    project_id: str
    task_pool: list[SamplingTaskItem] = Field(default_factory=list)
    context: dict = Field(default_factory=dict)


class BatchSamplingResult(BaseModel):
    sampling_ratio: float
    sample_count: int
    selected_task_ids: list[str]
    recommendation_flags: list[str]
