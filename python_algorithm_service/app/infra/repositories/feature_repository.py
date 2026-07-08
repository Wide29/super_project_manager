from typing import Any


class FeatureRepository:
    def get_task_features(self, payload: dict[str, Any]) -> dict[str, Any]:
        return payload

    def get_worker_features(self, payload: dict[str, Any]) -> dict[str, Any]:
        return payload

    def get_batch_features(self, payload: dict[str, Any]) -> dict[str, Any]:
        return payload
