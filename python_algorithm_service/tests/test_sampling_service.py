from app.schemas.sampling import BatchSamplingRequest
from app.services.sampling_service import SamplingService


class StubRuleRepository:
    def get_rule(self, rule_type: str, project_id: str | None = None):
        from app.domain.common.types import RuleConfig

        return RuleConfig(
            rule_type=rule_type,
            rule_version=f"{rule_type}_rules_test",
            config={
                "project_id": project_id,
                "ratio_by_risk_level": {"low": 0.1, "medium": 0.2, "high": 0.3},
                "forced_risk_levels": ["high"],
                "fallback_to_first_available": True,
            },
        )


class StubFeatureService:
    def __init__(self, batch_features: dict) -> None:
        self.batch_features = batch_features

    def get_batch_features(self, payload: dict) -> dict:
        assert "task_pool" in payload
        assert "context" in payload
        return self.batch_features


def test_plan_batch_uses_feature_service_task_pool_and_marks_fallback_warning() -> None:
    service = SamplingService(
        rule_repository=StubRuleRepository(),
        feature_service=StubFeatureService(
            batch_features={
                "batch_risk_level": "medium",
                "task_count": 2,
                "task_pool": [
                    {"task_id": "feature-task-1", "risk_level": "low"},
                    {"task_id": "feature-task-2", "risk_level": "medium"},
                ],
            }
        ),
    )

    response = service.plan_batch(
        BatchSamplingRequest(
            batch_id="batch-1",
            project_id="project-1",
            task_pool=[{"task_id": "payload-task", "risk_level": "high"}],
            context={"batch_risk_level": "high", "task_count": 1},
        )
    )

    assert response.rule_version == "sampling_rules_test"
    assert response.result.sampling_ratio == 0.2
    assert response.result.selected_task_ids == ["feature-task-2"]
    assert response.result.recommendation_flags == ["fallback_to_first_available_task"]
    assert response.warnings[0].code == "sampling_fallback_applied"
    assert (
        response.warnings[0].message
        == "No high-risk task was available, so baseline tasks were selected using the seeded fallback strategy."
    )
    assert response.reasons[0].message == "Sampling ratio set to 20% for a medium-risk batch."


def test_plan_batch_uses_rule_config_to_fill_ratio_target_count() -> None:
    class CustomRuleRepository(StubRuleRepository):
        def get_rule(self, rule_type: str, project_id: str | None = None):
            rule = super().get_rule(rule_type, project_id)
            rule.config["ratio_by_risk_level"] = {"low": 0.1, "medium": 0.2, "high": 0.5}
            return rule

    service = SamplingService(
        rule_repository=CustomRuleRepository(),
        feature_service=StubFeatureService(
            batch_features={
                "batch_risk_level": "high",
                "task_count": 6,
                "task_pool": [
                    {"task_id": "t-1", "risk_level": "high"},
                    {"task_id": "t-2", "risk_level": "low"},
                    {"task_id": "t-3", "risk_level": "medium"},
                    {"task_id": "t-4", "risk_level": "low"},
                ],
            }
        ),
    )

    response = service.plan_batch(
        BatchSamplingRequest(
            batch_id="batch-1",
            project_id="project-1",
            task_pool=[],
            context={},
        )
    )

    assert response.result.sampling_ratio == 0.5
    assert response.result.sample_count == 3
    assert response.result.selected_task_ids == ["t-1", "t-3", "t-4"]


def test_plan_batch_uses_conservative_high_risk_defaults_and_warning_when_batch_features_are_missing() -> None:
    service = SamplingService(
        rule_repository=StubRuleRepository(),
        feature_service=StubFeatureService(
            batch_features={
                "task_pool": [
                    {"task_id": "t-1", "risk_level": "low"},
                    {"task_id": "t-2", "risk_level": "low"},
                    {"task_id": "t-3", "risk_level": "low"},
                ],
            }
        ),
    )

    response = service.plan_batch(
        BatchSamplingRequest(
            batch_id="batch-9",
            project_id="project-1",
            task_pool=[],
            context={},
        )
    )

    assert response.result.sampling_ratio == 0.3
    assert response.result.sample_count == 1
    assert [warning.code for warning in response.warnings] == [
        "batch_features_missing",
        "sampling_fallback_applied",
    ]
    assert response.warnings[0].message == (
        "Conservative defaults were used because sampling features were missing: "
        "batch_risk_level."
    )
    assert response.warnings[1].message == (
        "No high-risk task was available, so baseline tasks were selected using "
        "the seeded fallback strategy."
    )
