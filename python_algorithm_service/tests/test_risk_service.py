from app.schemas.risk import TaskRiskRequest, WorkerRiskRequest
from app.services.risk_service import RiskService


class StubRuleRepository:
    def get_rule(self, rule_type: str, project_id: str | None = None):
        from app.domain.common.types import RuleConfig

        return RuleConfig(
            rule_type=rule_type,
            rule_version=f"{rule_type}_rules_test",
            config={"project_id": project_id},
        )


class StubFeatureService:
    def __init__(self, task_features: dict, worker_features: dict) -> None:
        self.task_features = task_features
        self.worker_features = worker_features

    def get_task_features(self, payload: dict) -> dict:
        assert "context" in payload
        return self.task_features

    def get_worker_features(self, payload: dict) -> dict:
        assert "context" in payload
        return self.worker_features


def test_score_task_uses_feature_service_output_instead_of_raw_payload_context() -> None:
    service = RiskService(
        rule_repository=StubRuleRepository(),
        feature_service=StubFeatureService(
            task_features={
                "rework_count": 0,
                "deadline_hours_left": 48,
                "historical_defect_rate": 0.05,
            },
            worker_features={},
        ),
    )

    response = service.score_task(
        TaskRiskRequest(
            task_id="task-1",
            project_id="project-1",
            context={
                "rework_count": 3,
                "deadline_hours_left": 1,
                "historical_defect_rate": 0.5,
            },
        )
    )

    assert response.rule_version == "task_risk_rules_test"
    assert response.result.risk_level == "low"
    assert response.result.reason_codes == []


def test_score_worker_returns_human_readable_reason_messages() -> None:
    service = RiskService(
        rule_repository=StubRuleRepository(),
        feature_service=StubFeatureService(
            task_features={},
            worker_features={
                "recent_pass_rate": 0.7,
                "recent_rework_rate": 0.25,
                "active_load": 5,
            },
        ),
    )

    response = service.score_worker(
        WorkerRiskRequest(
            worker_id="worker-1",
            project_id="project-1",
            window_type="14d",
            context={"recent_pass_rate": 0.99},
        )
    )

    assert response.result.risk_level == "high"
    assert response.reasons[0].code == "pass_rate_drop"
    assert response.reasons[0].message == "Recent pass rate dropped below the healthy threshold."
    assert response.reasons[1].message == "Recent rework rate is above the acceptable threshold."
    assert response.reasons[2].message == "Active workload is at or above the high-load threshold."
