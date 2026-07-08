from fastapi.testclient import TestClient

from app.domain.common.types import RuleConfig
from app.infra.repositories.rule_repository import RuleRepository
from app.services.feature_service import FeatureService
from app.main import create_app


def test_openapi_contains_service_name() -> None:
    client = TestClient(create_app())

    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.json()["info"]["title"] == "Python Algorithm Service"


def test_health_endpoint_returns_envelope_with_versions() -> None:
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()

    assert body["service"] == "health"
    assert body["service_version"] == "v1"
    assert body["rule_version"] == "health_rules_v1"
    assert body["feature_version"] == "health_feature_v1"
    assert body["result"] == {"status": "ok"}
    assert body["reasons"] == []
    assert body["warnings"] == []
    assert body["debug"] == {}
    assert isinstance(body["request_id"], str)
    assert len(body["request_id"]) > 0


def test_rule_repository_returns_rule_config() -> None:
    repository = RuleRepository()

    rule = repository.get_rule("health", project_id="project-123")

    assert rule == RuleConfig(
        rule_type="health",
        rule_version="health_rules_v1",
        config={"project_id": "project-123"},
    )


def test_feature_service_returns_normalized_task_features() -> None:
    service = FeatureService()

    payload = {
        "task_id": "task-1",
        "priority": 5,
        "context": {
            "rework_count": 2,
            "deadline_hours_left": 3,
            "historical_defect_rate": 0.4,
        },
    }

    assert service.get_task_features(payload) == {
        "rework_count": 2,
        "deadline_hours_left": 3,
        "historical_defect_rate": 0.4,
    }
