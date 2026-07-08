from app.schemas.matching import RecommendTaskWorkersRequest
from app.services.matching_service import MatchingService


class StubRuleRepository:
    def get_rule(self, rule_type: str, project_id: str | None = None):
        from app.domain.common.types import RuleConfig

        return RuleConfig(
            rule_type=rule_type,
            rule_version=f"{rule_type}_rules_test",
            config={
                "project_id": project_id,
                "base_score": 100.0,
                "active_load_penalty": 5.0,
                "pass_rate_bonus": 10.0,
                "strong_pass_rate_threshold": 0.9,
                "high_load_threshold": 3,
                "rework_original_worker_boost": 20.0,
            },
        )


class StubFeatureService:
    def __init__(self, features_by_worker_id: dict[str, dict]) -> None:
        self.features_by_worker_id = features_by_worker_id
        self.seen_worker_ids: list[str] = []

    def get_worker_features(self, payload: dict) -> dict:
        worker_id = payload["worker_id"]
        self.seen_worker_ids.append(worker_id)
        return self.features_by_worker_id[worker_id]


def test_recommend_uses_feature_service_per_worker_output_for_scoring() -> None:
    feature_service = StubFeatureService(
        features_by_worker_id={
            "worker-a": {"active_load": 1, "recent_pass_rate": 0.3},
            "worker-b": {"active_load": 1, "recent_pass_rate": 0.95},
        }
    )
    service = MatchingService(
        rule_repository=StubRuleRepository(),
        feature_service=feature_service,
    )

    response = service.recommend(
        RecommendTaskWorkersRequest(
            task_id="task-1",
            project_id="project-1",
            batch_id="batch-1",
            candidate_worker_ids=["worker-a", "worker-b"],
            top_k=2,
            context={
                "worker_profiles": {
                    "worker-a": {"active_load": 10, "pass_rate": 0.99},
                    "worker-b": {"active_load": 0, "pass_rate": 0.1},
                }
            },
        )
    )

    assert feature_service.seen_worker_ids == ["worker-a", "worker-b"]
    assert response.rule_version == "matching_rules_test"
    assert response.result.recommendations[0].worker_id == "worker-b"
    assert response.result.recommendations[0].reasons == [
        "active_load_considered",
        "recent_pass_rate_considered",
        "recent_pass_rate_high",
    ]


def test_recommend_promotes_explanations_and_warnings_to_service_envelope() -> None:
    service = MatchingService(
        rule_repository=StubRuleRepository(),
        feature_service=StubFeatureService(
            features_by_worker_id={
                "worker-b": {"active_load": 4, "recent_pass_rate": 0.95},
            }
        ),
    )

    response = service.recommend(
        RecommendTaskWorkersRequest(
            task_id="task-1",
            project_id="project-1",
            batch_id="batch-1",
            candidate_worker_ids=["worker-b"],
            top_k=1,
            context={"is_rework": True, "original_worker_id": "worker-b"},
        )
    )

    assert response.result.recommendations[0].reasons == [
        "active_load_considered",
        "recent_pass_rate_considered",
        "recent_pass_rate_high",
        "rework_original_worker_preferred",
    ]
    assert response.result.recommendations[0].warnings == ["load_high"]
    assert [reason.code for reason in response.reasons] == [
        "active_load_considered",
        "recent_pass_rate_considered",
        "recent_pass_rate_high",
        "rework_original_worker_preferred",
    ]
    assert response.reasons[-1].message == "Original worker received a rework continuity boost."
    assert [warning.code for warning in response.warnings] == ["load_high"]
    assert response.warnings[0].message == "Active workload is at or above the high-load threshold."


def test_recommend_uses_rule_config_thresholds_for_warning_and_boost_behavior() -> None:
    class CustomRuleRepository(StubRuleRepository):
        def get_rule(self, rule_type: str, project_id: str | None = None):
            rule = super().get_rule(rule_type, project_id)
            rule.config.update(
                {
                    "active_load_penalty": 2.0,
                    "pass_rate_bonus": 20.0,
                    "high_load_threshold": 5,
                    "strong_pass_rate_threshold": 0.85,
                    "rework_original_worker_boost": 8.0,
                }
            )
            return rule

    service = MatchingService(
        rule_repository=CustomRuleRepository(),
        feature_service=StubFeatureService(
            features_by_worker_id={
                "worker-a": {"active_load": 4, "recent_pass_rate": 0.86},
                "worker-b": {"active_load": 1, "recent_pass_rate": 0.8},
            }
        ),
    )

    response = service.recommend(
        RecommendTaskWorkersRequest(
            task_id="task-1",
            project_id="project-1",
            batch_id="batch-1",
            candidate_worker_ids=["worker-a", "worker-b"],
            top_k=1,
            context={"is_rework": True, "original_worker_id": "worker-a"},
        )
    )

    recommendation = response.result.recommendations[0]
    assert recommendation.worker_id == "worker-a"
    assert recommendation.score == 117.2
    assert recommendation.reasons[-2:] == [
        "recent_pass_rate_high",
        "rework_original_worker_preferred",
    ]
    assert recommendation.warnings == []


def test_recommend_returns_warning_and_conservative_score_when_worker_features_are_missing() -> None:
    service = MatchingService(
        rule_repository=StubRuleRepository(),
        feature_service=StubFeatureService(
            features_by_worker_id={
                "worker-a": {},
                "worker-b": {"active_load": 1, "recent_pass_rate": 0.8},
            }
        ),
    )

    response = service.recommend(
        RecommendTaskWorkersRequest(
            task_id="task-1",
            project_id="project-1",
            batch_id="batch-1",
            candidate_worker_ids=["worker-a", "worker-b"],
            top_k=2,
            context={},
        )
    )

    recommendations = response.result.recommendations
    assert [item.worker_id for item in recommendations] == ["worker-b", "worker-a"]
    assert recommendations[1].score < 0
    assert [warning.code for warning in response.warnings] == [
        "worker_features_missing",
        "load_high",
    ]
    assert response.warnings[0].message == (
        "Conservative defaults were used because worker features were missing: "
        "worker-a(active_load, recent_pass_rate)."
    )
    assert response.warnings[1].message == (
        "Active workload is at or above the high-load threshold."
    )
