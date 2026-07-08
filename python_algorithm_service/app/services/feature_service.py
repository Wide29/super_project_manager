from dataclasses import dataclass, field
from typing import Any

from app.domain.common.enums import RiskLevel
from app.infra.repositories.feature_repository import FeatureRepository


@dataclass(frozen=True)
class FeatureSnapshot:
    values: dict[str, Any]
    missing_fields: list[str] = field(default_factory=list)


class FeatureService:
    def __init__(self, repository: FeatureRepository | None = None) -> None:
        self.repository = repository or FeatureRepository()

    def get_task_features(self, payload: dict[str, Any]) -> FeatureSnapshot:
        source = self.repository.get_task_features(payload)
        return self.normalize_task_features(source)

    def get_worker_features(self, payload: dict[str, Any]) -> FeatureSnapshot:
        source = self.repository.get_worker_features(payload)
        return self.normalize_worker_features(source, payload)

    def get_batch_features(self, payload: dict[str, Any]) -> FeatureSnapshot:
        source = self.repository.get_batch_features(payload)
        return self.normalize_batch_features(source, payload)

    @classmethod
    def ensure_task_snapshot(cls, source: FeatureSnapshot | dict[str, Any]) -> FeatureSnapshot:
        if isinstance(source, FeatureSnapshot):
            return source
        return cls.normalize_task_features(source)

    @classmethod
    def ensure_worker_snapshot(
        cls,
        source: FeatureSnapshot | dict[str, Any],
        payload: dict[str, Any],
    ) -> FeatureSnapshot:
        if isinstance(source, FeatureSnapshot):
            return source
        return cls.normalize_worker_features(source, payload)

    @classmethod
    def ensure_batch_snapshot(
        cls,
        source: FeatureSnapshot | dict[str, Any],
        payload: dict[str, Any],
    ) -> FeatureSnapshot:
        if isinstance(source, FeatureSnapshot):
            return source
        return cls.normalize_batch_features(source, payload)

    @classmethod
    def normalize_task_features(cls, source: dict[str, Any]) -> FeatureSnapshot:
        context = cls._get_context(source)
        values: dict[str, Any] = {}
        missing_fields: list[str] = []

        cls._set_value(
            values,
            missing_fields,
            context,
            "rework_count",
            999,
        )
        cls._set_value(
            values,
            missing_fields,
            context,
            "deadline_hours_left",
            0,
        )
        cls._set_value(
            values,
            missing_fields,
            context,
            "historical_defect_rate",
            1.0,
        )

        return FeatureSnapshot(values=values, missing_fields=missing_fields)

    @classmethod
    def normalize_worker_features(
        cls,
        source: dict[str, Any],
        payload: dict[str, Any],
    ) -> FeatureSnapshot:
        context = cls._get_context(source)
        worker_id = source.get("worker_id", payload.get("worker_id"))

        if worker_id and isinstance(context.get("worker_profiles"), dict):
            worker_context = context["worker_profiles"].get(worker_id)
            if isinstance(worker_context, dict):
                context = worker_context

        values: dict[str, Any] = {}
        missing_fields: list[str] = []

        recent_pass_rate = context.get("recent_pass_rate")
        if recent_pass_rate is None:
            recent_pass_rate = context.get("pass_rate")
        if recent_pass_rate is None:
            recent_pass_rate = 0.0
            missing_fields.append("recent_pass_rate")
        values["recent_pass_rate"] = recent_pass_rate

        cls._set_value(
            values,
            missing_fields,
            context,
            "recent_rework_rate",
            1.0,
        )
        cls._set_value(
            values,
            missing_fields,
            context,
            "active_load",
            999,
        )

        return FeatureSnapshot(values=values, missing_fields=missing_fields)

    @classmethod
    def normalize_batch_features(
        cls,
        source: dict[str, Any],
        payload: dict[str, Any],
    ) -> FeatureSnapshot:
        context = cls._get_context(source)
        task_pool = source.get("task_pool", payload.get("task_pool", []))
        values: dict[str, Any] = {}
        missing_fields: list[str] = []

        cls._set_value(
            values,
            missing_fields,
            context,
            "batch_risk_level",
            RiskLevel.HIGH.value,
        )
        values["task_count"] = context.get("task_count", len(task_pool))
        values["sampling_seed"] = context.get("sampling_seed")
        values["task_pool"] = [
            cls._normalize_sampling_task(task, index, missing_fields)
            for index, task in enumerate(task_pool)
        ]

        return FeatureSnapshot(values=values, missing_fields=missing_fields)

    @staticmethod
    def _get_context(source: dict[str, Any]) -> dict[str, Any]:
        context = source.get("context")
        if isinstance(context, dict):
            return context
        return source

    @staticmethod
    def _set_value(
        target: dict[str, Any],
        missing_fields: list[str],
        context: dict[str, Any],
        field_name: str,
        conservative_default: Any,
    ) -> None:
        value = context.get(field_name)
        if value is None:
            target[field_name] = conservative_default
            missing_fields.append(field_name)
            return
        target[field_name] = value

    @staticmethod
    def _normalize_sampling_task(
        task: Any,
        index: int,
        missing_fields: list[str],
    ) -> dict[str, Any]:
        task_data = task if isinstance(task, dict) else {}
        task_id = task_data.get("task_id")
        if task_id is None:
            missing_fields.append(f"task_pool[{index}].task_id")
        risk_level = task_data.get("risk_level")
        if risk_level is None:
            risk_level = RiskLevel.HIGH.value
            missing_fields.append(f"task_pool[{index}].risk_level")
        return {
            "task_id": task_id,
            "risk_level": risk_level,
        }
