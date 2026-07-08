from pydantic import BaseModel, Field


class TaskRiskRequest(BaseModel):
    task_id: str
    project_id: str
    context: dict = Field(default_factory=dict)


class TaskRiskResult(BaseModel):
    risk_score: int
    risk_level: str
    reason_codes: list[str]


class WorkerRiskRequest(BaseModel):
    worker_id: str
    project_id: str
    window_type: str = "7d"
    context: dict = Field(default_factory=dict)


class WorkerRiskResult(BaseModel):
    risk_score: int
    risk_level: str
    reason_codes: list[str]
    window_type: str
