from typing import Any

from app.infra.repositories.feature_repository import FeatureRepository


class FeatureService:
    def __init__(self, repository: FeatureRepository | None = None) -> None:
        self.repository = repository or FeatureRepository()

    def get_task_features(self, payload: dict[str, Any]) -> dict[str, Any]:
        source = self.repository.get_task_features(payload)
        context = self._get_context(source)
        return {
            "rework_count": context.get("rework_count", 0),
            "deadline_hours_left": context.get("deadline_hours_left", 999),
            "historical_defect_rate": context.get("historical_defect_rate", 0.0),
        }

    def get_worker_features(self, payload: dict[str, Any]) -> dict[str, Any]:
        source = self.repository.get_worker_features(payload)
        context = self._get_context(source)
        worker_id = source.get("worker_id", payload.get("worker_id"))

        if worker_id and isinstance(context.get("worker_profiles"), dict):
            worker_context = context["worker_profiles"].get(worker_id)
            if isinstance(worker_context, dict):
                context = worker_context

        return {
            "recent_pass_rate": context.get(
                "recent_pass_rate",
                context.get("pass_rate", 1.0),
            ),
            "recent_rework_rate": context.get("recent_rework_rate", 0.0),
            "active_load": context.get("active_load", 0),
        }

    def get_batch_features(self, payload: dict[str, Any]) -> dict[str, Any]:
        source = self.repository.get_batch_features(payload)
        context = self._get_context(source)
        task_pool = source.get("task_pool", payload.get("task_pool", []))
        return {
            "batch_risk_level": context.get("batch_risk_level", "low"),
            "task_count": context.get("task_count", len(task_pool)),
            "task_pool": [
                {
                    "task_id": task.get("task_id"),
                    "risk_level": task.get("risk_level", "low"),
                }
                for task in task_pool
            ],
        }

    @staticmethod
    def _get_context(source: dict[str, Any]) -> dict[str, Any]:
        context = source.get("context")
        if isinstance(context, dict):
            return context
        return source
