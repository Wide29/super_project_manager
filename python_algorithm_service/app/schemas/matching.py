from pydantic import BaseModel, Field


class RecommendTaskWorkersRequest(BaseModel):
    task_id: str
    project_id: str
    batch_id: str
    candidate_worker_ids: list[str] = Field(default_factory=list)
    top_k: int = 5
    context: dict = Field(default_factory=dict)


class RecommendationItem(BaseModel):
    worker_id: str
    rank: int
    score: float
    reasons: list[str]
    warnings: list[str]


class RecommendTaskWorkersResult(BaseModel):
    recommendations: list[RecommendationItem]
