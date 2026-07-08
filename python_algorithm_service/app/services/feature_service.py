from typing import Any

from app.infra.repositories.feature_repository import FeatureRepository


class FeatureService:
    def __init__(self, repository: FeatureRepository | None = None) -> None:
        self.repository = repository or FeatureRepository()

    def get_task_features(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.repository.get_task_features(payload)

    def get_worker_features(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.repository.get_worker_features(payload)

    def get_batch_features(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.repository.get_batch_features(payload)
